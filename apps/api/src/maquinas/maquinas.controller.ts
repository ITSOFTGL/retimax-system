import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { EstadoMaquina, Usuario } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateIntervencionDto,
  CreateMaquinaDto,
  UpdateMaquinaDto,
  UpdateMaquinaEstadoDto,
  UploadImagenDto,
  RegistrarTransitoDto,
  RegistrarRecepcionDto,
  CompletarDiagnosticoDto,
} from './dto/maquina.dto';
import { MaquinasService } from './maquinas.service';

@Controller('maquinas')
export class MaquinasController {
  constructor(private readonly maquinasService: MaquinasService) {}

  @Get('dashboard/resumen')
  getDashboard() {
    return this.maquinasService.getDashboardResumen();
  }

  @Get()
  findAll(@Query('estado') estado?: EstadoMaquina) {
    return this.maquinasService.findAll(estado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maquinasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMaquinaDto, @CurrentUser() user: Usuario) {
    return this.maquinasService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaquinaDto) {
    return this.maquinasService.update(id, dto);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body() dto: UpdateMaquinaEstadoDto) {
    return this.maquinasService.updateEstado(id, dto);
  }

  @Post(':id/imagenes')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  uploadImagen(
    @Param('id') id: string,
    @Body() dto: UploadImagenDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.maquinasService.uploadImagen(id, dto, file);
  }

  @Post(':id/imagenes/lote')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  uploadImagenes(
    @Param('id') id: string,
    @Body() dto: UploadImagenDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('Al menos una imagen es requerida');
    return this.maquinasService.uploadImagenes(id, dto, files);
  }

  @Post(':id/transito')
  registrarTransito(@Param('id') id: string, @Body() dto: RegistrarTransitoDto) {
    return this.maquinasService.registrarTransito(id, dto);
  }

  @Post(':id/recibida')
  confirmarRecibida(
    @Param('id') id: string,
    @Body() body: { fechaLlegadaReal?: string },
  ) {
    return this.maquinasService.confirmarRecibida(id, body.fechaLlegadaReal);
  }

  @Post(':id/recepcion')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  registrarRecepcion(
    @Param('id') id: string,
    @Body() dto: RegistrarRecepcionDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: Usuario,
  ) {
    return this.maquinasService.registrarRecepcion(id, dto, files ?? [], user);
  }

  @Post(':id/diagnostico/completar')
  completarDiagnostico(
    @Param('id') id: string,
    @Body() dto: CompletarDiagnosticoDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.maquinasService.completarDiagnostico(id, dto, user);
  }

  @Post(':id/nota-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadNotaAudio(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo de audio requerido');
    return this.maquinasService.uploadNotaAudio(id, file);
  }

  @Post(':id/intervenciones')
  createIntervencion(
    @Param('id') id: string,
    @Body() dto: CreateIntervencionDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.maquinasService.createIntervencion(id, dto, user);
  }
}
