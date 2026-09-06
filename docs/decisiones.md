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

**Una carpeta por pantalla (revisado el 5-sep-2026, ver más abajo).**
Descartado primero: capas apiladas a pantalla completa, porque una capa que tapa a la anterior no es un explorador. Elegido entonces: columnas tipo Finder, para ver la ruta entera y saltar de lado. Descartado después: las columnas, porque con tres superficies a la vez la navegación abrumaba. Lo que las columnas daban se conserva de otra forma: la ruta entera está en el riel superior y el salto de lado son los vecinos de la hoja.

**CSS 3D, no WebGL.**
El requisito pedía profundidad 3D y máxima accesibilidad, que normalmente se pelean. Con Three.js el texto queda en canvas: no se selecciona, no aparece en Ctrl+F, no lo lee un lector de pantalla, no lo indexa Google. Sería el mundo accesible construido sobre la tecnología menos accesible.

**Profundidad casi imperceptible (~56px), y solo al entrar o salir de una carpeta.**
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
- **La hoja es de dos columnas cuando hay ancho.** Descartado: la hoja como bloque angosto pegado a las columnas, con el resto de la pantalla vacío. A partir de 1700px el título vive en su propia columna (fija) y los campos en la de lectura; el tipo va en una columna angosta pegada al valor, nunca en el borde derecho de una fila de 1000px. Por debajo, todo se apila.
- **La máquina a la vista, con números medidos:** el pie muestra el request real, el status y los milisegundos que tardó, no un adorno.
- **Perspectiva casi nula** (56px en Z, opacidad que cae hasta 0.55) y una sola transición: la columna nueva entra 12px desde la derecha en 160ms. Todo lo demás es instantáneo.
- **"Ir a" con `/`:** una línea de texto sobre el papel, resultados como filas `projects / La Rúcula Gastrobar`. Sin prompt, sin cursor parpadeando: no es una consola, es un índice.

**Revisión de UX del 5-sep-2026: la colección es una tabla y el record una hoja plana.**
Descartado: la colección como columna angosta de 256px con la "definición de la tabla" (nameField, filters, schema) ocupando el panel grande; las relaciones de un record como columna aparte (`techs 05 items ›`) que abría un tercer nivel; el "ir a" como texto suelto en el riel.
Mateo lo revisó con capturas y el diagnóstico fue que la navegación directa se había perdido: quien entra buscando algo concreto (un recruiter con "React, 3 años" en la cabeza) veía los nombres truncados en una columna, el stack escondido detrás de un click más, y metadata del schema donde esperaba los datos. El sistema era coherente pero no servía para ir directo a lo que se busca. Lo que cambió:
- **Una colección es una tabla.** `/datos/projects` muestra los records como filas anchas, con las columnas que se comparan de un vistazo (`fieldMeta[...].list`: título, año, rol, stack, estado, url) y el tipo de cada una en el encabezado. Cada valor filtrable es un link con subrayado punteado que corre la query: tocar "Vue 3" en la tabla es `?stack=vue`. Los filtros disponibles se leen en la línea bajo el título. Un solo componente (`DatosTable.vue`) para todas las colecciones: el invariante 6 sigue en pie.
- **El record es una hoja plana, sin sub-nivel.** Las relaciones se leen en la hoja y cada item es un link: `techs` lista las tecnologías con link a su record, `links` las URLs, y una tech lista los proyectos y experiencias que la usan (el mismo request que el filtro). `depth` de DATOS baja a 2. Tres niveles para llegar al stack de un proyecto era demasiado.
- **Orden de lectura, no orden de schema.** El orden de campos en `fieldMeta` es el orden de la hoja: primero lo que dice qué es (summary, año, rol, estado), después relaciones y links, al final la metadata (`publishedAt`, `updatedAt`, `slug`). El nombre del record es el título de la hoja y no se repite como fila.
- **"Ir a" parece lo que es.** Un campo con borde, `ir a` en mono, el placeholder `proyecto, tecnología, etapa…` y la tecla `/`. El control de mundo entra en el riel superior de 48px en vez de flotar sobre su línea.

