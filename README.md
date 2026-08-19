# RETIMAX System

Sistema de gestión del ciclo de vida de maquinaria industrial para RETIMAX (Recmotors).

Monorepo Turborepo con:
- **API** (`apps/api`): NestJS + Prisma + PostgreSQL
- **Web** (`apps/web`): Next.js + React + TailwindCSS
- **Tipos compartidos** (`packages/shared-types`)

## Requisitos

- Node.js 20+
- pnpm 10+
- Docker y Docker Compose (para entorno completo)

## Inicio rápido con Docker

```bash
cp .env.example .env
docker compose up -d --build
```

Servicios:
- Frontend: http://localhost:3000
- API: http://localhost:4000
- PostgreSQL: localhost:5432

**Credenciales demo:** `admin@retimax.local` / `Admin123!`

## Desarrollo local (sin Docker)

```bash
pnpm install
cp .env.example .env

# PostgreSQL local requerido — ajustar DATABASE_URL en .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed

pnpm dev
```

## Estructura

```
apps/
  api/          # Backend REST + JWT
  web/          # Frontend App Router
packages/
  shared-types/ # Enums y DTOs compartidos
scripts/
  backup.sh     # Backup cifrado de DB + fotos (Docker)
```

## Seguridad implementada

- JWT access (15 min) + refresh con rotación/revocación
- Rate limiting en `/auth/login`
- Helmet + CORS restringido
- Uploads: whitelist mimetype, máx 8 MB, renombrado, WebP + miniatura
- Backups automáticos diarios (PostgreSQL + volumen de fotos)

## Rama de desarrollo

Trabajo activo en: `feature/retimax-mvp`

## Fases

1. **MVP** — auth, máquinas, intervenciones, dashboard ✅
2. **Comercial** — proveedores, clientes, pedidos, ventas ✅
3. Pulido UX, reportes, deploy VPS manual
