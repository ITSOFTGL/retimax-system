import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpleadoDto, UpdateEmpleadoDto } from './dto/empleado.dto';

@Injectable()
export class EmpleadosService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(emp: {
    id: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    email: string;
    especialidad: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    usuario?: { id: string; activo: boolean } | null;
  }) {
    return {
      id: emp.id,
      nombre: emp.nombre,
      apellido: emp.apellido,
      nombreCompleto: `${emp.nombre} ${emp.apellido}`,
      telefono: emp.telefono,
      email: emp.email,
      especialidad: emp.especialidad,
      activo: emp.activo,
      usuarioId: emp.usuario?.id ?? null,
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
    };
  }

  async findAll(includeInactive = false) {
    const rows = await this.prisma.empleado.findMany({
      where: includeInactive ? undefined : { activo: true },
      include: { usuario: { select: { id: true, activo: true } } },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
    return rows.map((e) => this.toDto(e));
  }

  async findOne(id: string) {
    const emp = await this.prisma.empleado.findUnique({
      where: { id },
      include: { usuario: { select: { id: true, activo: true } } },
    });
    if (!emp) throw new NotFoundException('Empleado no encontrado');
    return this.toDto(emp);
  }

  async create(dto: CreateEmpleadoDto) {
    const exists = await this.prisma.empleado.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Ya existe un empleado con ese email');

    const userExists = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (userExists) throw new ConflictException('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const emp = await this.prisma.$transaction(async (tx) => {
      const created = await tx.empleado.create({
        data: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          email: dto.email,
          telefono: dto.telefono,
          especialidad: dto.especialidad,
        },
      });

      await tx.usuario.create({
        data: {
          nombre: `${dto.nombre} ${dto.apellido}`,
          email: dto.email,
          passwordHash,
          rol: Rol.EMPLEADO,
          empleadoId: created.id,
        },
      });

      return tx.empleado.findUniqueOrThrow({
        where: { id: created.id },
        include: { usuario: { select: { id: true, activo: true } } },
      });
    });

    return this.toDto(emp);
  }

  async update(id: string, dto: UpdateEmpleadoDto) {
    const emp = await this.prisma.empleado.findUnique({
      where: { id },
      include: { usuario: true },
    });
    if (!emp) throw new NotFoundException('Empleado no encontrado');

    if (dto.email && dto.email !== emp.email) {
      const dup = await this.prisma.empleado.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (dup) throw new ConflictException('Email ya en uso');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const e = await tx.empleado.update({
        where: { id },
        data: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          email: dto.email,
          telefono: dto.telefono,
          especialidad: dto.especialidad,
          activo: dto.activo,
        },
        include: { usuario: { select: { id: true, activo: true } } },
      });

      if (emp.usuario) {
        await tx.usuario.update({
          where: { id: emp.usuario.id },
          data: {
            nombre: dto.nombre && dto.apellido ? `${dto.nombre} ${dto.apellido}` : undefined,
            email: dto.email,
            activo: dto.activo,
            ...(dto.password ? { passwordHash: await bcrypt.hash(dto.password, 12) } : {}),
          },
        });
      }

      return e;
    });

    return this.toDto(updated);
  }

  async remove(id: string) {
    const emp = await this.prisma.empleado.findUnique({
      where: { id },
      include: { usuario: true },
    });
    if (!emp) throw new NotFoundException('Empleado no encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.empleado.update({ where: { id }, data: { activo: false } });
      if (emp.usuario) {
        await tx.usuario.update({ where: { id: emp.usuario.id }, data: { activo: false } });
      }
    });

    return { ok: true };
  }
}
