import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoMaquina, Usuario } from '@prisma/client';
import { toMaquinaDto } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';
import {
  CreateIntervencionDto,
  CreateMaquinaDto,
  UpdateMaquinaDto,
  UpdateMaquinaEstadoDto,
  UploadImagenDto,
} from './dto/maquina.dto';

const VALID_TRANSITIONS: Record<EstadoMaquina, EstadoMaquina[]> = {
  COMPRADA_ITALIA: [EstadoMaquina.EN_TRANSITO],
  EN_TRANSITO: [EstadoMaquina.RECIBIDA],
  RECIBIDA: [EstadoMaquina.EN_DIAGNOSTICO],
  EN_DIAGNOSTICO: [EstadoMaquina.EN_MANTENIMIENTO],
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
      },
      include: { proveedor: true, creadoPor: true },
    });
    return toMaquinaDto(maquina);
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

  async uploadImagen(id: string, dto: UploadImagenDto, file: Express.Multer.File) {
    await this.ensureExists(id);
    if (!file) throw new BadRequestException('Archivo requerido');

    const stored = await this.storage.saveImage(file.buffer, file.originalname);
    const imagen = await this.prisma.imagenMaquina.create({
      data: {
        maquinaId: id,
        etapa: dto.etapa,
        url: stored.url,
        thumbnailUrl: stored.thumbnailUrl,
      },
    });

    return {
      id: imagen.id,
      maquinaId: imagen.maquinaId,
      etapa: imagen.etapa,
      url: imagen.url,
      thumbnailUrl: imagen.thumbnailUrl,
      createdAt: imagen.createdAt.toISOString(),
    };
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
