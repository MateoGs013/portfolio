# Decisiones

Qué se probó, qué se eligió y qué se descartó. **Leer antes de proponer algo creativo** — hay caminos ya cerrados y volver a proponerlos hace perder tiempo.

Formato: decisión · alternativa descartada · por qué.

---

## Concepto

**Dos mundos como disciplinas, no como audiencias.**
Descartado: "modo experimental" vs "modo recruiter".
Mezclaba dos categorías —una estética y una audiencia— y le decía implícitamente al visitante que la versión buena no era para él. El recruiter, apurado, entraba por la puerta marcada como aburrida. "Diseñador / programador" son dos disciplinas y nadie lee una como versión reducida de la otra.

**Cada mundo puede ser extremo.**
Tener dos permite que ninguno sea el promedio. DATOS puede ser áspero porque DISEÑO existe; DISEÑO puede negarse a ser eficiente porque la otra puerta está a un gesto. Un portafolio solo nunca podría hacer esto.

---

## Mundo DATOS

**Explorador de columnas tipo Finder.**
Descartado: capas apiladas a pantalla completa.
Una capa que tapa a la anterior no es un explorador. Con columnas se ve la ruta entera y se puede saltar de lado.

**CSS 3D, no WebGL.**
El requisito pedía profundidad 3D y máxima accesibilidad, que normalmente se pelean. Con Three.js el texto queda en canvas: no se selecciona, no aparece en Ctrl+F, no lo lee un lector de pantalla, no lo indexa Google. Sería el mundo accesible construido sobre la tecnología menos accesible.

**Profundidad casi imperceptible entre columnas (~56px).**
Descartado: viaje espectacular en cada navegación.
A la tercera vez sería una molestia. Todo el drama del eje Z se gasta una sola vez, en el umbral.

**Paleta clara y fría.**
Descartado: oscuro con acento, para los dos mundos.
Si los dos son oscuros, el switch se siente como un reskin. Claro y frío contra oscuro y cálido se siente como cambiar de material.

**Los prototipos son estructura, no look.**
Descartado: reproducir `mundo-datos-v3.html` / `dos-mundos.html` con tokens.
La Fase 2 salió así y Mateo la rechazó: "se ve exactamente igual que los demos, y solo eran para mostrarte la idea". De los prototipos queda qué hay (columnas, ruta, detalle con tipos, pasaje) y se decide de nuevo todo lo demás.

**Dirección de la Fase 3: hoja técnica, no Finder.**
Descartado: la columna tipo Finder de 224px con hover gris, etiquetas mono en mayúsculas espaciadas, títulos en negrita apretada.
El referente es el documento técnico bien compuesto (spec sheet, plano, tabla de figuras), no el explorador de archivos ni la terminal. Lo que eso significa en concreto:
- **Identificadores en minúscula y sin espaciado**, tal como están en el schema (`startedAt`, `relation → Org`). Las etiquetas mono en mayúsculas espaciadas son un tell de plantilla y además mienten sobre cómo se llama el campo.
- **Filas numeradas** (`01`, `02`) y con aire: 44px de alto, nombre en General Sans 500 a 15px, dato dominante alineado a la derecha en mono. El número de fila es lo que hace que la lista se lea como registro y no como menú.
- **La ruta se ve como una escalera de bloques negros.** La fila elegida se invierte (regla del mundo) y el encabezado de la columna siguiente es ese mismo nombre, también invertido. No hay línea dibujada ni ornamento: la propia inversión, repetida, es el trazo de la ruta.
- **El detalle es una hoja de especificaciones:** el nombre grande (40px, 600, apretado) como único gesto tipográfico, debajo la línea `record · Project · actualizado 2026-09-05`, y la tabla de campos con el tipo alineado a la derecha en su propia columna. Los valores que son filtros válidos (`year`, `status`, `role`, `category`, cada tech, cada org) son links con subrayado punteado que agregan la faceta a la URL: **facetar es tocar un valor**, no abrir un panel.
- **La raíz es la persona, no la base.** Descartado: una hoja con motor, tablas y cantidad de registros como primera pantalla (se probó y se rechazó el mismo día: parecía un panel de administración). Quien entra por `/datos` ve a Mateo como registro (rol, origen, disponibilidad, idiomas, contacto) y debajo las tablas con sus conteos. El motor y el request quedan en el pie.
- **Mono solo para identificadores.** Descartado: rieles, ayudas y contadores en monospace. Con todo en mono el conjunto parecía consola. Nombres de campo, tipos, ruta y request van en Martian Mono; todo lo demás, incluidos los rótulos de los rieles y el dato dominante de cada fila, en General Sans.
- **La máquina a la vista, con números medidos:** el pie muestra el request real, el status y los milisegundos que tardó, no un adorno.
- **Perspectiva casi nula** (56px en Z, opacidad que cae hasta 0.55) y una sola transición: la columna nueva entra 12px desde la derecha en 160ms. Todo lo demás es instantáneo.
- **"Ir a" con `/`:** una línea de texto sobre el papel, resultados como filas `projects / La Rúcula Gastrobar`. Sin prompt, sin cursor parpadeando: no es una consola, es un índice.

