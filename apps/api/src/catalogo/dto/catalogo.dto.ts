import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class CreateClienteDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsString()
  nitCi?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateProveedorDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class UpdateClienteDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsString()
  nitCi?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
