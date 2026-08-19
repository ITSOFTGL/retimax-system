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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EstadoMaquina, Usuario } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateIntervencionDto,
  CreateMaquinaDto,
  UpdateMaquinaDto,
  UpdateMaquinaEstadoDto,
  UploadImagenDto,
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
      limits: { fileSize: 8 * 1024 * 1024 },
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

  @Post(':id/intervenciones')
  createIntervencion(
    @Param('id') id: string,
    @Body() dto: CreateIntervencionDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.maquinasService.createIntervencion(id, dto, user);
  }
}
