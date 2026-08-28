import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoAprobacion,
  EstadoIntervencion,
  Rol,
  Usuario,
} from '@prisma/client';
import { toIntervencionDto } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntervencionesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMisTrabajos(user: Usuario) {
    if (user.rol !== Rol.EMPLEADO || !user.empleadoId) {
      throw new ForbiddenException('Solo empleados pueden ver sus trabajos');
    }

    const rows = await this.prisma.intervencion.findMany({
      where: {
        responsableId: user.empleadoId,
        estadoIntervencion: { notIn: [EstadoIntervencion.CANCELADO] },
      },
      include: this.includeRelations(),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => toIntervencionDto(r));
  }

  async listPendientesAprobacion() {
    const rows = await this.prisma.intervencion.findMany({
      where: { estadoIntervencion: EstadoIntervencion.FINALIZADO },
      include: this.includeRelations(),
      orderBy: { fechaFinalizacion: 'desc' },
    });
    return rows.map((r) => toIntervencionDto(r));
  }

  async iniciar(id: string, user: Usuario, detalleTrabajo?: string) {
    const intervencion = await this.getForEmployee(id, user);
    if (intervencion.estadoIntervencion !== EstadoIntervencion.ASIGNADO) {
      throw new BadRequestException('Solo se puede iniciar un trabajo asignado');
    }

    const updated = await this.prisma.intervencion.update({
      where: { id },
      data: {
        estadoIntervencion: EstadoIntervencion.EN_PROCESO,
        fechaInicio: new Date(),
        detalleTrabajo: detalleTrabajo ?? intervencion.detalleTrabajo,
      },
      include: this.includeRelations(),
    });
    return toIntervencionDto(updated);
  }

  async finalizar(
    id: string,
    user: Usuario,
    body: { detalleTrabajo?: string; observaciones?: string },
  ) {
    const intervencion = await this.getForEmployee(id, user);
    if (
      intervencion.estadoIntervencion !== EstadoIntervencion.EN_PROCESO &&
      intervencion.estadoIntervencion !== EstadoIntervencion.ASIGNADO
    ) {
      throw new BadRequestException('El trabajo debe estar en proceso para finalizar');
    }

    const updated = await this.prisma.intervencion.update({
      where: { id },
      data: {
        estadoIntervencion: EstadoIntervencion.FINALIZADO,
        estadoAprobacion: EstadoAprobacion.PENDIENTE,
        fechaFinalizacion: new Date(),
        finalizadoPorId: user.empleadoId!,
        detalleTrabajo: body.detalleTrabajo ?? intervencion.detalleTrabajo,
        observaciones: body.observaciones,
      },
      include: this.includeRelations(),
    });
    return toIntervencionDto(updated);
  }

  async aprobar(id: string, user: Usuario) {
    const intervencion = await this.prisma.intervencion.findUnique({
      where: { id },
      include: this.includeRelations(),
    });
    if (!intervencion) throw new NotFoundException('Intervención no encontrada');
    if (intervencion.estadoIntervencion !== EstadoIntervencion.FINALIZADO) {
      throw new BadRequestException('Solo se aprueban trabajos finalizados');
    }

    const updated = await this.prisma.intervencion.update({
      where: { id },
      data: {
        estadoIntervencion: EstadoIntervencion.APROBADO,
        estadoAprobacion: EstadoAprobacion.APROBADO,
        fechaAprobacion: new Date(),
        aprobadoPorId: user.id,
      },
      include: this.includeRelations(),
    });
    return toIntervencionDto(updated);
  }

  async rechazar(id: string, user: Usuario, observaciones?: string) {
    const intervencion = await this.prisma.intervencion.findUnique({
      where: { id },
      include: this.includeRelations(),
    });
    if (!intervencion) throw new NotFoundException('Intervención no encontrada');
    if (intervencion.estadoIntervencion !== EstadoIntervencion.FINALIZADO) {
      throw new BadRequestException('Solo se rechazan trabajos finalizados');
    }

    const updated = await this.prisma.intervencion.update({
      where: { id },
      data: {
        estadoIntervencion: EstadoIntervencion.RECHAZADO,
        estadoAprobacion: EstadoAprobacion.RECHAZADO,
        observaciones: observaciones ?? intervencion.observaciones,
        aprobadoPorId: user.id,
      },
      include: this.includeRelations(),
    });
    return toIntervencionDto(updated);
  }

  private async getForEmployee(id: string, user: Usuario) {
    if (user.rol !== Rol.EMPLEADO || !user.empleadoId) {
      throw new ForbiddenException('Acceso denegado');
    }
    const intervencion = await this.prisma.intervencion.findUnique({ where: { id } });
    if (!intervencion) throw new NotFoundException('Intervención no encontrada');
    if (intervencion.responsableId !== user.empleadoId) {
      throw new ForbiddenException('Este trabajo no está asignado a usted');
    }
    return intervencion;
  }

  private includeRelations() {
    return {
      maquina: { include: { proveedor: true } },
      responsable: true,
      finalizadoPor: true,
      aprobadoPor: true,
      registradoPor: true,
    } as const;
  }
}
