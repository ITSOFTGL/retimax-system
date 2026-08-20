export enum Rol {
  ADMIN = 'ADMIN',
  OPERARIO = 'OPERARIO',
}

export enum EstadoMaquina {
  COMPRADA_ITALIA = 'COMPRADA_ITALIA',
  EN_TRANSITO = 'EN_TRANSITO',
  RECIBIDA = 'RECIBIDA',
  EN_DIAGNOSTICO = 'EN_DIAGNOSTICO',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
  LISTA_PARA_VENTA = 'LISTA_PARA_VENTA',
  RESERVADA = 'RESERVADA',
  VENDIDA = 'VENDIDA',
}

export enum EtapaImagen {
  EMBARQUE = 'EMBARQUE',
  LLEGADA = 'LLEGADA',
  OTRA = 'OTRA',
}

export enum TipoIntervencion {
  DIAGNOSTICO_INICIAL = 'DIAGNOSTICO_INICIAL',
  TRABAJO_REALIZADO = 'TRABAJO_REALIZADO',
  OBSERVACION_ADICIONAL = 'OBSERVACION_ADICIONAL',
}

export enum AreaIntervencion {
  MECANICA = 'MECANICA',
  ELECTRICA = 'ELECTRICA',
  PINTADO = 'PINTADO',
  MANTENIMIENTO_GENERAL = 'MANTENIMIENTO_GENERAL',
}

export enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export interface UsuarioDto {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  usuario: UsuarioDto;
}

export interface ProveedorDto {
  id: string;
  nombre: string;
  createdAt: string;
}

export interface ClienteDto {
  id: string;
  nombre: string;
  telefono?: string | null;
  notas?: string | null;
  createdAt: string;
}

export interface ImagenMaquinaDto {
  id: string;
  maquinaId: string;
  etapa: EtapaImagen;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface IntervencionDto {
  id: string;
  maquinaId: string;
  tipo: TipoIntervencion;
  area: AreaIntervencion;
  descripcion: string;
  responsable: string;
  registradoPor: UsuarioDto;
  createdAt: string;
}

export interface MaquinaDto {
  id: string;
  nombre: string;
  tipo: string;
  proveedorId: string;
  proveedor?: ProveedorDto;
  estado: EstadoMaquina;
  descripcionLlegada?: string | null;
  descripcionAcordada?: string | null;
  notaAudioUrl?: string | null;
  fechaDespacho?: string | null;
  empleadoDiagnostico?: string | null;
  precioVentaUsd?: string | null;
  tipoCambioUsado?: string | null;
  precioVentaBob?: string | null;
  fechaCompra?: string | null;
  fechaLlegadaEstimada?: string | null;
  fechaLlegadaReal?: string | null;
  creadoPor?: UsuarioDto;
  imagenes?: ImagenMaquinaDto[];
  intervenciones?: IntervencionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PedidoDto {
  id: string;
  clienteId: string;
  cliente?: ClienteDto;
  maquinaId?: string | null;
  maquina?: MaquinaDto | null;
  descripcionReferencia?: string | null;
  fotoReferenciaUrl?: string | null;
  anticipoUsd: string;
  saldoUsd: string;
  totalUsd: string;
  fechaEntregaEstimada?: string | null;
  estado: EstadoPedido;
  createdAt: string;
  updatedAt: string;
}

export interface VentaDto {
  id: string;
  maquinaId: string;
  maquina?: MaquinaDto;
  clienteId: string;
  cliente?: ClienteDto;
  precioFinalUsd: string;
  precioFinalBob: string;
  tipoCambio: string;
  fechaEntrega: string;
  createdAt: string;
}

export interface DashboardResumen {
  total: number;
  porEstado: Record<EstadoMaquina, number>;
}

export interface CreateMaquinaRequest {
  nombre: string;
  tipo: string;
  proveedorId: string;
  descripcionLlegada?: string;
  descripcionAcordada?: string;
  fechaCompra?: string;
  fechaLlegadaEstimada?: string;
}

export interface UpdateMaquinaEstadoRequest {
  estado: EstadoMaquina;
}

export interface CreateIntervencionRequest {
  tipo: TipoIntervencion;
  area: AreaIntervencion;
  descripcion: string;
  responsable: string;
}

export interface CreateProveedorRequest {
  nombre: string;
}

export interface CreateClienteRequest {
  nombre: string;
  telefono?: string;
  notas?: string;
}

export interface CreatePedidoRequest {
  clienteId: string;
  maquinaId?: string;
  descripcionReferencia?: string;
  anticipoUsd: string;
  saldoUsd: string;
  totalUsd: string;
  fechaEntregaEstimada?: string;
}

export interface CreateVentaRequest {
  maquinaId: string;
  clienteId: string;
  precioFinalUsd: string;
  precioFinalBob: string;
  tipoCambio: string;
  fechaEntrega: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
