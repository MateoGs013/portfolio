---
name: nueva-seccion
description: Procedimiento para agregar o rediseñar una sección del mundo DISEÑO. Usar cuando el usuario pida crear una sección nueva, cambiar el tratamiento de una existente, proponer ideas para una sección, o diga que un tratamiento actual no le convence.
---

# Nueva sección del mundo DISEÑO

Cada sección de DISEÑO tiene su propia forma. Este es el procedimiento para encontrarla, no para aplicarle una plantilla.

## 1 · Antes de proponer nada

Leer `docs/decisiones.md`. Hay caminos ya cerrados —lienzo continuo, navegación simétrica con DATOS, metáforas instrumentales— y proponerlos de nuevo hace perder tiempo.

Después, mirar el dato:

- ¿Qué campos tiene realmente esta colección?
- ¿Cuál es su dimensión dominante? Tiempo, cantidad, jerarquía, materia, ninguna.
- ¿Qué pregunta viene a hacer alguien que entra acá?

**La forma sale del dato.** Si el tratamiento se decide antes de mirar los campos, va a quedar genérico.

## 2 · Proponer al menos tres formas

Nunca una sola. Con una no hay comparación posible y la primera idea suele ser el default.

Para cada una, escribir en una línea: **qué te deja hacer** y **qué te cuesta**.

## 3 · Pasarlas por los cinco criterios

Están en `.claude/rules/diseno.md`. Descartar las que no pasen el 1 (diferencia los mundos), el 2 (le queda bien a ese contenido) y el 3 (se entiende en veinte segundos).

El criterio 3 es el que más se rompe cuando se busca originalidad. **Distinto no es lo mismo que difícil.**

## 4 · Chequear cohesión

La forma elegida tiene que compartir con las otras secciones **instrumento, material o variable**. Si no comparte ninguno de los tres, es una idea suelta.

Si aporta un instrumento nuevo, evaluar si conviene que reaparezca en otra sección. Los motivos que se repiten con distintos trabajos son los que hacen que el mundo se sienta uno solo.

## 5 · Recién ahora, construir

- Componente en `app/worlds/diseno/sections/`.
- Consumir el endpoint existente. **No agregar campos al schema para acomodar un tratamiento** sin discutirlo primero: eso invierte la relación entre contenido y forma.
- Animación con GSAP. Entrada con stagger. `expo.out` como default — llega rápido, frena lento, da peso.
- `prefers-reduced-motion` salta al estado final. Verificar que la sección se entienda sin una sola animación.
- Degradar bien si faltan media o capas.

## 6 · Cerrar

- Correr `/revision-mundos`.
- Anotar en `docs/decisiones.md`: qué se eligió, qué se descartó y por qué. Sobre todo lo descartado — es lo que evita repetir el camino.
