import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AreaIntervencion, EstadoMaquina, EtapaImagen, Prisma, TipoIntervencion, Usuario } from '@prisma/client';
import { toMaquinaDto } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';
import {
  CompletarDiagnosticoDto,
  CreateIntervencionDto,
  CreateMaquinaDto,
  RegistrarRecepcionDto,
  RegistrarTransitoDto,
  UpdateMaquinaDto,
  UpdateMaquinaEstadoDto,
  UploadImagenDto,
} from './dto/maquina.dto';

const MAX_IMAGENES_POR_ETAPA = 10;

const VALID_TRANSITIONS: Record<EstadoMaquina, EstadoMaquina[]> = {
  COMPRADA_ITALIA: [EstadoMaquina.EN_TRANSITO],
  EN_TRANSITO: [EstadoMaquina.RECIBIDA],
  RECIBIDA: [EstadoMaquina.EN_DIAGNOSTICO],
  EN_DIAGNOSTICO: [EstadoMaquina.EN_MANTENIMIENTO, EstadoMaquina.LISTA_PARA_VENTA],
  EN_MANTENIMIENTO: [EstadoMaquina.LISTA_PARA_VENTA],
  LISTA_PARA_VENTA: [EstadoMaquina.RESERVADA, EstadoMaquina.VENDIDA],
  RESERVADA: [EstadoMaquina.LISTA_PARA_VENTA, EstadoMaquina.VENDIDA],
  VENDIDA: [],
};

