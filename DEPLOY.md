# Guía de Despliegue: Combo Vercel + Supabase + Render

Esta guía detalla el paso a paso exacto para desplegar el portafolio utilizando la arquitectura híbrida seleccionada:
- **Base de Datos**: PostgreSQL en **Supabase** (administrada, gratuita, alta disponibilidad).
- **Backend API & Admin**: Express 5 + Prisma en **Render** (servidor Node.js continuo con HTTPS automático).
- **Frontend Web**: Nuxt 4 en **Vercel** (red global Edge CDN, máxima velocidad para recruiters y clientes).

---

## Orden de Ejecución (3 Fases)

Seguí este orden para que cada servicio tenga los datos y URLs que necesita del anterior:
1. **Fase 1**: Crear la base de datos en **Supabase** y obtener `DATABASE_URL`.
2. **Fase 2**: Desplegar el backend en **Render**, migrar datos y correr el seed.
3. **Fase 3**: Desplegar el frontend en **Vercel** conectado a la URL de Render.

---

## Fase 1: Base de Datos en Supabase (PostgreSQL 17)

1. Ingresá a [supabase.com](https://supabase.com) e iniciá sesión con tu cuenta de GitHub.
2. Hacé clic en **"New Project"**:
   - **Name**: `portfolio-db`
   - **Database Password**: Generá una contraseña segura y **guardala** (la necesitarás para la URL de conexión).
   - **Region**: Elegí `South America (São Paulo)` para mínima latencia con Argentina, o `US East (North Virginia)`.
   - Plan: **Free**.
3. Hacé clic en **"Create new project"** y esperá ~1 minuto a que termine de aprovisionarse.
4. Obtené tu cadena de conexión (`DATABASE_URL`):
   - Andá a **Project Settings** (ícono de engranaje abajo a la izquierda) → **Database**.
   - En la sección **Connection string**, seleccioná la pestaña **URI** (o Node.js).
   - Copiá la URL directa (puerto `5432`) o la URL con Session Mode (puerto `5432`):
     ```text
     postgresql://postgres.[PROJECT-REF]:[TU-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
   - **Importante**: Reemplazá `[TU-PASSWORD]` por la contraseña que creaste en el paso 2.

---

## Fase 2: Backend API & Admin Console en Render

1. Subí tus últimos cambios a tu repositorio de GitHub:
   ```bash
   git add .
   git commit -m "feat: configuracion para deploy en Supabase, Render y Vercel"
   git push origin main
   ```
2. Ingresá a [render.com](https://render.com) e iniciá sesión con GitHub.
3. Hacé clic en **"New +"** → **"Web Service"**:
   - Seleccioná **"Build and deploy from a Git repository"** → Elegí tu repositorio `Portfolio`.
4. Configurá el servicio:
   - **Name**: `portfolio-api` (o el nombre que elijas).
   - **Region**: Preferentemente la misma o cercana a la de Supabase (ej. `Oregon` o `Frankfurt`).
   - **Branch**: `main`.
   - **Runtime**: `Node`.
   - **Build Command**: 
     ```bash
     corepack enable && pnpm install --no-frozen-lockfile && pnpm build:api
     ```
   - **Start Command**: 
     ```bash
     pnpm start:api
     ```
   - **Instance Type**: `Free`.
5. En la sección **"Environment Variables"**, agregá:
   - `DATABASE_URL`: La URL completa que copiaste de Supabase en la Fase 1.
   - `ADMIN_TOKEN`: Una clave secreta para acceder a tu panel `/admin` (ej: `mateo-admin-2026`).
   - `CORS_ORIGIN`: `*` (o la URL de Vercel cuando la generes).
   - `NODE_VERSION`: `22`.
6. Hacé clic en **"Deploy Web Service"**.
   - Render clonará el repositorio, generará Prisma y aplicará las migraciones SQL directamente en Supabase.
7. **Poblar los datos iniciales (Seed)**:
   - Una vez que el deploy termine y diga *Live*, andá a la pestaña **"Shell"** en el menú lateral de Render y ejecutá:
     ```bash
     pnpm db:seed
     ```
   - Verás la confirmación de la carga de proyectos (La Rúcula, ARG Piscinas, Ynara, etc.), stack y trayectoria.
8. **Copiá la URL pública de Render**:
   - Arriba a la izquierda verás la URL asignada a tu API (ej: `https://portfolio-api-xxxx.onrender.com`).

---

## Fase 3: Frontend Nuxt 4 en Vercel

1. Ingresá a [vercel.com](https://vercel.com) e iniciá sesión con GitHub.
2. Hacé clic en **"Add New..."** → **"Project"**.
3. Buscá tu repositorio `Portfolio` y hacé clic en **"Import"**.
4. Vercel detectará automáticamente que es un proyecto **Nuxt.js**:
   - **Framework Preset**: `Nuxt.js`.
   - **Build Command**: `pnpm build` (o por defecto).
   - **Output Directory**: por defecto.
5. Desplegá la sección **"Environment Variables"** y agregá:
   - **Name**: `NUXT_PUBLIC_API_BASE`
   - **Value**: La URL de Render de la Fase 2 terminada en `/api`:
     ```text
     https://portfolio-api-xxxx.onrender.com/api
     ```
6. Hacé clic en **"Deploy"**.
7. En ~60 segundos el build finalizará y Vercel te entregará la URL en vivo con SSL (ej: `https://portfolio-xxxx.vercel.app`).

---

## Verificación Final

1. **Portafolio en Vivo**: Entrá a tu URL de Vercel. Verificá que carguen las tarjetas de proyectos, métricas Lighthouse y el CV.
2. **Consola de Administración**:
   - Entrá a `https://tu-portfolio.vercel.app/admin` (se conecta mediante proxy a Render).
   - O entrá directamente a `https://portfolio-api-xxxx.onrender.com/admin`.
   - Ingresá con tu `ADMIN_TOKEN`. Podrás editar proyectos y datos en tiempo real impactando directamente en Supabase.
3. **Dominio Propio (Opcional)**:
   - En Vercel: Andá a **Settings** → **Domains** y agregá tu dominio (ej. `mateosonzogni.com`).
   - En Render: Podés asociar `api.mateosonzogni.com` si lo deseás.

---

## Resumen de Variables por Plataforma

| Servicio | Variable | Valor |
|---|---|---|
| **Supabase** | *(Genera)* `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@[host]:5432/postgres` |
| **Render** | `DATABASE_URL` | Pegar la URI de Supabase |
| **Render** | `ADMIN_TOKEN` | Tu token privado para el admin |
| **Render** | `CORS_ORIGIN` | `*` o URL de Vercel |
| **Vercel** | `NUXT_PUBLIC_API_BASE` | `https://portfolio-api-xxxx.onrender.com/api` |
