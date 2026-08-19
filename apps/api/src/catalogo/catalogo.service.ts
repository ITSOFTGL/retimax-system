import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, CreateProveedorDto } from './dto/catalogo.dto';

@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  listProveedores() {
    return this.prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } }).then((rows) =>
      rows.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        createdAt: p.createdAt.toISOString(),
      })),
    );
  }

  createProveedor(dto: CreateProveedorDto) {
    return this.prisma.proveedor
      .create({ data: { nombre: dto.nombre } })
      .then((p) => ({
        id: p.id,
        nombre: p.nombre,
        createdAt: p.createdAt.toISOString(),
      }));
  }

  listClientes() {
    return this.prisma.cliente.findMany({ orderBy: { nombre: 'asc' } }).then((rows) =>
      rows.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        notas: c.notas,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  }

  createCliente(dto: CreateClienteDto) {
    return this.prisma.cliente
      .create({
        data: {
          nombre: dto.nombre,
          telefono: dto.telefono,
          notas: dto.notas,
        },
      })
      .then((c) => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        notas: c.notas,
        createdAt: c.createdAt.toISOString(),
      }));
  }
}