**Segunda revisión del 5-sep-2026: un explorador de archivos, no columnas ni tablas.**
Descartado: el explorador de columnas en perspectiva (columna `db` siempre visible, columna de la colección al lado de la hoja, escalera de bloques invertidos, desvanecido a la izquierda, `↑↓` que navegaban entre records a cada tecla). Descartado también, en un segundo intento de la misma noche: la raíz como ficha de la persona con el índice debajo, y la colección como tabla de seis columnas con tipos en el encabezado. Seguía mostrando todo a la vez.
Mateo lo usó y el diagnóstico fue que la navegación abrumaba: en un record había tres superficies a la vez, cada una con su encabezado, su conteo y su metadata, y la columna de `stack` con 22 items scrolleaba sola al lado de la hoja. Pidió un explorador de archivos literal: que al principio aparezca solo la navegación, como carpetas, y que al entrar recién se vea la sección; con el teclado intacto pero también usable de la forma tradicional. Lo que cambió:
- **Una sola cosa por pantalla: una carpeta o una hoja.** La raíz es la carpeta de la base: cinco baldosas y nada más; la persona vive en `about` y `contact` como todo lo demás. Una colección es la carpeta de sus records: una baldosa por record con el nombre y el dato dominante (año, período, `since`). El stack, el rol y los links se leen al abrir el record, no en la lista.
- **Vista de íconos, no lista.** Descartado (tercer intento de la misma noche): la carpeta como lista de filas de 44px con nombre y dato a la derecha. Mateo la vio "demasiado minimalista" y pidió que simulara mejor las carpetas, como grilla. Ahora cada item es una baldosa con su ícono dibujado en SVG inline (carpeta para una tabla, archivo con la esquina doblada para un record o un documento), el dato adentro del ícono (`06` en la carpeta, `2026` en el archivo), el nombre debajo y el número de orden en la esquina. El trazo es tinta de 1.5px sin relleno ni sombra: la estructura del dato sigue siendo la única decoración, pero ahora se ve que es un explorador sin leer nada. Las flechas se mueven en las cuatro direcciones de la grilla y `Backspace` sube.
- **La hoja es un archivo abierto, no una portada.** Descartado: el nombre del record a 44px con la regla de tinta arriba (herencia de la "hoja técnica"). Mateo: "siento que no queda bien, no parece acorde al tema". Dentro de una ventana de explorador, el título editorial era de otro mundo. La cabecera pasa a ser la de un archivo: el ícono de documento con la cantidad de campos adentro, el nombre a 22px, la línea de tipo debajo y los vecinos como dos botones `‹ ›` a la derecha, con el mismo borde que los botones de la barra.
- **La misma cabecera en los tres niveles, y los márgenes alineados.** Mateo, al ver la carpeta con la línea discreta junto al archivo con ícono: "tendría que ser en todos similares, o buscar otra solución para que no se vea tan sobrio en la navegación principal, y prestá atención con los márgenes y centrados". `DatosCabecera.vue` es una sola para la base, la colección y el record: ícono con el dato adentro, nombre a 22px, línea de tipo, y a la derecha botones de 30px (filtros activos en una carpeta, vecinos en un archivo). Los márgenes se unificaron en dos tokens: `--d-frame` alrededor de la ventana (igual a los lados y abajo, con el pasaje apoyado sobre esa línea arriba) y `--d-inset` adentro (barra, contenido y estado en la misma vertical). La hoja dejó de tener ancho máximo para que sus reglas crucen la ventana como las de la carpeta.
- **Todo adentro de una ventana.** Pedido de Mateo tras ver la grilla: "haría un recuadro que sea más como el explorador de archivos y ahí dentro la navegación tal cual está ahora". Los dos rieles sueltos pasaron a ser la barra de herramientas y la barra de estado de un recuadro de tinta de hasta 1320px apoyado sobre el papel: `←` `→` de historial, `↑` para subir (un link real, apagado en la raíz), la ruta dentro de un campo como barra de dirección, el "ir a" al lado; abajo el conteo, el request con sus milisegundos y las teclas. El control de pasaje queda en la franja de arriba, al ras del borde derecho de la ventana, como un control del escritorio y no de la ventana. En el teléfono la ventana es la pantalla. Un solo componente para las dos carpetas (`DatosFolder.vue`) y uno para la hoja (`DatosDetail.vue`). La columna `db` y la tabla desaparecen; `fieldMeta[...].list` también.
- **La ruta es la barra de dirección.** Lo que las columnas daban ("ver la ruta entera") lo da el riel superior: `db / projects / la-rucula`, cada segmento clickeable. Es la navegación por carpetas que cualquiera conoce.
- **El salto de lado son los vecinos.** La hoja de un record muestra `‹ anterior` y `siguiente ›` con sus nombres, tomados de la misma lista filtrada: con `?stack=vue`, los vecinos son los proyectos con Vue.
- **El teclado es el de una carpeta y no navega al mover.** `↑↓` mueven el foco por las filas del panel (roving focus), `→`/`Enter` abren la fila con foco, `←`/`Backspace`/`Esc` suben y dejan el foco en la fila de la que se venía. Antes cada `↑↓` era un request; ahora mover el foco no toca la ruta, que sigue siendo el único estado (invariante 3, mejor cumplido que antes). En una hoja, donde no hay filas, `↑↓` pasan al vecino.
- **El mouse hace lo mismo de la forma tradicional.** Cada fila es un link, y se vuelve por la ruta o con el botón atrás del navegador.
- **La profundidad queda como gesto, no como disposición.** Entrar a una carpeta acerca el panel nuevo 56px en Z, subir lo trae desde adelante; pasar a un vecino lo corre 12px. Sigue siendo CSS 3D, sigue siendo casi imperceptible, y `prefers-reduced-motion` lo apaga.
- **Facetar sigue siendo tocar un valor, pero en la hoja.** `year`, `role`, `category` y `featured` son links con subrayado punteado gris que dejan la carpeta filtrada; los filtros activos se ven como chips con `×` arriba de la lista. Quien busca "qué hizo con Vue" entra a `stack`, abre Vue y ve sus proyectos y experiencias listados ahí mismo.
- **Mobile deja de ser un caso aparte.** Carpetas y hojas se ven igual en el teléfono; solo se apagan la perspectiva y las ayudas de teclado.

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

