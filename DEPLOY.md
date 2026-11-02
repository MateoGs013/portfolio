# Guía de Despliegue: Hostinger VPS con Coolify

Esta guía detalla la arquitectura de infraestructura, configuración de contenedores y procedimiento de despliegue continuo para el portafolio en un **VPS de Hostinger gestionado mediante Coolify**.

---

## 1. Arquitectura de Servicios en Coolify

Toda la infraestructura se ejecuta en contenedores Docker orquestados por Coolify y securizados con proxy inverso Traefik con certificados SSL automáticos (Let's Encrypt).

```
[ Internet / Visitantes ]
            │
            ▼ (HTTPS: https://mateogs.tech)
┌────────────────────────────────────────────────────────┐
│ Traefik Reverse Proxy (Coolify Gateway)                │
└───────────┬────────────────────────────────────────────┘
            │
            ├────────────────────────────────────────────┐
            ▼ (Puerto 3000)                              ▼ (Opcional / Directo 3001)
┌──────────────────────────────┐             ┌──────────────────────────────┐
│ Frontend: Nuxt 4 (SSR)       │             │ Backend: Express 5 + Prisma  │
│ (Dockerfile.web)             │──(Proxy)───▶│ (Dockerfile.api)             │
│ - Rutas públicas             │             │ - API REST (/api/*)          │
│ - Modo Focus / Hiperfoco     │             │ - Consola Admin (/admin/*)   │
│ - CV Harvard ATS en /about   │             │ - Eros Job Hunter Agent      │
└──────────────────────────────┘             └──────────────┬───────────────┘
                                                            │
                                             ┌──────────────┴───────────────┐
                                             ▼ (Puerto 5432)
                               ┌──────────────────────────────┐
                               │ Database: PostgreSQL 17      │
                               │ - Servicio administrado      │
                               │ - Volumen persistente        │
                               └──────────────────────────────┘
```

---

## 2. Componentes y Archivos de Despliegue

El repositorio cuenta con Dockerfiles optimizados para producción:

1. **`Dockerfile.web`**:
   - Multi-stage build con Node 24 Alpine y pnpm 10.
   - Ejecuta como usuario sin privilegios `USER node`.
   - Compila Nuxt 4 (`pnpm build`) generando `.output`.
   - Expone el puerto `3000`.
   - Levanta con `node .output/server/index.mjs`.

2. **`Dockerfile.api`**:
   - Multi-stage build con Node 24 Alpine y pnpm 10.
   - Ejecuta como usuario sin privilegios `USER node`.
   - Compila el admin con Vite (`pnpm build:admin`, de `server/admin/src/` a `server/admin/dist/`) y genera el cliente de Prisma (`pnpm prisma generate`), en el mismo `RUN`. Si el build del admin falla, falla la imagen: nunca sale una API sin admin. Sin `server/admin/dist/`, `/admin/` responde 503.
   - Sirve la API Express y el admin compilado en `/admin/` (`server/src/admin/ui.ts`, con su CSP estricta).
   - Corre `npx prisma migrate deploy` en cada arranque (`CMD`), antes de `pnpm start:api`.
   - Expone el puerto `3001`.
   - Levanta con `pnpm start:api` (`tsx server/src/index.ts`).

3. **`docker-compose.yml`**:
   - Configuración base del contenedor PostgreSQL 17 alpine aislado en `127.0.0.1:5432:5432`.

---

## 3. Configuración en Coolify (Paso a Paso)

### Paso 1: Crear la Base de Datos PostgreSQL 17

1. En el panel de Coolify en tu VPS de Hostinger, navegá a tu Proyecto y hacé clic en **"+ New Resource"** → **"Database"** → **"PostgreSQL"**.
2. Configurá los valores:
   - **Database Name**: `portfolio`
   - **User**: `portfolio`
   - **Password**: `[TU_PASSWORD_SEGURO]`
   - **Version**: `17-alpine`
3. **Seguridad de red:** Asegurate de **no exponer el puerto 5432 públicamente**. Coolify asigna una red Docker interna donde los contenedores se comunican de forma aislada.
4. Hacé clic en **"Deploy"**.
5. En la pestaña de la base de datos, obtené la cadena de conexión interna (`Internal Database URL`):
   ```text
   postgresql://portfolio:[TU_PASSWORD_SEGURO]@postgres:5432/portfolio
   ```

---

### Paso 2: Desplegar el Backend API & Admin (`Dockerfile.api`)

1. En tu proyecto de Coolify, hacé clic en **"+ New Resource"** → **"Application"** → **"GitHub Repository"**.
2. Seleccioná el repositorio del portafolio y la rama `main`.
3. Configurá el método de compilación:
   - **Build Pack**: `Docker file`
   - **Dockerfile location**: `/Dockerfile.api`
4. En **"Ports Exposes"**, indicá `3001`.
5. En **"Domains"**, podés dejarlo sin dominio público (si Nuxt actuará como proxy inverso completo) o asignarle un subdominio como `https://api.mateogs.tech`.
6. En la pestaña **"Persistent Storage" / "Storages"**, un volumen con destino `/app/uploads`. Todo lo que se sube desde el admin va ahí (`MEDIA_UPLOAD_DIR=/app/uploads/projects`, fijado en `Dockerfile.api`): las imágenes y videos de las obras (`<slug>/`) y el retrato del perfil (`_perfil/retrato-*.webp|jpg|png`). La API lo sirve en la misma dirección que lo versionado (`/media/projects/…`), y el volumen no tapa `public/media/projects/`: lo versionado en git llega siempre con la imagen. Después de crearlo, comprobar que una captura versionada y una subida desde el admin responden 200 después de un deploy.
7. En la pestaña **"Environment Variables"**, definí:
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://portfolio:[TU_PASSWORD_SEGURO]@postgres:5432/portfolio
   ADMIN_TOKEN=tu-clave-secreta-para-acceder-al-panel
   CORS_ORIGIN=https://mateogs.tech
   HUNTER_API_URL=http://eros:8000
   EROS_API_KEY=tu-clave-secreta-compartida-con-eros
   GEMINI_API_KEY=tu-api-key-de-gemini
   ```
   - `HUNTER_API_URL` es **obligatoria** para que Eros ande: no tiene valor por defecto. Sin ella el admin muestra Eros como «no configurado», Vacantes, Publicaciones y Tendencias no traen nada y el CV se sigue armando desde la base. Verificarla en Coolify antes de cada deploy (`http://eros:8000`, la red interna).
   - Nunca `EROS_DEMO=1` en producción (la muestra de pruebas igual se apaga con `NODE_ENV=production`), ni `HUNTER_LOCAL_FALLBACK`.
   - `ADMIN_TOKEN` es la clave del admin: sin un valor válido el admin responde 503. No hay `dev-token` en producción.
8. Hacé clic en **"Deploy"**.
9. **Ejecutar migraciones y seed inicial:**
   - Una vez finalizado el build, ingresá a la pestaña **"Terminal"** del contenedor del backend en Coolify y ejecutá:
     ```bash
     pnpm prisma migrate deploy
     pnpm db:seed
     ```
   - Esto creará las tablas relacionales y poblará los datos iniciales de proyectos, trayectoria y habilidades.

> [!WARNING] Actualizar una base ya cargada al rediseño «movimiento»
> El contenedor de la API corre `npx prisma migrate deploy` en cada arranque (`CMD` de `Dockerfile.api`): la migración `20261101000000_rediseno_movimiento`, que es destructiva (saca `Media.layer`, rehace `MediaRole` y pasa las capas a la galería), se aplica sola en cuanto Coolify despliega el código nuevo. Por eso:
> 1. **Antes** del merge a `main` o de cualquier deploy de la rama: `pg_dump --format=custom --file=antes-rediseno.dump "$DATABASE_URL"`.
> 2. Desplegar. El arranque aplica las migraciones; `20261101000100_rediseno_ocultar_obras` deja null-net y lampone sin publicar desde ese momento.
> 3. Apenas arranca el contenedor nuevo, en su terminal: `pnpm tsx server/src/patches/2026-10-30-eros-barberpole.ts`, `2026-11-01-rediseno-datos.ts --dry`, sin `--dry`, `--dry` otra vez («sin cambios»), y lo mismo con `2026-11-02-traducciones-en.ts`. Hasta entonces el sitio sirve los datos con la forma de main (Eros sin portada, el inicio sin `display_name` ni `headline`).
> 4. Reiniciar la API: los parches borran `data/content-last-good.json`, pero el proceso guarda en memoria respuestas de antes de los parches.
> Para volver atrás: `pg_restore --clean --if-exists --dbname="$DATABASE_URL" antes-rediseno.dump` y desplegar el código anterior.

> [!WARNING] Desplegar el rediseño del admin (noviembre de 2026)
> El admin nuevo reemplaza al anterior en `/admin` y trae una migración aditiva (`20261105000000_metric_translation`, que se aplica sola al arrancar) y un parche de datos para los documentos `about` y `contact`. Todo con el OK de Mateo:
> 1. **Antes** del merge a `main`: `pg_dump --format=custom --file=antes-admin.dump "$DATABASE_URL"`, verificar `HUNTER_API_URL=http://eros:8000` en las variables de la API y el volumen de `/app/uploads` (paso 6).
> 2. Desplegar la API. La imagen compila el admin y el arranque corre las migraciones.
> 3. En la terminal del contenedor: `pnpm tsx server/src/patches/2026-11-05-admin-datos.ts --dry` (muestra lo que cambiaría), sin `--dry` (aplica en una transacción) y `--dry` otra vez hasta que diga «sin cambios». Borra el `en` de email, direcciones web y retrato (era una copia vieja del español), no toca `cv` y lista los bloques requeridos que faltan: se completan desde Perfil.
> 4. Reiniciar la API (el parche borra `data/content-last-good.json`, pero el proceso tiene respuestas en memoria).
> 5. Si cambió algo público, `pnpm db:snapshot` en local con una copia de la base y commit. Si cambió el CV, `pnpm cv:pdf` en local y commit de los PDF con su sello (`server/src/snapshot/cv-stamp.json`): el Inicio del admin avisa cuando no coinciden.
> 6. Auditoría de solo lectura en `https://mateogs.tech/admin/`: ingreso, Inicio, una obra, la Vista CV y Vacantes (con Eros arriba y su estado).
> Para volver atrás: `pg_restore --clean --if-exists --dbname="$DATABASE_URL" antes-admin.dump` y desplegar el código anterior.

> [!NOTE] Seguridad de Eros Agent
> Eros no debe publicarse con un dominio en Internet. Debe correr en la misma red de Coolify bajo `http://eros:8000` y con `EROS_API_KEY` compartida requerida en todas sus peticiones.

---

### Paso 3: Desplegar el Frontend Nuxt 4 (`Dockerfile.web`)

1. Hacé clic en **"+ New Resource"** → **"Application"** → **"GitHub Repository"**.
2. Seleccioná nuevamente el repositorio y la rama `main`.
3. Configurá el método de compilación:
   - **Build Pack**: `Docker file`
   - **Dockerfile location**: `/Dockerfile.web`
4. En **"Ports Exposes"**, indicá `3000`.
5. En **"Domains"**, asigná tu dominio principal con HTTPS:
   ```text
   https://mateogs.tech
   ```
6. En la pestaña **"Environment Variables"**, definí:
   ```env
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   NUXT_PUBLIC_API_BASE=http://portfolio-api:3001/api
   NUXT_PUBLIC_SITE_URL=https://mateogs.tech
   ```
   *`NUXT_PUBLIC_SITE_URL` tiene que estar disponible también en el build (en Coolify, marcala como «Build Variable»): `nuxt.config.ts` la lee al compilar para la CSP (`upgrade-insecure-requests`) y en runtime para el canonical, hreflang, og:url, JSON-LD, sitemap y `robots.txt`. Sin ella todo apunta a `http://localhost:3000`.*
   *(Nota: si el backend y frontend están en la misma red de Coolify, podés usar el hostname interno del contenedor `http://portfolio-api:3001/api`; alternativamente, usá `https://api.mateogs.tech/api`).*
7. Hacé clic en **"Deploy"**.

---

## 4. Enrutamiento Unificado (Proxy de Nitro)

- `https://mateogs.tech/admin` (exacto) responde 301 a `/admin/` conservando la consulta, y `/admin/` y todo lo de abajo se pasan a la API: lo resuelven `app/nitro/routes/admin.ts` y `app/nitro/routes/admin/[...].ts`. No hay routeRule del admin a propósito: una regla `/admin/**` también atrapa `/admin` y rompe el 301. En la API, `/admin/assets/*` se sirve inmutable por un año y una ruta sin extensión devuelve el `index.html` sin caché.
- Cualquier petición a `https://mateogs.tech/api/**` (y `/api/admin/**`) es proxiada directamente a la API Express por `nitro.routeRules` en `nuxt.config.ts`, igual que `/media/**`, que la API sirve desde `public/media` (lo versionado y lo del volumen).
- No es necesario lidiar con problemas de CORS en producción, ya que tanto el portafolio público como el panel de administración operan bajo el mismo origen (`https://mateogs.tech`).

---

## 5. Mantenimiento y Operaciones Habituales

### Actualización Automática (Webhooks / CI)
Coolify incluye webhooks automáticos de despliegue. Cada `git push origin main` en GitHub dispara la reconstrucción de los contenedores correspondientes sin downtime.

### Respaldos de Base de Datos
En Coolify, ingresá a la base de datos PostgreSQL → pestaña **"Backups"**:
- Activá respaldos programados (ej: diario a las 03:00 UTC).
- Podés almacenar los backups localmente en el VPS de Hostinger o sincronizarlos con un bucket S3.

### Inspección de Logs
Para revisar eventos o depurar peticiones:
- En Coolify, seleccioná el servicio correspondiente y hacé clic en la pestaña **"Logs"**.
- Para ver logs desde SSH en el Hostinger VPS:
  ```bash
  docker ps
  docker logs -f [CONTAINER_NAME]
  ```
