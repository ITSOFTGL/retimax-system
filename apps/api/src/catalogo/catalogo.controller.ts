import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateClienteDto, CreateProveedorDto } from './dto/catalogo.dto';
import { CatalogoService } from './catalogo.service';

@Controller()
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('proveedores')
  listProveedores() {
    return this.catalogoService.listProveedores();
  }

  @Post('proveedores')
  createProveedor(@Body() dto: CreateProveedorDto) {
    return this.catalogoService.createProveedor(dto);
  }

  @Get('clientes')
  listClientes() {
    return this.catalogoService.listClientes();
  }

  @Post('clientes')
  createCliente(@Body() dto: CreateClienteDto) {
    return this.catalogoService.createCliente(dto);
  }
}
