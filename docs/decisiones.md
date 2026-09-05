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

**PostgreSQL, no MySQL.**
Descartado: MySQL (el stack inicial).
Prisma trata a Postgres como ciudadano de primera: enums, arrays nativos (`String[]` para `stack`, `languages`) y JSON con índices, todo cosas que el mundo DATOS muestra en pantalla como tipos declarados. MySQL obliga a serializar los arrays o a tablas puente por cada lista chica. Además es lo que ofrecen gratis Neon, Supabase y Railway. Decidido el 5 de septiembre de 2026, antes de escribir el schema.

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

---

## Abierto

- **El schema.** Cuáles son las colecciones reales y con qué campos. Bloquea todo lo demás.
- **El admin.** Propio con Prisma, o Payload. Evitar Directus: se parece tanto al mundo DATOS que va a parecer que se embebió el panel.
- **Cómo se muestra que DISEÑO todavía no está listo** si el sitio sale al final de la Fase 3. Un botón en `disabled` es la solución mínima; que la espera sea parte del diseño es la buena.

---

<!-- Al agregar una entrada: decisión · alternativa descartada · por qué. Lo descartado importa más que lo elegido. -->
