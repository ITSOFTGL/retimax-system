-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'OPERARIO');

-- CreateEnum
CREATE TYPE "EstadoMaquina" AS ENUM ('COMPRADA_ITALIA', 'EN_TRANSITO', 'RECIBIDA', 'EN_DIAGNOSTICO', 'EN_MANTENIMIENTO', 'LISTA_PARA_VENTA', 'RESERVADA', 'VENDIDA');

-- CreateEnum
CREATE TYPE "EtapaImagen" AS ENUM ('EMBARQUE', 'LLEGADA', 'OTRA');

-- CreateEnum
CREATE TYPE "TipoIntervencion" AS ENUM ('DIAGNOSTICO_INICIAL', 'TRABAJO_REALIZADO', 'OBSERVACION_ADICIONAL');

-- CreateEnum
CREATE TYPE "AreaIntervencion" AS ENUM ('MECANICA', 'ELECTRICA', 'PINTADO', 'MANTENIMIENTO_GENERAL');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ADMIN',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquinas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "estado" "EstadoMaquina" NOT NULL DEFAULT 'COMPRADA_ITALIA',
    "descripcionLlegada" TEXT,
    "precioVentaUsd" DECIMAL(10,2),
    "tipoCambioUsado" DECIMAL(10,4),
    "precioVentaBob" DECIMAL(10,2),
    "fechaCompra" TIMESTAMP(3),
    "fechaLlegadaEstimada" TIMESTAMP(3),
    "fechaLlegadaReal" TIMESTAMP(3),
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_maquina" (
    "id" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "etapa" "EtapaImagen" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagenes_maquina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervenciones" (
    "id" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "tipo" "TipoIntervencion" NOT NULL,
    "area" "AreaIntervencion" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervenciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "maquinaId" TEXT,
    "descripcionReferencia" TEXT,
    "fotoReferenciaUrl" TEXT,
    "anticipoUsd" DECIMAL(10,2) NOT NULL,
    "saldoUsd" DECIMAL(10,2) NOT NULL,
    "totalUsd" DECIMAL(10,2) NOT NULL,
    "fechaEntregaEstimada" TIMESTAMP(3),
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "precioFinalUsd" DECIMAL(10,2) NOT NULL,
    "precioFinalBob" DECIMAL(10,2) NOT NULL,
    "tipoCambio" DECIMAL(10,4) NOT NULL,
    "fechaEntrega" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuarioId_idx" ON "refresh_tokens"("usuarioId");

-- CreateIndex
CREATE INDEX "maquinas_estado_idx" ON "maquinas"("estado");

-- CreateIndex
CREATE INDEX "imagenes_maquina_maquinaId_idx" ON "imagenes_maquina"("maquinaId");

-- CreateIndex
CREATE INDEX "intervenciones_maquinaId_idx" ON "intervenciones"("maquinaId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_maquinaId_key" ON "ventas"("maquinaId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_maquina" ADD CONSTRAINT "imagenes_maquina_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervenciones" ADD CONSTRAINT "intervenciones_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervenciones" ADD CONSTRAINT "intervenciones_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
