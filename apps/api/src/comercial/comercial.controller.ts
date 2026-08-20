import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
  createPedido(@Body() dto: CreatePedidoDto) {
    return this.comercialService.createPedido(dto);
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
