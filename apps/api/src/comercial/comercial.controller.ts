import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ComercialService } from './comercial.service';
import { CreatePedidoDto, CreateVentaDto, UpdatePedidoEstadoDto } from './dto/comercial.dto';

@Controller()
export class ComercialController {
  constructor(private readonly comercialService: ComercialService) {}

  @Get('pedidos')
  listPedidos() {
    return this.comercialService.listPedidos();
  }

  @Post('pedidos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  createPedido(
    @Body() dto: CreatePedidoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.comercialService.createPedido(dto, file);
  }

  @Patch('pedidos/:id/estado')
  updatePedidoEstado(@Param('id') id: string, @Body() dto: UpdatePedidoEstadoDto) {
    return this.comercialService.updatePedidoEstado(id, dto);
  }

  @Get('ventas')
  listVentas() {
    return this.comercialService.listVentas();
  }

  @Post('ventas')
  createVenta(@Body() dto: CreateVentaDto) {
    return this.comercialService.createVenta(dto);
  }
}
