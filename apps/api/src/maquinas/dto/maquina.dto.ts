import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AreaIntervencion, EstadoMaquina, EtapaImagen, TipoIntervencion } from '@prisma/client';

export class CreateMaquinaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  tipo!: string;

  @IsUUID()
  proveedorId!: string;

  @IsOptional()
  @IsString()
  descripcionLlegada?: string;

  @IsOptional()
  @IsString()
  descripcionAcordada?: string;

  @IsOptional()
  @IsDateString()
  fechaCompra?: string;

  @IsOptional()
  @IsDateString()
  fechaLlegadaEstimada?: string;
}

export class UpdateMaquinaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  tipo?: string;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @IsOptional()
  @IsString()
  descripcionLlegada?: string;

  @IsOptional()
  @IsDateString()
  fechaLlegadaReal?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  precioCompraUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  precioVentaUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/)
  tipoCambioUsado?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  precioVentaBob?: string;
}

export class UpdateMaquinaEstadoDto {
  @IsEnum(EstadoMaquina)
  estado!: EstadoMaquina;

  @IsOptional()
  @IsString()
  motivo?: string;
}

export class UploadImagenDto {
  @IsEnum(EtapaImagen)
  etapa!: EtapaImagen;
}

export class RegistrarTransitoDto {
  @IsDateString()
  fechaDespacho!: string;

  @IsOptional()
  @IsDateString()
  fechaLlegadaEstimada?: string;
}

export class RegistrarRecepcionDto {
  @IsString()
  @MinLength(1)
  descripcionLlegada!: string;

  @ValidateIf((o) => !o.empleadoDiagnostico)
  @IsUUID()
  empleadoDiagnosticoId?: string;

  @ValidateIf((o) => !o.empleadoDiagnosticoId)
  @IsString()
  @MinLength(1)
  empleadoDiagnostico?: string;

  @IsOptional()
  @IsDateString()
  fechaLlegadaReal?: string;
}

export class CompletarDiagnosticoDto {
  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @IsOptional()
  @IsString()
  responsable?: string;

  @IsOptional()
  @IsString()
  mecanica?: string;

  @IsOptional()
  @IsString()
  electrica?: string;

  @IsOptional()
  @IsString()
  pintado?: string;

  @IsOptional()
  @IsString()
  mantenimiento?: string;

  @IsOptional()
  requiereMantenimiento?: boolean;
}

export class CreateIntervencionDto {
  @IsEnum(TipoIntervencion)
  tipo!: TipoIntervencion;

  @IsEnum(AreaIntervencion)
  area!: AreaIntervencion;

  @IsString()
  @MinLength(1)
  descripcion!: string;

  @IsUUID()
  responsableId!: string;
}
