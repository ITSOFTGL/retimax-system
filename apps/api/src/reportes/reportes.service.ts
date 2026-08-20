import { Injectable } from '@nestjs/common';
import { EstadoMaquina, EstadoPedido } from '@prisma/client';
import { decimalToString } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async getResumen() {
    const [maquinas, ventas, totalClientes, totalProveedores] = await Promise.all([
      this.prisma.maquina.findMany({
        include: {
          proveedor: true,
          creadoPor: { select: { id: true, nombre: true } },
          venta: { include: { cliente: true } },
          pedidos: {
            where: { estado: { not: EstadoPedido.CANCELADO } },
            include: { cliente: true },
            orderBy: { createdAt: 'desc' },
          },
          imagenes: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.venta.findMany({
        include: {
          cliente: true,
          maquina: { include: { proveedor: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cliente.count(),
      this.prisma.proveedor.count(),
    ]);

    const porEstado = Object.values(EstadoMaquina).reduce(
      (acc, estado) => {
        acc[estado] = 0;
        return acc;
      },
      {} as Record<EstadoMaquina, number>,
    );
    for (const m of maquinas) {
      porEstado[m.estado] += 1;
    }

    let totalVentasUsd = 0;
    let totalVentasBob = 0;
    for (const v of ventas) {
      totalVentasUsd += Number(v.precioFinalUsd);
      totalVentasBob += Number(v.precioFinalBob);
    }

    return {
      resumen: {
        totalMaquinas: maquinas.length,
        totalVentas: ventas.length,
        totalClientes,
        totalProveedores,
        totalVentasUsd: totalVentasUsd.toFixed(2),
        totalVentasBob: totalVentasBob.toFixed(2),
        maquinasCompradas: porEstado.COMPRADA_ITALIA + porEstado.EN_TRANSITO,
        maquinasEnProceso:
          porEstado.RECIBIDA +
          porEstado.EN_DIAGNOSTICO +
          porEstado.EN_MANTENIMIENTO,
        maquinasDisponibles: porEstado.LISTA_PARA_VENTA,
        maquinasReservadas: porEstado.RESERVADA,
        maquinasVendidas: porEstado.VENDIDA,
      },
      porEstado,
      ventas: ventas.map((v) => ({
        id: v.id,
        maquinaId: v.maquinaId,
        maquinaNombre: v.maquina.nombre,
        maquinaTipo: v.maquina.tipo,
        proveedor: v.maquina.proveedor.nombre,
        clienteNombre: v.cliente.nombre,
        precioFinalUsd: decimalToString(v.precioFinalUsd)!,
        precioFinalBob: decimalToString(v.precioFinalBob)!,
        tipoCambio: decimalToString(v.tipoCambio)!,
        fechaEntrega: v.fechaEntrega.toISOString(),
        createdAt: v.createdAt.toISOString(),
      })),
      maquinas: maquinas.map((m) => {
        const pedidoActivo = m.pedidos.find((p) => p.estado !== EstadoPedido.CANCELADO);
        return {
          id: m.id,
          nombre: m.nombre,
          tipo: m.tipo,
          estado: m.estado,
          proveedor: m.proveedor.nombre,
          registradoPor: m.creadoPor.nombre,
          reservadaPor: pedidoActivo?.cliente.nombre ?? null,
          vendidaA: m.venta?.cliente.nombre ?? null,
          precioVentaUsd: decimalToString(m.precioVentaUsd),
          empleadoDiagnostico: m.empleadoDiagnostico,
          fechaDespacho: m.fechaDespacho?.toISOString() ?? null,
          fechaLlegadaReal: m.fechaLlegadaReal?.toISOString() ?? null,
          thumbnailUrl: m.imagenes[0]?.thumbnailUrl ?? null,
          updatedAt: m.updatedAt.toISOString(),
        };
      }),
      clientes: await this.prisma.cliente.findMany({
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          _count: { select: { ventas: true, pedidos: true } },
        },
      }).then((rows) =>
        rows.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          telefono: c.telefono,
          totalVentas: c._count.ventas,
          totalPedidos: c._count.pedidos,
        })),
      ),
      proveedores: await this.prisma.proveedor.findMany({
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { maquinas: true } } },
      }).then((rows) =>
        rows.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          totalMaquinas: p._count.maquinas,
        })),
      ),
    };
  }
}
