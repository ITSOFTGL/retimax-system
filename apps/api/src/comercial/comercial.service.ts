import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoMaquina, EstadoPedido, Prisma } from '@prisma/client';
import { decimalToString, toMaquinaDto } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';
import { CreatePedidoDto, CreateVentaDto, UpdatePedidoEstadoDto } from './dto/comercial.dto';

@Injectable()
export class ComercialService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async listPedidos() {
    const pedidos = await this.prisma.pedido.findMany({
      include: { cliente: true, maquina: { include: { proveedor: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return pedidos.map((p) => this.toPedidoDto(p));
  }

  async createPedido(dto: CreatePedidoDto) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } });
    if (!cliente) throw new BadRequestException('Cliente no encontrado');

    if (dto.maquinaId) {
      const maquina = await this.prisma.maquina.findUnique({ where: { id: dto.maquinaId } });
      if (!maquina) throw new BadRequestException('Máquina no encontrada');
    }

    const pedido = await this.prisma.pedido.create({
      data: {
        clienteId: dto.clienteId,
        maquinaId: dto.maquinaId,
        descripcionReferencia: dto.descripcionReferencia,
        anticipoUsd: new Prisma.Decimal(dto.anticipoUsd),
        saldoUsd: new Prisma.Decimal(dto.saldoUsd),
        totalUsd: new Prisma.Decimal(dto.totalUsd),
        fechaEntregaEstimada: dto.fechaEntregaEstimada
          ? new Date(dto.fechaEntregaEstimada)
          : undefined,
      },
      include: { cliente: true, maquina: { include: { proveedor: true } } },
    });

    if (pedido.maquinaId) {
      await this.prisma.maquina.update({
        where: { id: pedido.maquinaId },
        data: { estado: EstadoMaquina.RESERVADA },
      });
    }

    return this.toPedidoDto(pedido);
  }

  async updatePedidoEstado(id: string, dto: UpdatePedidoEstadoDto) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    const updated = await this.prisma.pedido.update({
      where: { id },
      data: { estado: dto.estado },
      include: { cliente: true, maquina: { include: { proveedor: true } } },
    });

    if (dto.estado === EstadoPedido.CANCELADO && updated.maquinaId) {
      await this.prisma.maquina.update({
        where: { id: updated.maquinaId },
        data: { estado: EstadoMaquina.LISTA_PARA_VENTA },
      });
    }

