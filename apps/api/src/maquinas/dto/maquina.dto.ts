import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
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
  @IsDateString()
  fechaCompra?: string;

  @IsOptional()
  @IsDateString()
  fechaLlegadaEstimada?: string;
}

export class UpdateMaquinaDto {
  @IsOptional()
  @IsString()
  descripcionLlegada?: string;

  @IsOptional()
  @IsDateString()
  fechaLlegadaReal?: string;

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
}

export class UploadImagenDto {
  @IsEnum(EtapaImagen)
  etapa!: EtapaImagen;
}

export class CreateIntervencionDto {
  @IsEnum(TipoIntervencion)
  tipo!: TipoIntervencion;

  @IsEnum(AreaIntervencion)
  area!: AreaIntervencion;

  @IsString()
  @MinLength(1)
  descripcion!: string;

  @IsString()
  @MinLength(1)
  responsable!: string;
}