@Injectable()
export class MaquinasService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async findAll(estado?: EstadoMaquina) {
    const maquinas = await this.prisma.maquina.findMany({
      where: estado ? { estado } : undefined,
      include: {
        proveedor: true,
        imagenes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return maquinas.map((m) => toMaquinaDto(m));
  }

  async findOne(id: string) {
    const maquina = await this.prisma.maquina.findUnique({
      where: { id },
      include: {
        proveedor: true,
        creadoPor: true,
        imagenes: { orderBy: { createdAt: 'desc' } },
        intervenciones: {
          orderBy: { createdAt: 'asc' },
          include: { registradoPor: true },
        },
      },
    });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    return toMaquinaDto(maquina);
  }

  async create(dto: CreateMaquinaDto, user: Usuario) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id: dto.proveedorId } });
    if (!proveedor) throw new BadRequestException('Proveedor no encontrado');

    const maquina = await this.prisma.maquina.create({
      data: {
        nombre: dto.nombre,
        tipo: dto.tipo,
        proveedorId: dto.proveedorId,
        descripcionLlegada: dto.descripcionLlegada,
        descripcionAcordada: dto.descripcionAcordada ?? dto.descripcionLlegada,
        fechaCompra: dto.fechaCompra ? new Date(dto.fechaCompra) : undefined,
        fechaLlegadaEstimada: dto.fechaLlegadaEstimada
          ? new Date(dto.fechaLlegadaEstimada)
          : undefined,
        creadoPorId: user.id,
      },
      include: { proveedor: true, creadoPor: true },
    });
    return toMaquinaDto(maquina);
  }

  async update(id: string, dto: UpdateMaquinaDto) {
    await this.ensureExists(id);
    const maquina = await this.prisma.maquina.update({
      where: { id },
      data: {
        descripcionLlegada: dto.descripcionLlegada,
        fechaLlegadaReal: dto.fechaLlegadaReal ? new Date(dto.fechaLlegadaReal) : undefined,
        precioVentaUsd: dto.precioVentaUsd ? new Prisma.Decimal(dto.precioVentaUsd) : undefined,
        tipoCambioUsado: dto.tipoCambioUsado ? new Prisma.Decimal(dto.tipoCambioUsado) : undefined,
        precioVentaBob: dto.precioVentaBob ? new Prisma.Decimal(dto.precioVentaBob) : undefined,
      },
      include: { proveedor: true, creadoPor: true, imagenes: true },
    });
    return toMaquinaDto(maquina);
  }

  async registrarTransito(id: string, dto: RegistrarTransitoDto) {
    const maquina = await this.prisma.maquina.findUnique({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    if (maquina.estado !== EstadoMaquina.COMPRADA_ITALIA) {
      throw new BadRequestException('Solo se puede despachar desde Comprada en Italia');
    }

    const updated = await this.prisma.maquina.update({
      where: { id },
      data: {
        estado: EstadoMaquina.EN_TRANSITO,
        fechaDespacho: new Date(dto.fechaDespacho),
        fechaLlegadaEstimada: dto.fechaLlegadaEstimada
          ? new Date(dto.fechaLlegadaEstimada)
          : maquina.fechaLlegadaEstimada,
      },
      include: { proveedor: true, creadoPor: true, imagenes: true, intervenciones: { include: { registradoPor: true } } },
    });
    return toMaquinaDto(updated);
  }

  async confirmarRecibida(id: string, fechaLlegadaReal?: string) {
    const maquina = await this.prisma.maquina.findUnique({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    if (maquina.estado !== EstadoMaquina.EN_TRANSITO) {
      throw new BadRequestException('Solo se puede recibir desde En tránsito');
    }

    const updated = await this.prisma.maquina.update({
      where: { id },
      data: {
        estado: EstadoMaquina.RECIBIDA,
        fechaLlegadaReal: fechaLlegadaReal ? new Date(fechaLlegadaReal) : new Date(),
      },
      include: { proveedor: true, creadoPor: true, imagenes: true, intervenciones: { include: { registradoPor: true } } },
    });
    return toMaquinaDto(updated);
  }

  async registrarRecepcion(
    id: string,
    dto: RegistrarRecepcionDto,
    files: Express.Multer.File[],
    user: Usuario,
  ) {
    const maquina = await this.prisma.maquina.findUnique({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    if (maquina.estado !== EstadoMaquina.RECIBIDA) {
      throw new BadRequestException('Complete la recepción solo cuando esté en estado Recibida');
    }

    if (files?.length) {
      await this.uploadImagenes(id, { etapa: EtapaImagen.LLEGADA }, files);
    }

    const updated = await this.prisma.maquina.update({
      where: { id },
      data: {
        descripcionLlegada: dto.descripcionLlegada,
        empleadoDiagnostico: dto.empleadoDiagnostico,
        fechaLlegadaReal: dto.fechaLlegadaReal ? new Date(dto.fechaLlegadaReal) : maquina.fechaLlegadaReal,
        estado: EstadoMaquina.EN_DIAGNOSTICO,
      },
      include: { proveedor: true, creadoPor: true, imagenes: true, intervenciones: { include: { registradoPor: true } } },
    });

    await this.prisma.intervencion.create({
      data: {
        maquinaId: id,
        tipo: TipoIntervencion.OBSERVACION_ADICIONAL,
        area: AreaIntervencion.MANTENIMIENTO_GENERAL,
        descripcion: `Recepción verificada. Asignado a ${dto.empleadoDiagnostico} para diagnóstico.`,
        responsable: user.nombre,
        registradoPorId: user.id,
      },
    });

    return toMaquinaDto(updated);
  }

  async completarDiagnostico(id: string, dto: CompletarDiagnosticoDto, user: Usuario) {
    const maquina = await this.prisma.maquina.findUnique({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');
    if (maquina.estado !== EstadoMaquina.EN_DIAGNOSTICO) {
      throw new BadRequestException('Solo se puede completar diagnóstico en ese estado');
    }

    const areas: { area: AreaIntervencion; texto?: string }[] = [
      { area: AreaIntervencion.MECANICA, texto: dto.mecanica?.trim() },
      { area: AreaIntervencion.ELECTRICA, texto: dto.electrica?.trim() },
      { area: AreaIntervencion.PINTADO, texto: dto.pintado?.trim() },
      { area: AreaIntervencion.MANTENIMIENTO_GENERAL, texto: dto.mantenimiento?.trim() },
    ];

    for (const a of areas) {
      if (!a.texto) continue;
      await this.prisma.intervencion.create({
        data: {
          maquinaId: id,
          tipo: TipoIntervencion.DIAGNOSTICO_INICIAL,
          area: a.area,
          descripcion: a.texto,
          responsable: dto.responsable,
          registradoPorId: user.id,
        },
      });
    }

    const requiereMantenimiento =
      dto.requiereMantenimiento ??
      Boolean(dto.mecanica?.trim() || dto.electrica?.trim() || dto.pintado?.trim() || dto.mantenimiento?.trim());

    const nuevoEstado = requiereMantenimiento
      ? EstadoMaquina.EN_MANTENIMIENTO
      : EstadoMaquina.LISTA_PARA_VENTA;

    const updated = await this.prisma.maquina.update({
      where: { id },
      data: { estado: nuevoEstado },
      include: { proveedor: true, creadoPor: true, imagenes: true, intervenciones: { include: { registradoPor: true } } },
    });
    return toMaquinaDto(updated);
  }

  async uploadNotaAudio(id: string, file: Express.Multer.File) {
    await this.ensureExists(id);
    const stored = await this.storage.saveAudio(file.buffer, file.originalname);
    await this.prisma.maquina.update({
      where: { id },
      data: { notaAudioUrl: stored.url },
    });
    return { url: stored.url };
  }

  async updateEstado(id: string, dto: UpdateMaquinaEstadoDto) {
    const maquina = await this.prisma.maquina.findUnique({ where: { id } });
    if (!maquina) throw new NotFoundException('Máquina no encontrada');

    const allowed = VALID_TRANSITIONS[maquina.estado];
    if (!allowed.includes(dto.estado)) {
      throw new BadRequestException(
        `Transición inválida de ${maquina.estado} a ${dto.estado}`,
      );
    }

    const updated = await this.prisma.maquina.update({
      where: { id },
      data: { estado: dto.estado },
      include: { proveedor: true, creadoPor: true },
    });
    return toMaquinaDto(updated);
  }

  async uploadImagenes(id: string, dto: UploadImagenDto, files: Express.Multer.File[]) {
    await this.ensureExists(id);
    if (!files?.length) throw new BadRequestException('Al menos una imagen es requerida');
    if (files.length > MAX_IMAGENES_POR_ETAPA) {
      throw new BadRequestException(`Máximo ${MAX_IMAGENES_POR_ETAPA} imágenes por carga`);
    }

    const existentes = await this.prisma.imagenMaquina.count({
      where: { maquinaId: id, etapa: dto.etapa },
    });
    if (existentes + files.length > MAX_IMAGENES_POR_ETAPA) {
      throw new BadRequestException(
        `Máximo ${MAX_IMAGENES_POR_ETAPA} fotos por etapa (${dto.etapa}). Ya hay ${existentes}.`,
      );
    }

    const results = [];
    for (const file of files) {
      const stored = await this.storage.saveImage(file.buffer, file.originalname);
      const imagen = await this.prisma.imagenMaquina.create({
        data: {
          maquinaId: id,
          etapa: dto.etapa,
          url: stored.url,
          thumbnailUrl: stored.thumbnailUrl,
        },
      });
      results.push({
        id: imagen.id,
        maquinaId: imagen.maquinaId,
        etapa: imagen.etapa,
        url: imagen.url,
        thumbnailUrl: imagen.thumbnailUrl,
        createdAt: imagen.createdAt.toISOString(),
      });
    }
    return results;
  }

  async uploadImagen(id: string, dto: UploadImagenDto, file: Express.Multer.File) {
    const [result] = await this.uploadImagenes(id, dto, [file]);
    return result;
  }

  async createIntervencion(id: string, dto: CreateIntervencionDto, user: Usuario) {
    await this.ensureExists(id);
    const intervencion = await this.prisma.intervencion.create({
      data: {
        maquinaId: id,
        tipo: dto.tipo,
        area: dto.area,
        descripcion: dto.descripcion,
        responsable: dto.responsable,
        registradoPorId: user.id,
      },
      include: { registradoPor: true },
    });

    return {
      id: intervencion.id,
      maquinaId: intervencion.maquinaId,
      tipo: intervencion.tipo,
      area: intervencion.area,
      descripcion: intervencion.descripcion,
      responsable: intervencion.responsable,
      registradoPor: {
        id: intervencion.registradoPor.id,
        nombre: intervencion.registradoPor.nombre,
        email: intervencion.registradoPor.email,
        rol: intervencion.registradoPor.rol,
        activo: intervencion.registradoPor.activo,
        createdAt: intervencion.registradoPor.createdAt.toISOString(),
      },
      createdAt: intervencion.createdAt.toISOString(),
    };
  }

  async getDashboardResumen() {
    const grouped = await this.prisma.maquina.groupBy({
      by: ['estado'],
      _count: { estado: true },
    });

    const porEstado = Object.values(EstadoMaquina).reduce(
      (acc, estado) => {
        acc[estado] = 0;
        return acc;
      },
      {} as Record<EstadoMaquina, number>,
    );

    for (const row of grouped) {
      porEstado[row.estado] = row._count.estado;
    }

    const total = Object.values(porEstado).reduce((sum, n) => sum + n, 0);
    return { total, porEstado };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.maquina.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Máquina no encontrada');
  }
}
