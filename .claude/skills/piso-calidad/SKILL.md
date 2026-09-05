---
name: piso-calidad
description: Auditoría de accesibilidad, performance y degradación antes de cerrar una fase o hacer deploy. Usar cuando el usuario pida auditar, revisar accesibilidad, chequear performance, verificar que algo funcione sin JS, o preguntar si una fase está lista.
---

# Piso de calidad

En este proyecto la accesibilidad no es un requisito externo: **el mundo DATOS es el argumento de que se sabe hacer front bien**. Si falla, se cae la mitad de la tesis.

Correr antes de cerrar una fase.

## 1 · Sin JavaScript

Deshabilitar JS y navegar el mundo DATOS.

- ¿Llega contenido renderizado del servidor?
- ¿Las rutas son links reales?
- ¿Se puede llegar a cada record?

Si no, el SSR está mal y nada de lo demás importa.

## 2 · Solo teclado

Desenchufar el mouse y recorrer el sitio entero.

- `↑↓` `→` `←` `/` en DATOS.
- ¿El foco es siempre visible? ¿`:focus-visible` tiene contraste suficiente contra el fondo de cada mundo?
- Al entrar a un nivel, ¿el foco va al heading de ese nivel? Al salir, ¿vuelve al item del que se salió?
- ¿Se puede cambiar de mundo con teclado?

## 3 · Lector de pantalla

- Cada columna es una región con nombre (`section aria-label`) para navegar por regiones. **No** usar `inert`: mata el click lateral, que es la razón de tener columnas (decidido el 5-sep-2026, ver `docs/decisiones.md`).
- Las capas del mundo DISEÑO fuera de la vista activa, igual.
- Los SVG decorativos con `aria-hidden="true"`.
- Las imágenes con `alt` real, no el filename.

## 4 · Reduced motion

Activar `prefers-reduced-motion: reduce`.

- ¿Toda animación salta al estado final?
- ¿La construcción por capas del mundo DISEÑO muestra la pieza terminada?
- ¿El pasaje entre mundos es un corte y no se rompe?
- **¿Se entiende todo el sitio sin una sola animación?** Si algo solo se comprende viéndolo moverse, está mal diseñado.

## 5 · Layout shift y carga

- CLS en cero. Las fuentes variables son pesadas: `font-display`, preload de las críticas, y reservar espacio.
- Sin FOUC en el cambio de mundo.
- Medir el bundle. **Este es contenido, no solo métrica**: el mundo DATOS puede exponer sus propias cifras y eso es presumir en su moneda.

## 6 · Responsive

- DATOS por debajo de ~900px: perspectiva apagada, una columna sola.
- DISEÑO: verificar que cada sección tenga una versión mobile pensada, no solo apretada.
- Probar a 320px de ancho.

## 7 · Degradación de contenido

- Un proyecto sin `media` con capas: ¿el mundo DISEÑO se rompe o degrada?
- Un record con `metrics: null`: ¿DATOS muestra `NULL` o queda un hueco?
- Una colección vacía: ¿hay estado vacío o crashea?

## Salida

```
FASE: n · listo | no listo

Sin JS        ok | falla — [qué]
Teclado       ok | falla — [qué]
Lector        ok | falla — [qué]
Reduced       ok | falla — [qué]
CLS / carga   [cifras]
Responsive    ok | falla — [qué]
Degradación   ok | falla — [qué]

BLOQUEANTES
1. …
```

No dar una fase por cerrada con bloqueantes abiertos, aunque la feature "funcione".
