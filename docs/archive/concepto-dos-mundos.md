# Concepto

El porqué, en largo. Leer antes de proponer algo estructural.
Para qué se descartó cada alternativa, ver `docs/decisiones.md`.

---

## La tesis

El sitio muestra el mismo contenido renderizado de dos formas radicalmente distintas. Esa capacidad no es una función del portafolio: **es su argumento**. Tomar una estructura de información y darle dos formas coherentes y opuestas es literalmente la descripción del trabajo de quien lo hizo.

Los dos mundos son dos disciplinas de igual rango, no dos niveles de esmero. Ninguno es la versión reducida del otro.

## Cada mundo presume en una moneda distinta

| | DISEÑO | DATOS |
|---|---|---|
| Presume de | materialidad, tiempo, oficio | velocidad, precisión, control |
| La información | se revela | está toda ahí, a un keystroke |
| Temperatura | oscuro, cálido | claro, frío |
| Ritmo | lento a propósito | instantáneo |
| Densidad | baja, respirada | alta |
| Motion | es el material | es latencia |
| Estructura | una forma por sección | un renderer para todo |
| El flex | lo que ves | lo que carga, mide y es accesible |

El flex del mundo DATOS no es decorativo: carga instantáneo, se navega entero con teclado, no tiene layout shift, funciona con JS apagado y es accesible de verdad. **Eso es la demostración de criterio front.** Y puede exponerse como contenido: el sitio mostrando su propio bundle size, su LCP, su score de accesibilidad. Un mundo esconde la máquina, el otro la muestra.

## El permiso que dan los dos mundos

Un portafolio solo tiene que servirle a todos, así que termina siendo un promedio. Con dos, **cada uno puede ser extremo**.

DATOS puede ser áspero, denso y sin concesiones porque DISEÑO existe. DISEÑO puede negarse a ser eficiente porque quien tiene apuro tiene la otra puerta a un gesto de distancia. Ninguno de los dos podría permitirse esto solo.

Corolario incómodo pero cierto: **perderse en DISEÑO es aceptable, y solo porque existe DATOS.**

## Un modelo, dos renderers

```
        ┌──────────────┐
        │  BACKEND     │
        │  un record   │
        └──────┬───────┘
               │ mismos endpoints
        ┌──────┴───────┐
        │              │
   ┌────▼────┐   ┌─────▼────┐
   │ DISEÑO  │   │  DATOS   │
   │ el      │   │ hechos   │
   │ trabajo │   │ sobre el │
   │         │   │ trabajo  │
   └─────────┘   └──────────┘
```

Cada mundo elige su subset. DISEÑO pide imágenes, proceso, texto largo. DATOS pide tags, fechas, rol, métricas, relaciones. **Un record tiene todos los campos y ninguno se duplica.**

Si los dos mundos muestran los mismos campos, están diciendo lo mismo con distinta tipografía — y ahí se cae todo. Es la falla más fácil de cometer y ya se cometió una vez.

## El schema es trabajo de diseño

Normalmente el modelo de datos es invisible. Acá no: el mundo DATOS muestra los nombres de campo, sus tipos y sus relaciones. **Cómo se nombra una columna es una decisión que el visitante ve.**

Eso convierte el modelado de datos en parte del diseño, y es un criterio que prácticamente nadie muestra en un portafolio.

## La URL es la query

```
/datos/projects?stack=webgl&year=2024   →   GET /api/projects?stack=webgl&year=2024
```

El estado de navegación deja de ser estado de UI y pasa a ser un request. Compartible, bookmarkeable, y el back/forward del browser sale gratis.

La cabeza de un recruiter ya funciona como query: "React, 3+ años, remoto". Una interfaz de base de datos le deja **correr** esa consulta en lugar de scrollear buscando. Y su CV —experiencia, stack— es tabular de verdad: el mundo DATOS no lo está disfrazando de tabla, lo está mostrando en su forma real.

## El umbral

Pantalla partida en dos; el visitante elige. No es una pantalla aparte del sistema: es el nivel cero. Cuando elegís, la costura se abre y **entrás** — el mismo gesto que vas a repetir después.

Es la tesis en miniatura y es lo primero que se ve, así que tiene que argumentar sin palabras. Salteable con link directo; la elección persiste.

## El pasaje

`render → source`. El mundo DISEÑO se despinta y deja ver su estructura; lo que queda a la vista no es "otro sitio", son los registros crudos. No es jerárquico: es la misma cosa en dos capas de abstracción, pintura y esqueleto, las dos necesarias.

El nombre del record existe en los dos mundos: se clona y vuela de una posición a la otra cambiando de tipografía en el camino. **Lo único que sobrevive intacto es el dato**, y verlo viajar es la tesis hecha animación.

## Riesgos

**Tono.** Vos como record, con campos y tipos, es frío. Funciona porque el otro mundo es cálido y hecho a mano. Si DISEÑO queda corto, DATOS se lee como que no te interesa la gente. **Los dos se sostienen mutuamente.**

**Costo.** DISEÑO pide dirección de arte pieza por pieza. No escala solo y no se puede fingir. Por eso va segundo y el sitio tiene que poder salir sin él.

**Alcance.** Dos mundos duplican superficie de mantenimiento. El seguro es el modelo de contenido único.

## Referencia visual

Analógico y cinematográfico antes que tech o startup: vinilo, neón de club de jazz, vidrio acanalado retroiluminado, grano de película, muestrarios de papel, mesas de luz. El mundo DATOS toma la otra mitad: documentación técnica ejecutada con rigor, spec sheets, planos de ingeniería, números tabulares.
