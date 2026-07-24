# Etapa 01 · Ideación — "Notas al margen"

> Dirección ganada por juicio adversarial (23-jul-2026): 3 direcciones
> independientes (motion-first / contenido-first / editorial-first) juzgadas
> contra la ley anti-slop de DESIGN.md §0. Base: "Notas al margen"
> (editorial-first, la única que pasó limpia) + dos injertos: la regla de
> autoría "lo azul es mío" y la tinta-que-se-seca. Este doc es la spec de la
> home; DESIGN.md sigue siendo la ley general.

## Tesis

La Ideación de Mateo no es un mood-board: es **leer el problema ajeno con
lápiz en la mano**. El display gigante de la home NO es su nombre ni una
tagline — es el problema real con el que llegó cada encargo, en discurso
indirecto verificable contra `proyectos.ts` ("Un PDF escaneado colgado de un
QR", "el mostrador era el cuello de botella"), con el dominio en producción
al lado.

**La regla del lápiz (binaria y unidireccional): el azul (`--accent`) es
siempre y solamente la intervención de Mateo** — el trazo que rodea una
palabra, la nota al margen, el tick del índice. Y no es decoración: nace
fresco y **se seca a `--ink` en ~3,5 s**, el mismo secado del rodillo que ya
existe en `tipos.ts`. Cero comillas de cliente inventadas: todo discurso
indirecto defendible palabra por palabra contra `proyectos.ts`.

## Primer viewport

Papel cálido pleno (paleta Afiche vía tokens; `data-tema="ideacion"` hereda
`:root`). Sin grilla, sin textura agregada, sin chrome.

- **Cabecera de una línea**: `h1` real "mateo sonzogni" (Archivo 600, 14 px)
  + nav de etapas "ideación · maquetado · programación · producto" (Plex 13 px
  minúscula; la activa por peso/tinta, no subrayado) + toggle de tinta.
  Las etapas futuras existen como stubs — jamás un 404.
- **El display** (blockquote semántico): "Un PDF escaneado / colgado de un
  QR." en Archivo 900 wdth 62, líneas autorales fijas (nada de SplitText).
  Sin guillemets — es la descripción literal de proyectos.ts, no un
  testimonio fingido.
- **La atribución** (Plex 13 px `--soft`): "así llegó el encargo · La Rúcula
  Gastrobar, Chiclana — hoy es laruculagastrobar.es".
- **La nota al margen** (col. derecha, máx 26 ch): la idea, unida a "QR" por
  una **elipse a mano que no cierra** — doble pasada con presión variable por
  el `hash()` determinista de la casa (cero rough-notation). Nace `--accent`,
  se seca a `--ink`. Único accent de la pantalla.
- **El retrato**: canvas `tipos.ts` en estado boceto (charset `ideacion`
  ` ·-/\`), pegado al filo inferior derecho sobre una hairline full-width
  (la regla del banco — la única línea de la página). El texto que pisa el
  canvas **knockea la trama** (el boceto no dibuja celdas bajo el texto):
  texto y retrato comparten papel, no columnas.
- **El cue de scroll**: el puente asoma cortado por el pliegue. Sin flecha.

Qué NO hay: grilla blueprint, cruces `+`, "ETAPA 01"/"PLIEGO"/contadores,
nombre grande, kicker de design-thinking, preloader, botón, borde de color.

## Secuencia de carga (la carga ES la primera animación)

1. **0 ms** — SSR pinta papel + cabecera + display + atribución. El estado
   pre-animación vive en la clase `js-motion` (inline anti-FOUC, solo con JS
   y sin reduced-motion). Sin JS o con reduced-motion, la página pinta
   completa. Cero overlay, cero %.
2. **~150 ms** — el problema se escribe: cada línea con `clip-path` izq→der,
   0,55 s/línea, `tinta`, solapadas (stagger 0,2).
3. **Paralelo** — el retrato nace con la intro de `tipos.ts` (delays hash,
   blur 5→0 en 1 s `tinta`). Ningún beat espera al retrato.
4. **~1,2 s** — el lápiz rodea "QR": elipse por `stroke-dashoffset`, 0,5 s
   `tinta`, en `--accent`. Medida post `fonts.ready`, recalculada en resize.
5. **~1,7 s** — la nota se descubre (wipe `tinta`); la atribución ASIENTA con
   `prensa` (0,2 s) — el dato cae seco.
6. **~2,1 s** — la elipse **se seca** (accent→ink, τ≈3,5 s). Reposo de taller.

## Actos de scroll

1. **El puente** (flujo): "así me llegan los encargos:".
2. **La mesa de encargos** — el ÚNICO pin (~260 vh, scrub 0,6, reversible):
   tres problemas se intercambian. Entrante ESTAMPA con `prensa`, saliente
   con `salida`, trazos con `tinta`. Layout varía por encargo (cero rima):
   - ARG Piscinas — "Venían de mostrar la obra por WhatsApp, foto por foto."
     (elipse en "WhatsApp").
   - barberpole — "El mostrador era el cuello de botella." (elipse en
     "mostrador"; atribución en primera persona honesta).
   - Ynara — "¿Y si una página no se navega, sino que se recorre?" **El lápiz
     se levanta: no hay trazo** (el problema se lo preguntó él); en su lugar
     el retrato scrubbea su opacidad. La ausencia del gesto ES el gesto.
3. **El índice de encargos** (flujo, escaneable): problema-first, Plex Mono;
   tick a lápiz (accent→seca) en las filas en producción, no badge.
4. **El pase de etapa**: el último trazo **se endereza** (morph scrubbeado)
   en la primera línea recta — la primera columna del maquetado. Copy sobre
   ESTE material. Link a `/maquetado`.
5. **Colofón** compartido + firma "pensado y hecho por mateo sonzogni".

## El nombre (chico y ganado)

(1) h1 de 14 px en cabecera; (2) firma final sobre el colofón; (3) [PENDIENTE
— beat §3 DESIGN.md] los glifos del boceto componen "mateo sonzogni" un
instante sobre el colofón y se disuelven. Nunca gritado.

## Reduced-motion / mobile / lifecycle

- **Reduced-motion**: sin `js-motion` ⇒ pinta completa; elipses trazadas y
  secas; sin pin (los tres problemas en flujo).
- **Mobile ≤700 px**: una columna; la elipse pasa a **subrayado a lápiz**
  bajo la palabra (el margen no existe); retrato anclado abajo en `svh`.
- **Theme-proof**: ningún tween de color resuelto — el color siempre por
  `var()` en CSS (el secado es una transición de `stroke`).
- **Lifecycle**: init en `astro:page-load` gated por `data-tema="ideacion"`;
  ScrollTriggers con id `ideacion-` para kill selectivo en `astro:before-swap`.

## Deudas conscientes (no vendidas como hechas)

- Fase pre-imagen del retrato (tipos sueltos antes del `onload`): diferida —
  el asset es local y chico; se agrega si aparece red lenta real.
- El beat del nombre en glifos (§3) — diferido a un paso propio.
- La nota al margen se descubre con UN wipe (no por línea).
