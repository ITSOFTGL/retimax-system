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
  createdAt: Date;
}) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    activo: user.activo,
    createdAt: user.createdAt.toISOString(),
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
    responsable: string;
    createdAt: Date;
    registradoPor: { id: string; nombre: string; email: string; rol: string; activo: boolean; createdAt: Date };
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
    intervenciones: maquina.intervenciones?.map((i) => ({
      id: i.id,
      maquinaId: i.maquinaId,
      tipo: i.tipo,
      area: i.area,
      descripcion: i.descripcion,
      responsable: i.responsable,
      registradoPor: toUsuarioDto(i.registradoPor),
      createdAt: i.createdAt.toISOString(),
    })),
    createdAt: maquina.createdAt.toISOString(),
    updatedAt: maquina.updatedAt.toISOString(),
  };
}
