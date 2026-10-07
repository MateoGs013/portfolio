---
name: revision-mundos
description: Verifica que los dos mundos no hayan convergido. Usar cuando el usuario pida revisar, chequear o auditar una feature, cuando pregunte si los mundos se parecen demasiado, o antes de dar por terminada cualquier tarea que toque los dos renderers.
---

# Revisión de convergencia

La falla más fácil de este proyecto es que los dos mundos terminen mostrando lo mismo con distinta piel. Ya pasó una vez: los dos prototipos mostraban año, rol, cliente y stack, y por más que se vieran distintos se sentían iguales.

Correr esto antes de dar una feature por terminada.

## 1 · Campos

Abrir `app/lib/fieldMeta.ts` y listar qué campos declara cada mundo.

- Contar campos exclusivos de DATOS y exclusivos de DISEÑO.
- **Si más de la mitad de los campos están en `['datos','diseno']`, hay convergencia.** Reportarlo.
- Para cada campo compartido, preguntar si hace falta en los dos o si se copió por inercia.

## 2 · Estructura de navegación

- ¿DATOS sigue renderizando todas las colecciones con el mismo componente?
- ¿DISEÑO sigue teniendo un tratamiento distinto por sección?
- Si alguna de las dos se rompió, la asimetría —que es la diferencia estructural entre los mundos— se perdió.

## 3 · Trasplante

Tomar un tratamiento del mundo DISEÑO y preguntarse: **¿funcionaría igual de bien en el otro mundo?**

Si la respuesta es sí, ese tratamiento no está haciendo su trabajo. Es decoración, no diferenciación.

## 4 · Temperatura

Revisar los tokens en uso.

- ¿DATOS sigue siendo claro y frío? ¿DISEÑO oscuro y cálido?
- ¿Difieren también en densidad y ritmo, o solo en paleta?
- Si un mundo empezó a usar tokens del otro, anotarlo.

## 5 · Ritmo

- ¿DATOS sigue con motion casi nulo? Cualquier animación nueva ahí es sospechosa: en ese mundo el movimiento es latencia.
- ¿DISEÑO sigue teniendo peso y física, o se volvió cortes secos?

## 6 · Invariantes de contenido

- ¿Hay contenido duplicado entre mundos, o siguen leyendo del mismo record?
- ¿La posición se conserva al cambiar de mundo?
- ¿Todo sigue siendo alcanzable desde DATOS sin mouse y con JS apagado?

## Salida

Reportar en este formato, sin arreglar nada todavía:

```
CONVERGENCIA: baja | media | alta

Campos      X exclusivos DATOS · Y exclusivos DISEÑO · Z compartidos
Estructura  ok | rota — [qué]
Trasplante  [tratamiento] pasaría/no pasaría al otro mundo
Temperatura ok | contaminada — [dónde]
Ritmo       ok | [qué se desvió]
Contenido   ok | [qué se duplicó]

HALLAZGOS
1. …
```

Si la convergencia es media o alta, **decirlo antes de proponer arreglos**. El diagnóstico primero.
