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
   - Genera el cliente de Prisma (`pnpm prisma generate`).
   - Sirve la API Express y la UI estática del panel de administración (`/admin`).
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
6. En la pestaña **"Persistent Storage" / "Storages"**:
   - Montar volumen persistente: destino `/app/public/media/projects` (o `/app/public/media`). Esto garantiza que las imágenes subidas desde el CMS no se eliminen al redeployar.
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
8. Hacé clic en **"Deploy"**.
9. **Ejecutar migraciones y seed inicial:**
   - Una vez finalizado el build, ingresá a la pestaña **"Terminal"** del contenedor del backend en Coolify y ejecutá:
     ```bash
     pnpm prisma migrate deploy
     pnpm db:seed
     ```
   - Esto creará las tablas relacionales y poblará los datos iniciales de proyectos, trayectoria y habilidades.

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
   ```
   *(Nota: si el backend y frontend están en la misma red de Coolify, podés usar el hostname interno del contenedor `http://portfolio-api:3001/api`; alternativamente, usá `https://api.mateogs.tech/api`).*
7. Hacé clic en **"Deploy"**.

---

## 4. Enrutamiento Unificado (Proxy de Nitro)

Gracias a las directivas de `nitro.routeRules` en `nuxt.config.ts`:

- Cualquier petición a `https://mateogs.tech/admin` o `https://mateogs.tech/admin/**` es enviada de forma transparente al backend Express (`:3001/admin`).
- Cualquier petición a `https://mateogs.tech/api/**` es proxiada directamente a la API Express.
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
