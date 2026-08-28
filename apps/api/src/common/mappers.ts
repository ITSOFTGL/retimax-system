import { Decimal } from '@prisma/client/runtime/library';

export function decimalToString(value: Decimal | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.toString();
}

export function toUsuarioDto(user: {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  empleadoId?: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    activo: user.activo,
    empleadoId: user.empleadoId ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toEmpleadoDto(emp: {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string;
  especialidad: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: emp.id,
    nombre: emp.nombre,
    apellido: emp.apellido,
    nombreCompleto: `${emp.nombre} ${emp.apellido}`,
    telefono: emp.telefono,
    email: emp.email,
    especialidad: emp.especialidad,
    activo: emp.activo,
    createdAt: emp.createdAt.toISOString(),
    updatedAt: emp.updatedAt.toISOString(),
  };
}

export function toIntervencionDto(i: {
  id: string;
  maquinaId: string;
  tipo: string;
  area: string;
  descripcion: string;
  responsableId: string | null;
  responsableNombre: string | null;
  estadoIntervencion: string;
  detalleTrabajo: string | null;
  observaciones: string | null;
  fechaAsignacion: Date | null;
  fechaInicio: Date | null;
  fechaFinalizacion: Date | null;
  fechaAprobacion: Date | null;
  estadoAprobacion: string;
  createdAt: Date;
  responsable?: {
    id: string;
    nombre: string;
    apellido: string;
    telefono?: string | null;
    email?: string;
    especialidad: string;
    activo?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  } | null;
  maquina?: {
    id: string;
    nombre: string;
    tipo: string;
    estado: string;
    proveedor?: { nombre: string };
  };
  registradoPor: { id: string; nombre: string; email: string; rol: string; activo: boolean; createdAt: Date };
  aprobadoPor?: { id: string; nombre: string; email: string; rol: string; activo: boolean; createdAt: Date } | null;
  finalizadoPor?: { id: string; nombre: string; apellido: string } | null;
}) {
  return {
    id: i.id,
    maquinaId: i.maquinaId,
    maquina: i.maquina
      ? {
          id: i.maquina.id,
          nombre: i.maquina.nombre,
          tipo: i.maquina.tipo,
          estado: i.maquina.estado,
          proveedor: i.maquina.proveedor?.nombre,
        }
      : undefined,
    tipo: i.tipo,
    area: i.area,
    descripcion: i.descripcion,
    responsableId: i.responsableId,
    responsableNombre: i.responsable
      ? `${i.responsable.nombre} ${i.responsable.apellido}`
      : i.responsableNombre,
    responsable: i.responsable
      ? toEmpleadoDto({
          id: i.responsable.id,
          nombre: i.responsable.nombre,
          apellido: i.responsable.apellido,
          telefono: i.responsable.telefono ?? null,
          email: i.responsable.email ?? '',
          especialidad: i.responsable.especialidad,
          activo: i.responsable.activo ?? true,
          createdAt: i.responsable.createdAt ?? i.createdAt,
          updatedAt: i.responsable.updatedAt ?? i.createdAt,
        })
      : null,
    estadoIntervencion: i.estadoIntervencion,
    detalleTrabajo: i.detalleTrabajo,
    observaciones: i.observaciones,
    fechaAsignacion: i.fechaAsignacion?.toISOString() ?? null,
    fechaInicio: i.fechaInicio?.toISOString() ?? null,
    fechaFinalizacion: i.fechaFinalizacion?.toISOString() ?? null,
    fechaAprobacion: i.fechaAprobacion?.toISOString() ?? null,
    estadoAprobacion: i.estadoAprobacion,
    registradoPor: toUsuarioDto(i.registradoPor),
    aprobadoPor: i.aprobadoPor ? toUsuarioDto(i.aprobadoPor) : null,
    finalizadoPor: i.finalizadoPor
      ? { id: i.finalizadoPor.id, nombre: `${i.finalizadoPor.nombre} ${i.finalizadoPor.apellido}` }
      : null,
    createdAt: i.createdAt.toISOString(),
  };
}

export function toHistorialEstadoDto(h: {
  id: string;
  maquinaId: string;
  estado: string;
  anterior: string | null;
  motivo: string | null;
  createdAt: Date;
  creadoPor: { id: string; nombre: string; email: string; rol: string; activo: boolean; createdAt: Date };
}) {
  return {
    id: h.id,
    maquinaId: h.maquinaId,
    estado: h.estado,
    anterior: h.anterior,
    motivo: h.motivo,
    creadoPor: toUsuarioDto(h.creadoPor),
    createdAt: h.createdAt.toISOString(),
  };
}

export function toMaquinaDto(maquina: {
  id: string;
  nombre: string;
  tipo: string;
  proveedorId: string;
  estado: string;
  descripcionLlegada: string | null;
  descripcionAcordada?: string | null;
  notaAudioUrl?: string | null;
  fechaDespacho?: Date | null;
  empleadoDiagnostico?: string | null;
  empleadoDiagnosticoId?: string | null;
  precioVentaUsd: Decimal | null;
  tipoCambioUsado: Decimal | null;
  precioVentaBob: Decimal | null;
  fechaCompra: Date | null;
  fechaLlegadaEstimada: Date | null;
  fechaLlegadaReal: Date | null;
  createdAt: Date;
  updatedAt: Date;
  proveedor?: { id: string; nombre: string; createdAt: Date };
  creadoPor?: { id: string; nombre: string; email: string; rol: string; activo: boolean; createdAt: Date };
  empleadoDiag?: { id: string; nombre: string; apellido: string; especialidad: string } | null;
  imagenes?: Array<{
    id: string;
    maquinaId: string;
    etapa: string;
    url: string;
    thumbnailUrl: string;
    createdAt: Date;
  }>;
  intervenciones?: Array<{
    id: string;
    maquinaId: string;
    tipo: string;
    area: string;
    descripcion: string;
    responsableId: string | null;
    responsableNombre: string | null;
    estadoIntervencion: string;
    detalleTrabajo: string | null;
    observaciones: string | null;
    fechaAsignacion: Date | null;
    fechaInicio: Date | null;
    fechaFinalizacion: Date | null;
    fechaAprobacion: Date | null;
    estadoAprobacion: string;
    createdAt: Date;
    responsable?: {
      id: string;
      nombre: string;
      apellido: string;
      telefono?: string | null;
      email?: string;
      especialidad: string;
      activo?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    } | null;
    registradoPor: { id: string; nombre: string; email: string; rol: string; activo: boolean; createdAt: Date };
    aprobadoPor?: { id: string; nombre: string; email: string; rol: string; activo: boolean; createdAt: Date } | null;
    finalizadoPor?: { id: string; nombre: string; apellido: string } | null;
  }>;
  historialEstados?: Array<{
    id: string;
    maquinaId: string;
    estado: string;
    anterior: string | null;
    motivo: string | null;
    createdAt: Date;
    creadoPor: { id: string; nombre: string; email: string; rol: string; activo: boolean; createdAt: Date };
  }>;
}) {
  return {
    id: maquina.id,
    nombre: maquina.nombre,
    tipo: maquina.tipo,
    proveedorId: maquina.proveedorId,
    proveedor: maquina.proveedor
      ? {
          id: maquina.proveedor.id,
          nombre: maquina.proveedor.nombre,
          createdAt: maquina.proveedor.createdAt.toISOString(),
        }
      : undefined,
    estado: maquina.estado,
    descripcionLlegada: maquina.descripcionLlegada,
    descripcionAcordada: maquina.descripcionAcordada ?? null,
    notaAudioUrl: maquina.notaAudioUrl ?? null,
    fechaDespacho: maquina.fechaDespacho?.toISOString() ?? null,
    empleadoDiagnostico: maquina.empleadoDiagnostico ?? null,
    empleadoDiagnosticoId: maquina.empleadoDiagnosticoId ?? null,
    empleadoDiag: maquina.empleadoDiag
      ? {
          id: maquina.empleadoDiag.id,
          nombreCompleto: `${maquina.empleadoDiag.nombre} ${maquina.empleadoDiag.apellido}`,
          especialidad: maquina.empleadoDiag.especialidad,
        }
      : null,
    precioVentaUsd: decimalToString(maquina.precioVentaUsd),
    tipoCambioUsado: decimalToString(maquina.tipoCambioUsado),
    precioVentaBob: decimalToString(maquina.precioVentaBob),
    fechaCompra: maquina.fechaCompra?.toISOString() ?? null,
    fechaLlegadaEstimada: maquina.fechaLlegadaEstimada?.toISOString() ?? null,
    fechaLlegadaReal: maquina.fechaLlegadaReal?.toISOString() ?? null,
    creadoPor: maquina.creadoPor ? toUsuarioDto(maquina.creadoPor) : undefined,
    imagenes: maquina.imagenes?.map((img) => ({
      id: img.id,
      maquinaId: img.maquinaId,
      etapa: img.etapa,
      url: img.url,
      thumbnailUrl: img.thumbnailUrl,
      createdAt: img.createdAt.toISOString(),
    })),
    intervenciones: maquina.intervenciones?.map((i) => toIntervencionDto(i)),
    historialEstados: maquina.historialEstados?.map((h) => toHistorialEstadoDto(h)),
    createdAt: maquina.createdAt.toISOString(),
    updatedAt: maquina.updatedAt.toISOString(),
  };
}

export function toReciboVentaDto(r: {
  id: string;
  numero: string;
  ventaId: string;
  fechaEmision: Date;
  createdAt: Date;
  venta?: {
    id: string;
    precioFinalUsd: Decimal;
    precioFinalBob: Decimal;
    tipoCambio: Decimal;
    fechaEntrega: Date;
    createdAt: Date;
    cliente: { nombre: string; telefono: string | null };
    maquina: { nombre: string; tipo: string; proveedor?: { nombre: string } };
  };
}) {
  return {
    id: r.id,
    numero: r.numero,
    ventaId: r.ventaId,
    fechaEmision: r.fechaEmision.toISOString(),
    createdAt: r.createdAt.toISOString(),
    venta: r.venta
      ? {
          id: r.venta.id,
          precioFinalUsd: decimalToString(r.venta.precioFinalUsd)!,
          precioFinalBob: decimalToString(r.venta.precioFinalBob)!,
          tipoCambio: decimalToString(r.venta.tipoCambio)!,
          fechaEntrega: r.venta.fechaEntrega.toISOString(),
          createdAt: r.venta.createdAt.toISOString(),
          cliente: r.venta.cliente,
          maquina: {
            nombre: r.venta.maquina.nombre,
            tipo: r.venta.maquina.tipo,
            proveedor: r.venta.maquina.proveedor?.nombre,
          },
        }
      : undefined,
  };
}

export function toReciboReservaDto(r: {
  id: string;
  numero: string;
  pedidoId: string;
  fechaEmision: Date;
  vigenciaDias: number;
  createdAt: Date;
  pedido?: {
    id: string;
    anticipoUsd: Decimal;
    saldoUsd: Decimal;
    totalUsd: Decimal;
    fechaEntregaEstimada: Date | null;
    descripcionReferencia: string | null;
    createdAt: Date;
    cliente: { nombre: string; telefono: string | null };
    maquina?: { nombre: string; tipo: string } | null;
  };
}) {
  return {
    id: r.id,
    numero: r.numero,
    pedidoId: r.pedidoId,
    fechaEmision: r.fechaEmision.toISOString(),
    vigenciaDias: r.vigenciaDias,
    createdAt: r.createdAt.toISOString(),
    pedido: r.pedido
      ? {
          id: r.pedido.id,
          anticipoUsd: decimalToString(r.pedido.anticipoUsd)!,
          saldoUsd: decimalToString(r.pedido.saldoUsd)!,
          totalUsd: decimalToString(r.pedido.totalUsd)!,
          fechaEntregaEstimada: r.pedido.fechaEntregaEstimada?.toISOString() ?? null,
          descripcionReferencia: r.pedido.descripcionReferencia,
          createdAt: r.pedido.createdAt.toISOString(),
          cliente: r.pedido.cliente,
          maquina: r.pedido.maquina,
        }
      : undefined,
  };
}