    return this.toPedidoDto(updated);
  }

  async listVentas() {
    const ventas = await this.prisma.venta.findMany({
      include: {
        cliente: true,
        maquina: { include: { proveedor: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ventas.map((v) => this.toVentaDto(v));
  }

  async createVenta(dto: CreateVentaDto) {
    const maquina = await this.prisma.maquina.findUnique({
      where: { id: dto.maquinaId },
      include: { venta: true },
    });
    if (!maquina) throw new BadRequestException('Máquina no encontrada');
    if (maquina.venta) throw new BadRequestException('La máquina ya fue vendida');
    if (
      maquina.estado !== EstadoMaquina.LISTA_PARA_VENTA &&
      maquina.estado !== EstadoMaquina.RESERVADA
    ) {
      throw new BadRequestException('La máquina no está lista para venta');
    }

    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } });
    if (!cliente) throw new BadRequestException('Cliente no encontrado');

    const venta = await this.prisma.$transaction(async (tx) => {
      const created = await tx.venta.create({
        data: {
          maquinaId: dto.maquinaId,
          clienteId: dto.clienteId,
          precioFinalUsd: new Prisma.Decimal(dto.precioFinalUsd),
          precioFinalBob: new Prisma.Decimal(dto.precioFinalBob),
          tipoCambio: new Prisma.Decimal(dto.tipoCambio),
          fechaEntrega: new Date(dto.fechaEntrega),
        },
        include: {
          cliente: true,
          maquina: { include: { proveedor: true } },
        },
      });

      await tx.maquina.update({
        where: { id: dto.maquinaId },
        data: {
          estado: EstadoMaquina.VENDIDA,
          precioVentaUsd: new Prisma.Decimal(dto.precioFinalUsd),
          precioVentaBob: new Prisma.Decimal(dto.precioFinalBob),
          tipoCambioUsado: new Prisma.Decimal(dto.tipoCambio),
        },
      });

      return created;
    });

    return this.toVentaDto(venta);
  }

  private toPedidoDto(pedido: {
    id: string;
    clienteId: string;
    maquinaId: string | null;
    descripcionReferencia: string | null;
    fotoReferenciaUrl: string | null;
    anticipoUsd: Prisma.Decimal;
    saldoUsd: Prisma.Decimal;
    totalUsd: Prisma.Decimal;
    fechaEntregaEstimada: Date | null;
    estado: EstadoPedido;
    createdAt: Date;
    updatedAt: Date;
    cliente: { id: string; nombre: string; telefono: string | null; notas: string | null; createdAt: Date };
    maquina?: {
      id: string;
      nombre: string;
      tipo: string;
      proveedorId: string;
      estado: string;
      descripcionLlegada: string | null;
      precioVentaUsd: Prisma.Decimal | null;
      tipoCambioUsado: Prisma.Decimal | null;
      precioVentaBob: Prisma.Decimal | null;
      fechaCompra: Date | null;
      fechaLlegadaEstimada: Date | null;
      fechaLlegadaReal: Date | null;
      createdAt: Date;
      updatedAt: Date;
      proveedor: { id: string; nombre: string; createdAt: Date };
    } | null;
  }) {
    return {
      id: pedido.id,
      clienteId: pedido.clienteId,
      cliente: {
        id: pedido.cliente.id,
        nombre: pedido.cliente.nombre,
        telefono: pedido.cliente.telefono,
        notas: pedido.cliente.notas,
        createdAt: pedido.cliente.createdAt.toISOString(),
      },
      maquinaId: pedido.maquinaId,
      maquina: pedido.maquina ? toMaquinaDto(pedido.maquina) : null,
      descripcionReferencia: pedido.descripcionReferencia,
      fotoReferenciaUrl: pedido.fotoReferenciaUrl,
      anticipoUsd: decimalToString(pedido.anticipoUsd)!,
      saldoUsd: decimalToString(pedido.saldoUsd)!,
      totalUsd: decimalToString(pedido.totalUsd)!,
      fechaEntregaEstimada: pedido.fechaEntregaEstimada?.toISOString() ?? null,
      estado: pedido.estado,
      createdAt: pedido.createdAt.toISOString(),
      updatedAt: pedido.updatedAt.toISOString(),
    };
  }

  private toVentaDto(venta: {
    id: string;
    maquinaId: string;
    clienteId: string;
    precioFinalUsd: Prisma.Decimal;
    precioFinalBob: Prisma.Decimal;
    tipoCambio: Prisma.Decimal;
    fechaEntrega: Date;
    createdAt: Date;
    cliente: { id: string; nombre: string; telefono: string | null; notas: string | null; createdAt: Date };
    maquina: {
      id: string;
      nombre: string;
      tipo: string;
      proveedorId: string;
      estado: string;
      descripcionLlegada: string | null;
      precioVentaUsd: Prisma.Decimal | null;
      tipoCambioUsado: Prisma.Decimal | null;
      precioVentaBob: Prisma.Decimal | null;
      fechaCompra: Date | null;
      fechaLlegadaEstimada: Date | null;
      fechaLlegadaReal: Date | null;
      createdAt: Date;
      updatedAt: Date;
      proveedor: { id: string; nombre: string; createdAt: Date };
    };
  }) {
    return {
      id: venta.id,
      maquinaId: venta.maquinaId,
      maquina: toMaquinaDto(venta.maquina),
      clienteId: venta.clienteId,
      cliente: {
        id: venta.cliente.id,
        nombre: venta.cliente.nombre,
        telefono: venta.cliente.telefono,
        notas: venta.cliente.notas,
        createdAt: venta.cliente.createdAt.toISOString(),
      },
      precioFinalUsd: decimalToString(venta.precioFinalUsd)!,
      precioFinalBob: decimalToString(venta.precioFinalBob)!,
      tipoCambio: decimalToString(venta.tipoCambio)!,
      fechaEntrega: venta.fechaEntrega.toISOString(),
      createdAt: venta.createdAt.toISOString(),
    };
  }
}