---

## Mundo DISEÑO

Esta es la parte que más iteró. Tres direcciones se probaron y se descartaron antes de llegar a la actual.

**❌ Entintado por gesto del usuario.**
Los proyectos existían como contorno y el cursor los iba rellenando.
Malinterpretación: "se va dibujando" se leyó como un gesto del usuario. Lo que se quería decir era que **la interfaz se construye sola** mientras navegás.

**❌ Campo continuo sin niveles.**
Un espacio infinito, sin buscador ni índice, donde las piezas se resolvían por proximidad y permanencia.
Demasiado difícil de entender. Para diferenciar el mundo se le sacó todo lo que hace legible una interfaz y quedó algo que había que descifrar antes de poder usarlo. **Un portafolio tiene veinte segundos de crédito.** Distinto no es lo mismo que difícil.

**❌ Misma navegación que DATOS con otra piel.**
Cuatro niveles idénticos, mismos campos, distinta estética.
Se sentían iguales. Y el error de fondo era otro: **los dos mundos mostraban los mismos campos** —año, rol, cliente, stack—. Literalmente decían lo mismo. De ahí salió el invariante 2.

**❌ Metáforas instrumentales.** Mesa de mezcla, tocadiscos, patch cables.
Venían del moodboard de vinilo pero eran decoración importada. Un diseñador dibuja, no mezcla audio.

**❌ Lienzo infinito con zoom.**
Es un género ya, y todos los niveles se sienten iguales.

**✅ Una forma por sección.**
DATOS renderiza todo igual porque una base de datos trata a todos los records del mismo modo. DISEÑO le da a cada contenido su tratamiento porque eso es diseñar. Esa asimetría es la diferencia estructural entre los mundos.

Lo probado, con el razonamiento —**referencia, no norma**:

| Sección | Tratamiento | Por qué |
|---|---|---|
| `projects` | La pieza se construye en capas mientras llegás, con scrubber | La interfaz construyéndose es el oficio a la vista. El scrubber convierte el proceso en algo que se desarma en vez de leer. |
| `experience` | Bandas superpuestas sobre eje de años, cabezal arrastrable | Un CV *es* eso. No se lo disfraza de línea de tiempo, se lo muestra en su forma real. |
| `stack` | Chips físicos abanicados, años leídos en el tamaño | Existe sobre todo para no caer en barras de porcentaje. La materialidad reemplaza a la métrica inventada. |
| `about` | Specimen tipográfico con los ejes de Fraunces manipulables | Muestra criterio tipográfico haciéndolo en vez de declarándolo. |
| `contact` | La tinta baja sobre el papel, links como sellos | Un formulario es una barrera con buena prensa. |

**Cohesión por instrumento, material y variable.**
El scrubber reaparece con distintos trabajos (construcción en proyectos, tiempo en experiencia), el material es papel sobre oscuro, y los ejes de Fraunces atraviesan todo. Si los tratamientos cambian, que compartan algo equivalente.

---

## Backend

**`orgs` como modelo, no strings sueltos.**
Descartado: `client` en proyectos y `company` en experiencia como texto.
La misma organización puede ser cliente de un proyecto y empleador en una experiencia. Como modelo, `project.org` y `experience.org` son relaciones de verdad y DATOS puede saltar de lado entre ellas. No es colección de primer nivel: se llega por relación.

**`since` en lugar de `years` en stack.**
Un contador de años envejece; un año de inicio no. Los años se derivan al renderizar.

**Fechas reales en experience, no años.**
DISEÑO las dibuja como bandas sobre un eje y DATOS las muestra como `date`. Con años sueltos las bandas mienten.

**`experience.org` opcional y el rol como nombre del record.**
Descartado: organización obligatoria con el nombre de la empresa como título, como en un CV clásico.
Toda la experiencia es freelance o propia: "freelance desde 2023" y el título técnico no tienen una empresa detrás, y forzar una sería mentir. El rol nombra la etapa; la organización, cuando existe, rotula la banda en DISEÑO. Migración `experience_org_optional`.

