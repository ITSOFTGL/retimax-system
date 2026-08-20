import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, CreateProveedorDto, UpdateClienteDto, UpdateProveedorDto } from './dto/catalogo.dto';

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

  async updateProveedor(id: string, dto: UpdateProveedorDto) {
    await this.ensureProveedor(id);
    const p = await this.prisma.proveedor.update({
      where: { id },
      data: { nombre: dto.nombre },
    });
    return { id: p.id, nombre: p.nombre, createdAt: p.createdAt.toISOString() };
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

  async updateCliente(id: string, dto: UpdateClienteDto) {
    await this.ensureCliente(id);
    const c = await this.prisma.cliente.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        telefono: dto.telefono,
        notas: dto.notas,
      },
    });
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      notas: c.notas,
      createdAt: c.createdAt.toISOString(),
    };
  }

  private async ensureProveedor(id: string) {
    const p = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Proveedor no encontrado');
  }

  private async ensureCliente(id: string) {
    const c = await this.prisma.cliente.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
  }
}
