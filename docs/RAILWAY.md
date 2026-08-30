# Railway — monorepo RETIMAX

## Configuración obligatoria por servicio

> **Root Directory = vacío (raíz del repo `/`)** para ambos servicios.  
> No uses `apps/api` ni `apps/web` como root — rompe el workspace de pnpm.

---

## Servicio API (`@retimax/api`)

**Settings → General**
- Root Directory: *(dejar vacío)*

**Settings → Build**
- Builder: **Dockerfile**
- Dockerfile path: `apps/api/Dockerfile`

**Settings → Deploy → Start Command**
```
pnpm --filter @retimax/api start:railway
```
*(O dejar el ENTRYPOINT del Dockerfile si usas solo Docker)*

**Variables**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=https://TU-WEB.up.railway.app
UPLOAD_DIR=/data/uploads
PORT=4000
```

**Volume** (opcional, fotos persistentes): mount `/data/uploads`

---

## Servicio Web (`@retimax/web`)

**Settings → General**
- Root Directory: *(dejar vacío)*

**Settings → Build**
- Builder: **Dockerfile**
- Dockerfile path: `apps/web/Dockerfile`

**Variables / Build Args**
```
NEXT_PUBLIC_API_URL=https://TU-API.up.railway.app
PORT=3000
```

---

## Alternativa sin Docker (Nixpacks / Railpack)

Si prefieres Railpack, deja Root Directory vacío y usa estos **Custom Build Commands**:

| Servicio | Build Command |
|----------|---------------|
| API | `pnpm --filter @retimax/api build` |
| Web | `pnpm --filter @retimax/web build` |

Los scripts `prebuild` ya compilan `shared-types` y generan Prisma automáticamente.

| Servicio | Start Command |
|----------|---------------|
| API | `pnpm --filter @retimax/api start:railway` |
| Web | `pnpm --filter @retimax/web start` |

---

## PostgreSQL

1. **+ New → Database → PostgreSQL**
2. En API: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

---

## Orden de deploy

1. PostgreSQL
2. API → generar dominio
3. Web con `NEXT_PUBLIC_API_URL` = URL de la API
4. Actualizar `CORS_ORIGIN` en API con URL de Web → redeploy API

---

## Credenciales demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@retimax.local` | `Admin123!` |
| Empleado | `alex@retimax.local` | `Empleado123!` |

---

## Errores comunes

| Error | Solución |
|-------|----------|
| `Cannot resolve @retimax/shared-types` | Root Directory debe ser **raíz del repo**, no `apps/web` |
| 109 errores TypeScript en API | Falta `prisma generate` — usar último `main` con prebuild |
| EBUSY `.next/cache` | Actualizar a último `main` |
| Web sin datos | `NEXT_PUBLIC_API_URL` incorrecta |
| CORS | `CORS_ORIGIN` = URL exacta de Web |
