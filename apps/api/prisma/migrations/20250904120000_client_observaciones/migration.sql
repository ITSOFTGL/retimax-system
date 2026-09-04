-- AlterTable: usuarios — login por nombre de usuario
ALTER TABLE "usuarios" ADD COLUMN "username" TEXT;

UPDATE "usuarios" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

ALTER TABLE "usuarios" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- AlterTable: empleados — carnet opcional como usuario sugerido
ALTER TABLE "empleados" ADD COLUMN "carnet" TEXT;
CREATE UNIQUE INDEX "empleados_carnet_key" ON "empleados"("carnet");

-- AlterTable: maquinas — marca, modelo, año
ALTER TABLE "maquinas" ADD COLUMN "marca" TEXT NOT NULL DEFAULT '';
ALTER TABLE "maquinas" ADD COLUMN "modelo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "maquinas" ADD COLUMN "anio" INTEGER;

UPDATE "maquinas" SET "marca" = "tipo" WHERE "marca" = '';
UPDATE "maquinas" SET "modelo" = "nombre" WHERE "modelo" = '';
UPDATE "maquinas" SET "anio" = EXTRACT(YEAR FROM "fechaCompra")::INTEGER WHERE "anio" IS NULL AND "fechaCompra" IS NOT NULL;