**Fase 4 (6-sep-2026): `projects` es una tira de película y el proyecto se pinta mientras se cuenta.**

Lo que hay en la base al empezar la fase: seis proyectos, tres con portada, tres con etapas (título y cuerpo, sin media), tres con brief y resultado, **ninguno con capas** (`Media.layer` vacío en todos). La forma tenía que salir de eso y no de lo que se prometió en el prototipo.

Se pesaron tres formas:
1. *La pieza se construye en capas con scrubber* (la del prototipo). Deja ver el oficio capa por capa; cuesta que no hay una sola capa cargada y la mecánica degradaría en los seis proyectos a "aparece la portada". Descartada como eje: queda como enriquecimiento cuando un proyecto traiga capas.
2. *Pliegos que se desenrollan al scrollear*: la portada adelante y cada etapa como una hoja que baja. Deja leer con calma; cuesta que el scroll como instrumento no es de nadie (funciona igual en cualquier sitio, criterio 4) y que en DISEÑO el tiempo lo tiene que manejar un instrumento a la vista.
3. **Tira de película y pintado por etapas** (elegida). El índice es una tira de fotogramas retroiluminados, uno por proyecto, con el nombre en Fraunces debajo; los que no tienen portada son un fotograma oscuro con su inicial. Tocar uno lo agranda (FLIP del fotograma a la obra) y el proyecto se cuenta con un scrubber: la obra empieza apagada y se va pintando a medida que pasan el encargo, las etapas y el resultado, y el texto de cada etapa se enciende cuando le toca. La tira queda abajo, chica, para pasar de proyecto. Deja ver la pieza y el proceso en un solo gesto y con un solo instrumento; cuesta que la obra sea una sola imagen por proyecto (por ahora).

Por qué pasa los criterios: **1** un carrete retroiluminado con la obra pintándose no tiene sentido en el explorador de archivos de DATOS; **2** sale de lo que un proyecto es acá (una pieza y cómo se llegó a ella), no de un layout; **3** una tira de fotogramas y un slider se entienden sin leer nada; **4** la película viene de la referencia visual del concepto ("película sobre luz"), no de un generador; **5** el índice es barato (seis fotogramas), lo caro (pintado, FLIP) pasa una vez por proyecto.

Cohesión: el **instrumento** es el scrubber (reaparece en `experience` con el tiempo), el **material** es la película retroiluminada sobre oscuro, la **variable** son los ejes de Fraunces: el título entra fino y blando (`wght` 300, `SOFT` 100) y llega a su peso con la obra.

