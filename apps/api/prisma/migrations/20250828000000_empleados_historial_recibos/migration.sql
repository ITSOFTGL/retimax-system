-- CreateEnum
CREATE TYPE "Especialidad" AS ENUM ('MECANICO', 'ELECTRICO', 'PINTOR', 'MANTENIMIENTO_GENERAL', 'OTRO');
CREATE TYPE "EstadoIntervencion" AS ENUM ('ASIGNADO', 'EN_PROCESO', 'FINALIZADO', 'APROBADO', 'RECHAZADO', 'CANCELADO');
CREATE TYPE "EstadoAprobacion" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- AlterEnum Rol: OPERARIO -> EMPLEADO
ALTER TYPE "Rol" RENAME VALUE 'OPERARIO' TO 'EMPLEADO';

-- CreateTable empleados
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT NOT NULL,
    "especialidad" "Especialidad" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "empleados_email_key" ON "empleados"("email");

-- AlterTable usuarios
ALTER TABLE "usuarios" ADD COLUMN "empleadoId" TEXT;
CREATE UNIQUE INDEX "usuarios_empleadoId_key" ON "usuarios"("empleadoId");
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable maquinas
ALTER TABLE "maquinas" ADD COLUMN "empleadoDiagnosticoId" TEXT;
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_empleadoDiagnosticoId_fkey" FOREIGN KEY ("empleadoDiagnosticoId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable historial_estados
CREATE TABLE "historial_estados" (
    "id" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "estado" "EstadoMaquina" NOT NULL,
    "anterior" "EstadoMaquina",
    "motivo" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historial_estados_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "historial_estados_maquinaId_idx" ON "historial_estados"("maquinaId");
ALTER TABLE "historial_estados" ADD CONSTRAINT "historial_estados_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "historial_estados" ADD CONSTRAINT "historial_estados_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable intervenciones
ALTER TABLE "intervenciones" ADD COLUMN "responsableId" TEXT;
ALTER TABLE "intervenciones" ADD COLUMN "responsableNombre" TEXT;
ALTER TABLE "intervenciones" ADD COLUMN "estadoIntervencion" "EstadoIntervencion" NOT NULL DEFAULT 'ASIGNADO';
ALTER TABLE "intervenciones" ADD COLUMN "detalleTrabajo" TEXT;
ALTER TABLE "intervenciones" ADD COLUMN "observaciones" TEXT;
ALTER TABLE "intervenciones" ADD COLUMN "fechaAsignacion" TIMESTAMP(3);
ALTER TABLE "intervenciones" ADD COLUMN "fechaInicio" TIMESTAMP(3);
ALTER TABLE "intervenciones" ADD COLUMN "fechaFinalizacion" TIMESTAMP(3);
ALTER TABLE "intervenciones" ADD COLUMN "fechaAprobacion" TIMESTAMP(3);
ALTER TABLE "intervenciones" ADD COLUMN "aprobadoPorId" TEXT;
ALTER TABLE "intervenciones" ADD COLUMN "estadoAprobacion" "EstadoAprobacion" NOT NULL DEFAULT 'PENDIENTE';
ALTER TABLE "intervenciones" ADD COLUMN "finalizadoPorId" TEXT;

-- Migrate legacy responsable text
UPDATE "intervenciones" SET "responsableNombre" = "responsable" WHERE "responsable" IS NOT NULL;
ALTER TABLE "intervenciones" DROP COLUMN "responsable";

CREATE INDEX "intervenciones_responsableId_idx" ON "intervenciones"("responsableId");
CREATE INDEX "intervenciones_estadoIntervencion_idx" ON "intervenciones"("estadoIntervencion");
ALTER TABLE "intervenciones" ADD CONSTRAINT "intervenciones_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "intervenciones" ADD CONSTRAINT "intervenciones_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "intervenciones" ADD CONSTRAINT "intervenciones_finalizadoPorId_fkey" FOREIGN KEY ("finalizadoPorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable recibos
CREATE TABLE "recibos_venta" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recibos_venta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "recibos_venta_numero_key" ON "recibos_venta"("numero");
CREATE UNIQUE INDEX "recibos_venta_ventaId_key" ON "recibos_venta"("ventaId");
ALTER TABLE "recibos_venta" ADD CONSTRAINT "recibos_venta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "recibos_reserva" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenciaDias" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recibos_reserva_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "recibos_reserva_numero_key" ON "recibos_reserva"("numero");
CREATE UNIQUE INDEX "recibos_reserva_pedidoId_key" ON "recibos_reserva"("pedidoId");
ALTER TABLE "recibos_reserva" ADD CONSTRAINT "recibos_reserva_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