**Campos compartidos solo con motivo escrito.**
`slug` y el nombre del record (ruta y ancla del pasaje), fechas de experience y `since` de stack (la dimensión dominante de cada colección). Todo lo demás es exclusivo de un mundo. El motivo va como comentario en `fieldMeta.ts`.

**Admin propio, no Payload ni Directus.**
Descartado: Payload (trae su propio schema y duplicaría el modelo, contra el invariante 1) y Directus (se parece tanto al mundo DATOS que parecería el panel embebido).
Cuatro proyectos que se editan cada tanto no justifican un CMS. Es un router de Express con token fijo y una página Vue sin build, generada desde un descriptor por modelo. Cuesta unas 600 líneas y no agrega dependencias de peso.

**PostgreSQL, no MySQL.**
Descartado: MySQL (el stack inicial).
Prisma trata a Postgres como ciudadano de primera: enums, arrays nativos (`String[]` para `stack`, `languages`) y JSON con índices, todo cosas que el mundo DATOS muestra en pantalla como tipos declarados. MySQL obliga a serializar los arrays o a tablas puente por cada lista chica. Además es lo que ofrecen gratis Neon, Supabase y Railway. Decidido el 5 de septiembre de 2026, antes de escribir el schema.

---

## Shell

**La posición es la ruta, y el truncado es una tabla.**
Descartado: un store en memoria que recuerde dónde estaba cada mundo.
`path = [raíz, slug, sub]` se lee de la URL en los dos mundos. Cada mundo declara hasta qué profundidad entiende cada raíz (`depth` en `app/lib/path.ts`): DATOS baja a la subvista, DISEÑO se detiene en el record y no tiene `orgs`. Al cambiar de mundo se recorta a eso y nada más. La query viaja intacta aunque DISEÑO no filtre: así la vuelta a DATOS encuentra los filtros donde estaban.

**El mundo elegido se guarda en una cookie, no en localStorage.**
Con cookie el servidor redirige `/` al mundo recordado en el primer byte, sin flash del umbral ni JS. Entrar por link directo a un mundo también lo elige. `/umbral` es el alias que siempre muestra el umbral.

**Los tokens de los dos mundos cargan siempre, con prefijo.**
Descartado: un solo set de tokens semánticos que cambia de valor según el mundo.
El umbral y el control de pasaje necesitan las dos paletas a la vez, y el pasaje animado (Fase 6) también. `--d-*` es DATOS y `--n-*` es DISEÑO; el mundo activo va en `html[data-mundo]` y de ahí sale el fondo.

**Preload de fuentes por superficie, con las URLs del bundler.**
Descartado: copiar las fuentes a `public/` para tener rutas fijas, o el módulo `@nuxt/fonts`.
`?url` de Vite da la misma URL hasheada que emite el CSS de @fontsource, así que el preload coincide sin duplicar archivos. Cada superficie precarga solo lo que usa arriba de todo: DATOS mono y sans, DISEÑO Fraunces y sans, el umbral las tres.

---

## El pasaje

**Ancla FLIP sobre el nombre del record.**
Descartado: cross-fade entre los dos mundos.
El nombre existe en los dos lados, así que se clona y vuela de una posición a la otra cambiando de tipografía y tamaño. Lo único que sobrevive intacto es el dato, y verlo viajar es la tesis hecha animación. Una transición completa entre dos DOMs distintos es cara; una sola ancla más una cortina alcanza.

**Ida y vuelta no son la misma animación al revés.**
`render → source`: DISEÑO despinta y deja ver su estructura, DATOS pinta hacia el otro lado.

---

## Umbral

**Pantalla partida en dos, el visitante elige.**
Descartado: modal con dos botones, y entrar por defecto a uno con el switch visible.
El umbral es la tesis en miniatura y hay que gastarlo bien. Tiene que ser salteable con link directo y la elección persiste.

**Cada mitad tiene la temperatura de su mundo.**
Descartado: el umbral uniformemente oscuro del prototipo `dos-mundos.html`.
Papel frío a la izquierda, película cálida a la derecha: la costura entre las dos ya es la tesis sin una palabra. El nombre cruza la costura en `mix-blend-mode: difference`, negro sobre el papel y claro sobre la película, una sola vez escrito.

---

## Abierto

- **Cómo se muestra que DISEÑO todavía no está listo** si el sitio sale al final de la Fase 3. Un botón en `disabled` es la solución mínima; que la espera sea parte del diseño es la buena.

---

<!-- Al agregar una entrada: decisión · alternativa descartada · por qué. Lo descartado importa más que lo elegido. -->