Degradación, por si faltan cosas: sin portada, la obra es una placa oscura con la inicial en Fraunces que se entinta con el scrubber; sin etapas, el scrubber tiene dos paradas (encargo y resultado, o solo la pieza); sin brief ni resultado, se cuenta lo que hay. Sin JS: todo renderizado en su estado final, el scrubber no aparece. `prefers-reduced-motion`: la línea de tiempo arranca en el final y el scrubber sigue funcionando porque lo maneja el visitante.

Descartado dentro de la forma elegida: perforaciones en la tira (ornamento), autoplay en loop (criterio 5), mostrar año, rol o stack en la tarjeta (son de DATOS; acá la tarjeta es solo la obra y el nombre), y etiquetas mono en mayúsculas para las etapas (los títulos de las etapas ya vienen del contenido).

**La cabecera de DISEÑO y la hoja de contactos (6-sep-2026).**
Descartado: la barra de secciones de la Fase 2 (cinco celdas iguales a todo el ancho, con el control de pasaje flotando encima y pisándola) y el índice de proyectos como una tira sola centrada en el vacío. Mateo: "la navegación se superpone con el cambiador de mundos, y me gustaría un mínimo de front más aceptable y desarrollado".
La cabecera es una fila de 72px (`--n-head`) con tres cosas: la marca (el nombre, leído del documento `about`, en Fraunces a 19px), las secciones como links de texto con la activa subrayada en ámbar, y a la derecha el lugar reservado para el control de pasaje, que sigue siendo fijo y del layout pero ahora se centra en esa misma fila (`top` calculado desde `--n-head`). En el teléfono la marca y el pasaje comparten la primera fila y las secciones bajan a una fila que scrollea. El índice de proyectos pasa de tira a **hoja de contactos**: la misma película, pero en grilla de columnas de 300px, con el nombre en Fraunces a 26px debajo de cada fotograma; la tira chica sigue bajo la obra. Es el mismo componente (`ProyectosTira.vue`) con dos tamaños.

**Fase 5 (6-sep-2026): `experience` es una exposición larga.**

El dato: siete etapas entre 2017 y hoy, superpuestas de verdad (desde 2024 corren tres a la vez), con organización en seis y relato en dos. La dimensión es el tiempo y la pregunta de quien entra es "qué estaba haciendo y cuándo".

Se pesaron tres formas:
1. *Bandas sobre el eje de los años con cabezal arrastrable* (la del prototipo). Muestra la simultaneidad, que es lo que un CV en lista esconde; cuesta que un gantt es la primera respuesta (criterio 4) y que las bandas solas no dicen nada hasta que se las lee.
2. *Un rollo de fotogramas, una etapa por cuadro*. Reusa la película de `projects` tal cual; cuesta que es un trasplante (criterio 2): la experiencia no es una pieza que se mira, es tiempo que pasa.
3. **Exposición larga** (elegida). Las bandas del prototipo, pero el instrumento es el mismo scrubber de `projects` y lo que mueve es una fecha: el cabezal recorre los años y donde está se encienden las etapas que corrían entonces, y arriba se lee en grande "en junio 2021" con los roles encendidos debajo. Al llegar, el cabezal viaja del primer día a hoy en 2,6 s (`expo.out`: rápido al principio, lento al final, como una exposición larga que revela). Abrir una etapa la deja encendida en ámbar, lleva el cabezal a su mitad y muestra su relato. Deja ver a la vez la simultaneidad y una respuesta concreta por fecha; cuesta que en el teléfono las etapas cortas quedan chicas.

Cohesión: el **instrumento** es el mismo `DisenoRango.vue` que en `projects` (ahí mueve el relato, acá el tiempo); el **material** sigue siendo película retroiluminada (bandas apagadas que se encienden, un cabezal ámbar con halo); la **variable** son los ejes de Fraunces: "en" va en `wght` 380 / `SOFT` 100 y la fecha en 560 / 40.

Degradación: sin JS, las bandas y los años se ven en su estado final, con hoy como fecha, y cada banda es un link; el cabezal y el scrubber no aparecen. Con `prefers-reduced-motion` no hay viaje: el cabezal aparece en hoy o en la etapa abierta. Una etapa sin organización no muestra organización; sin relato, solo su tiempo. Las bandas cortas (menos del 16% del eje) llevan el nombre afuera, a su izquierda, en vez de truncarlo.

Descartado dentro de la forma: mostrar el stack de cada etapa (es de DATOS), contar meses o años de duración (métrica inventada, criterio 4), y un título aparte para la etapa abierta (repetía la lectura grande; el rol *es* el h1).

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
