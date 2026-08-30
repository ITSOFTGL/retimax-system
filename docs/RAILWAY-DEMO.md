# Railway — demo rápida (5 minutos)

> Antes te cargaba la página pero no conectaba al backend.  
> Eso se arregla solo con **variables**, no con Docker complicado.

---

## En AMBOS servicios

- **Root Directory:** vacío (raíz del repo)
- **Builder:** Railpack (NO Dockerfile)

---

## `@retimax/web` — frontend

**Config file path:** `railway.web.toml` *(o configura manual abajo)*

**Start Command** *(si Railway no deja vacío):*
```
pnpm --filter @retimax/web start
```

**Build Command:**
```
pnpm --filter @retimax/web build
```

**Variables (solo 2):**
```
NEXT_PUBLIC_API_URL=https://TU-API.up.railway.app
PORT=3000
```

---

## `@retimax/api` — backend

**Config file path:** `railway.api.toml`

**Start Command:**
```
pnpm --filter @retimax/api start:railway
```

**Build Command:**
```
pnpm --filter @retimax/api build
```

**Variables:**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=Ret1maxProdAccessSecret2026Min32Chars!!
JWT_REFRESH_SECRET=Ret1maxProdRefreshSecret2026Min32Chars!
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=https://retimaxweb-production.up.railway.app
UPLOAD_DIR=/data/uploads
PORT=4000
```

`start:railway` corre migraciones + seed + servidor (usuarios demo automáticos).

---

## Login demo

| Email | Contraseña |
|-------|------------|
| `admin@retimax.local` | `Admin123!` |

---

## Orden

1. Postgres creado
2. Deploy API → copiar URL pública
3. Web con `NEXT_PUBLIC_API_URL` = URL de la API → **Redeploy web**
4. API con `CORS_ORIGIN` = URL del web

---

## Si ves 502

Cambiaste a **Dockerfile** por error. Vuelve a **Railpack** y usa los Start Command de arriba.
