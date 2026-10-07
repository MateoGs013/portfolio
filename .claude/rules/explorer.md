---
paths:
  - "app/components/explorer/**"
  - "app/components/cv/**"
  - "app/components/ui/**"
  - "app/lib/explorer.ts"
---

# Explorador Técnico & CV

Una ventana de explorador de archivos apoyada sobre el papel. Tinta sobre papel: claro, frío, plano. Se ve una carpeta o un archivo abierto, nunca las dos cosas; se entra con un click o Enter y se vuelve por la barra de dirección o con `Backspace`.

## Reglas

- **DOM semántico y accesible, nunca WebGL.** El texto tiene que seguir siendo DOM: seleccionable, buscable con Ctrl+F, leíble por lector de pantalla, indexable. Este frontend es el piso de accesibilidad del sitio; construirlo sobre canvas lo contradice.
- **Gana la claridad sobre el efecto.** El explorador existe para argumentar precisión técnica y criterio. La profundidad es solo el gesto de entrar o salir de una carpeta: el panel se acerca o se aleja `--d-z` (56px).
- **Un solo renderer para todas las colecciones.** Una base de datos trata a todos los records igual: la misma carpeta, la misma baldosa, la misma cabecera, el mismo archivo abierto. No hacer tratamientos especiales por colección.
- **Una sola cosa por pantalla.** Una carpeta muestra solo sus items; recién al abrir uno aparece su contenido. Si una pantalla combina dos superficies, está mal aunque cada una sea sobria. Para Mateo "abrumador" es cantidad de cosas a la vez, no densidad tipográfica.
- **La estructura del dato es la decoración.** Tipos declarados (`string`, `relation → Org`), `NULL` a la vista, `05 records` en lugar de un título decorativo, el conteo o el año dibujado adentro del ícono. Identificadores en minúscula y sin espaciado, tal como están en el schema. No inventar ornamento.
- **El acento naranja (`--d-sig` / `#ff3e00`) es solo para relaciones, links y filtros.** El estado (foco, hover) se marca con borde y fondo gris, no con saturación de color.

## Anatomía y Componentes (`app/components/`)

Toda la lógica de resolución vive en `app/lib/explorer.ts`: resuelve el path en lo que hay que dibujar, y los componentes renderizan la vista:

- **La ventana** (`ExplorerView.vue`, `.ventana`): recuadro de tinta de hasta 1320px centrado en el papel. El marco alrededor es `--d-frame` a los lados y abajo. Adentro, la barra, el contenido y la barra de estado comparten el margen `--d-inset`: todo lo que empieza a la izquierda empieza en la misma vertical.
  - **Barra de herramientas:** `←` `→` (historial del navegador), `↑` (subir un nivel), la ruta como barra de dirección (cada segmento es una carpeta a la que se vuelve) y el "ir a".
  - **Barra de estado:** conteo, el request real con status y milisegundos, las teclas.
- **La cabecera** (`ExplorerHeader.vue`), igual en los tres niveles: el ícono con el dato dominante adentro, el nombre a 22px (`--d-fs-title`), la línea de tipo en mono debajo (`database · 05 tables`, `collection · Project · 06 records`, `record · Project · updatedAt · 14 fields`) y, a la derecha, botones de 30px con borde gris: los filtros activos en una carpeta (`stack = vue ×`), los vecinos `‹ ›` en un archivo.
- **El ícono e indicador** (`ExplorerBadge.vue` y `AppIcon.vue`): silueta de carpeta o archivo con indicador numérico integrado en SVG inline, sin relleno ni sombras.
- **La carpeta** (`ExplorerFolder.vue`), para la base y para cada colección: la cabecera y una grilla de baldosas (`--d-tile` de ancho mínimo, `auto-fill`). En la raíz, carpeta por tabla y archivo por documento; la persona está en `about` y `contact`. En una colección, un archivo por record con el dato dominante adentro (año, `since`, año de inicio) y el nombre debajo.
- **El archivo abierto** (`ExplorerDetail.vue`): la cabecera y los campos en orden de lectura, con el tipo en su columna al lado del valor. Las relaciones están a la vista y cada item es un link; los valores filtrables (`year`, `role`, `category`, `featured`) son links con subrayado punteado que dejan la carpeta filtrada.
- **CV Dual Modular** (`app/components/cv/`):
  - `CvContainer.vue`: controlador orquestador, toolbar con selector y exportación A4.
  - `CvHarvardAts.vue`: render académico ATS en blanco y negro, sin foto, 1 página A4 estricta.
  - `CvModernIde.vue`: render moderno en modo editor de código / IDE dark con fotografía técnica.
- **"Ir a"** (`ExplorerGoto.vue`): índice filtrado al escribir.
- **Ventana de archivo rápido** (`ExplorerFileWindow.vue`): previsualizador modal.

## Teclado y mouse

Las cuatro flechas mueven el foco por la grilla · `Enter` abre la baldosa con foco · `Backspace` / `Esc` suben un nivel y dejan el foco en la baldosa de la que se venía · `/` o `Cmd+K` abren el "ir a". Mover el foco no navega: la ruta sigue siendo el único estado. El mouse hace lo mismo: click en una baldosa, en un segmento de la ruta o en los botones de la barra.

Todo el contenido tiene que ser alcanzable sin mouse y con JS apagado.

## Mobile

Por debajo de ~900px la ventana sigue siendo una ventana: el mismo marco, y crece con el contenido en vez de scrollear adentro. Bajo 640px las baldosas se achican (`--d-tile-sm`) para que entren tres por fila y los botones de la cabecera bajan a su propia fila.

## Defaults a evitar

Cosplay innecesario de terminal con textos ficticios o efectos que obstruyan la lectura. Cero animaciones gratuitas. Imágenes a sangre evitadas: van con datos (thumbnail con filename y dimensiones).
