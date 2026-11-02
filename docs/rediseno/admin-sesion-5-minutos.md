# Sesión de 5 minutos: cargar una obra sin saber programar

Gate humano de la ola 5 del rediseño del admin (paquete U7). El invariante 4 de `.claude/rules/admin.md` pide que un asistente sin conocimientos de programación cargue un proyecto, redacte el caso, asigne tecnologías y suba imágenes en menos de cinco minutos, sin errores de formato. Con Imágenes y Datos editables en `/admin`, la carga entera se hace en el editor de la obra y se guarda con un solo Guardar.

Si la sesión no baja de 5 minutos o la persona comete un error de formato, la ola no cierra: se corrige lo que trabó y se repite antes de E1.

## Alcance

El alcance es literal (plan §9). Se carga una obra nueva en español con:

- **Lo esencial:** título y rol. El año y la situación quedan como vienen (año actual, En desarrollo).
- **Relato:** síntesis, reto, resultado y un paso con su título y su texto.
- **Datos:** tres tecnologías del catálogo.
- **Imágenes:** tres imágenes, cada una con su texto alternativo.

El inglés, las métricas, los enlaces y la publicación quedan afuera: se miden e informan aparte.

## Estimación con las constantes de la auditoría

Antes de la sesión se cuenta el recorrido con las constantes de la auditoría: 2 s por clic y 12 s por campo. El tope es de 15 campos y 16 clics.

| Paso | Campos | Clics |
|---|---|---|
| Título y rol | 2 | 0 |
| Pestaña Relato | 0 | 1 |
| Síntesis, reto y resultado | 3 | 0 |
| Agregar paso, título y texto | 2 | 1 |
| Pestaña Datos y tres tecnologías (escribir y Enter) | 3 | 1 |
| Pestaña Imágenes, Elegir archivos y elegir las tres en el diálogo del sistema | 0 | 5 |
| Texto alternativo de las tres | 3 | 0 |
| Guardar | 0 | 1 |
| **Total** | **13** (156 s) | **9** (18 s) |

El total estimado es de **174 s (2 min 54 s)**, dentro del tope de campos y de clics. Dos cosas ahorran pasos:

- al sumar las imágenes, el foco va solo al texto alternativo de la primera;
- la primera imagen queda como portada.

Tampoco hace falta guardar antes de subir: la obra se crea y sus imágenes suben en el mismo Guardar.

## Recorrido automatizado

`tests/e2e/admin-obras-imagenes.spec.ts`, prueba «obra nueva completa en un solo Guardar», hace este mismo recorrido sobre una copia de la base:

- escribe en los campos;
- elige las tecnologías con el teclado;
- suelta las tres imágenes antes de que la obra exista.

Después comprueba lo que quedó:

- un solo POST de la obra y tres de media;
- una portada;
- el inglés del texto alternativo;
- las tres tecnologías;
- que el pie dice «3 imágenes por subir» antes y «Guardado» después.

Sin texto alternativo, Guardar no manda nada y marca el campo. La prueba mide que el recorrido funciona, no el tiempo de una persona: eso lo da la sesión.

```bash
pnpm build:admin
node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-obras-imagenes.spec.ts
```

## Protocolo de la sesión

### Preparación (Mateo, unos 10 minutos antes)

La sesión corre sobre una copia de la base, nunca sobre `portfolio`. En PowerShell, desde la raíz del repositorio:

```powershell
node scripts/admin-db.mjs create sesion
pnpm build:admin
$env:DATABASE_URL = "postgresql://portfolio:portfolio@localhost:5432/portfolio_admin_sesion?schema=public"
$env:API_PORT = "3016"
$env:ADMIN_TOKEN = "<una clave solo para la sesión>"
$env:HUNTER_API_URL = "http://127.0.0.1:9"
$env:EROS_API_KEY = "offline"
pnpm prisma migrate deploy
pnpm start:api
```

Después:

1. Abrir `http://localhost:3016/admin/` y entrar con esa clave.
2. Dejar la pantalla en **Obras**.
3. Copiar tres capturas a una carpeta del escritorio, por ejemplo tres de `public/media/projects/argpiscinas/`.
4. Tener a mano el contenido de abajo, en un documento aparte.

### Consigna (se lee en voz alta)

> «Cargá una obra nueva con este contenido. Pegá cada texto en su lugar, sumá estas tres tecnologías y estas tres imágenes, cada una con una descripción de lo que muestra, y guardala. Avisame cuando termines. No te voy a ayudar salvo que te trabes más de un minuto.»

### Contenido para pegar

Es contenido de práctica: la obra se borra al terminar.

- **Título:** Casa Nómade
- **Rol:** Diseño y desarrollo
- **Síntesis:** Un sitio para una casa de comidas, de la carta a las reservas.
- **Reto:** La carta vivía en un PDF que nadie actualizaba y las reservas llegaban por teléfono a cualquier hora.
- **Resultado:** La carta se actualiza desde un panel y las reservas llegan ordenadas, con la confirmación por correo.
- **Paso, título:** La carta primero
- **Paso, texto:** Se armó la carta como datos y no como imagen, para que se pueda leer en el celular y traducir.
- **Tecnologías:** Vue, GSAP y Vite.
- **Imágenes:** las tres de la carpeta del escritorio. El texto alternativo lo escribe la persona mirando cada una.

### Qué se registra

- Tiempo desde el primer clic en «Nueva obra» hasta el aviso «Obra creada» con el pie en «Guardado».
- Errores de formato: cualquier aviso de un campo mal escrito, o un dato que quedó en el lugar equivocado.
- Tropiezos: cada vez que la persona duda más de 5 segundos, vuelve atrás o pregunta. Se anota dónde y qué dijo.
- Al final, en la obra guardada:
  - la portada es la primera imagen;
  - las tres tienen su texto;
  - las tecnologías son las tres pedidas;
  - el paso tiene título y texto.

### Al terminar

1. Borrar la obra desde «Más acciones → Eliminar obra». Se lleva sus archivos de `public/media/projects/`.
2. Cortar la API.
3. Borrar la copia de la base:

   ```powershell
   node scripts/admin-db.mjs drop sesion
   ```

## Registro

Se completa con la sesión. Hasta entonces el gate de la ola está abierto.

| Fecha | Persona (sin nombre: perfil) | Tiempo | Errores de formato | Tropiezos | ¿Cierra? |
|---|---|---|---|---|---|
| Sin sesión todavía | | | | | No |

### Notas de la sesión

Sin sesión todavía.
