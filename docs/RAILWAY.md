# Deploy en Railway — RETIMAX

Guía paso a paso para subir la demo. En Railway **no ocurren** los errores de `.next` de Windows porque cada deploy hace build limpio en Linux.

## Requisitos previos

- Cuenta en [railway.app](https://railway.app)
- Repositorio en GitHub con el código de `main` pusheado
- ~15 minutos

## Arquitectura en Railway

| Servicio | Root Directory | Config |
|----------|----------------|--------|
| **postgres** | — | Plugin Railway |
| **api** | `apps/api` | `apps/api/railway.toml` |
| **web** | `apps/web` | `apps/web/railway.toml` |

> **Importante:** cada servicio debe tener su **Root Directory** configurado. Si queda en `/`, el build fallará.

---

## Paso 1 — Subir código a GitHub

```bash
git push origin main
```

---

## Paso 2 — Crear proyecto en Railway

1. Entra a [railway.app/new](https://railway.app/new)
2. **Deploy from GitHub repo** → selecciona `retimax-system`
3. Railway creará un servicio inicial — lo renombraremos

---

## Paso 3 — Agregar PostgreSQL

1. En el proyecto → **+ New** → **Database** → **PostgreSQL**
2. Railway crea `DATABASE_URL` automáticamente
3. Copia la variable `DATABASE_URL` (la usarás en la API)

---

## Paso 4 — Servicio API

1. **+ New** → **GitHub Repo** → mismo repo
2. Renombra el servicio a `api`
3. **Settings** → **Root Directory**: `apps/api`
4. Railway detectará `apps/api/railway.toml` con:
   - Build: `pnpm exec turbo run build --filter=@retimax/api`
   - Start: migraciones + servidor
5. **Variables** (Settings → Variables):

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=genera-un-secreto-largo-min-32-chars
JWT_REFRESH_SECRET=otro-secreto-largo-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=https://TU-WEB.up.railway.app
UPLOAD_DIR=/data/uploads
PORT=4000
```

5. **Volumes** (Settings → Volumes):
   - Mount path: `/data/uploads`
   - Para que las fotos persistan entre deploys

6. **Networking** → **Generate Domain** → copia la URL (ej. `https://retimax-api.up.railway.app`)

7. **Deploy** — el entrypoint corre migraciones + seed automáticamente

---

## Paso 5 — Servicio Web

1. **+ New** → **GitHub Repo** → mismo repo
2. Renombra a `web`
3. **Settings** → **Root Directory**: `apps/web`
4. Railway detectará `apps/web/railway.toml` con build/start automáticos
5. **Variables** y **Build Args**:

```
NEXT_PUBLIC_API_URL=https://retimax-api.up.railway.app
DOCKER_BUILD=1
```

6. **Networking** → **Generate Domain** → copia URL web (ej. `https://retimax-web.up.railway.app`)

---

## Paso 6 — Actualizar CORS

Vuelve al servicio **api** y actualiza:

```
CORS_ORIGIN=https://retimax-web.up.railway.app
```

Redeploy la API.

---

## Paso 7 — Probar

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@retimax.local` | `Admin123!` |
| Empleado | `alex@retimax.local` | `Empleado123!` |

---

## Orden de deploy recomendado

1. PostgreSQL
2. API (espera que esté healthy)
3. Web (con `NEXT_PUBLIC_API_URL` apuntando a la API)
4. Actualizar CORS en API con URL final de Web

---

## Costos estimados (demo)

- Railway Hobby: ~$5/mes de crédito incluido
- PostgreSQL + 2 servicios: suele caber en demo con uso moderado
- Si se agota crédito, el servicio se pausa

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| Web no carga datos | Verificar `NEXT_PUBLIC_API_URL` en variables de Web |
| Build web EBUSY cache | Actualizar a último `main` (scripts omiten limpieza en CI) |
| Build API 109 errores TS | Root Directory debe ser `apps/api` (corre `prisma generate`) |
| CORS error | `CORS_ORIGIN` en API debe ser exactamente la URL de Web |
| Fotos no persisten | Agregar Volume en API en `/data/uploads` |
| Errores `.next` en local | `pnpm dev:web:clean` — no es problema de RAM |

---

## Probar producción en local (sin errores de dev)

```bash
pnpm build
pnpm start:api    # terminal 1 — requiere PostgreSQL local
pnpm start:web    # terminal 2
```

Esto simula lo que Railway ejecutará.
