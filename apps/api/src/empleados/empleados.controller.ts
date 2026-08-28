import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateEmpleadoDto, UpdateEmpleadoDto } from './dto/empleado.dto';
import { EmpleadosService } from './empleados.service';

@Controller('empleados')
@UseGuards(RolesGuard)
@Roles(Rol.ADMIN)
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  @Get()
  findAll(@Query('incluirInactivos') incluirInactivos?: string) {
    return this.empleadosService.findAll(incluirInactivos === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empleadosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEmpleadoDto) {
    return this.empleadosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmpleadoDto) {
    return this.empleadosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empleadosService.remove(id);
  }
}
