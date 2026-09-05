# Cómo está armado este entorno

Guía de mantenimiento. Qué va dónde y por qué.

## El principio

`CLAUDE.md` se carga entero en **cada** sesión, sea relevante o no para la tarea. Cada línea gasta contexto y diluye la adherencia a las instrucciones que sí importan. La recomendación oficial es mantenerlo por debajo de las 200 líneas.

Por eso todo lo específico se movió a lugares que cargan a demanda.

## Dónde va cada cosa

| Si es… | Va en… | Se carga… |
|---|---|---|
| Cierto en toda sesión (invariantes, stack, comandos, mapa) | `CLAUDE.md` | siempre |
| Convención de una parte del código | `.claude/rules/*.md` con `paths:` | al tocar archivos que coinciden |
| Procedimiento de varios pasos que se corre a veces | `.claude/skills/<nombre>/SKILL.md` | al invocarlo, o cuando Claude lo detecta relevante |
| Contexto largo, razonamiento, historia | `docs/` | cuando alguien lo pide o una regla lo referencia |
| Algo que tiene que correr sí o sí | hook en `.claude/settings.json` | en el evento configurado |

La última fila importa: **`CLAUDE.md` es contexto, no configuración forzada.** Claude lo lee y trata de seguirlo, pero no hay garantía de cumplimiento estricto. Si algo tiene que ejecutarse antes de cada commit, va como hook.

## Reglas con `paths:`

```markdown
---
paths:
  - "app/worlds/datos/**"
---
```

Sin `paths:` la regla se carga siempre, y ahí es mecánicamente idéntica a poner el contenido en `CLAUDE.md`. **Si una regla no tiene scope, revisar si de verdad aplica a todo el proyecto.**

Las tres actuales:

- `datos.md` — CSS 3D, claridad sobre efecto, la trampa del loop de columnas, el vocabulario de base de datos
- `diseno.md` — los cinco criterios, los defaults a evitar, la cohesión
- `backend.md` — el schema como diseño, el contrato de URL, los subsets por mundo

## Skills

Cargan a demanda. La `description` tiene que nombrar **los verbos que el usuario realmente escribe** — "revisar", "chequear", "auditar" — porque de eso depende que se disparen.

- `/revision-mundos` — la más importante. Convierte el invariante 2 en un chequeo que se corre, no en una línea que se lee y se olvida.
- `/nueva-seccion` — obliga a tres propuestas y a pasar por los cinco criterios antes de construir.
- `/piso-calidad` — la auditoría de cierre de fase.

## Mantenimiento

**Cuándo agregar algo a `CLAUDE.md`:** cuando Claude comete el mismo error por segunda vez, cuando escribís la misma corrección que ya escribiste la sesión pasada, o cuando alguien nuevo necesitaría ese contexto para ser productivo.

Pero antes de agregarlo ahí, preguntarse si no va mejor en una regla con scope o en una skill.

**`/doctor`** propone recortes al `CLAUDE.md`: saca lo que Claude puede deducir del código —estructura de carpetas, listas de dependencias, resúmenes de arquitectura— y conserva las trampas, el razonamiento y las convenciones que se apartan de los defaults de las herramientas. Correrlo cada tanto.

**`/context`** muestra qué archivos de memoria cargaron de verdad en la sesión. Si una regla no aparece, no se está viendo.

**Memoria automática:** Claude escribe sus propias notas a partir de tus correcciones y preferencias, aparte de estos archivos. `/memory` las muestra y son markdown editable. No hace falta anotar cada corrección a mano.

**Comentarios HTML** (`<!-- … -->`) se eliminan antes de inyectar el contenido en contexto. Sirven para dejar notas a humanos sin gastar tokens.

## Si usás otros agentes

Claude Code lee `CLAUDE.md`, no `AGENTS.md`. Si el repo ya usa `AGENTS.md` para otra herramienta, crear un `CLAUDE.md` que lo importe:

```markdown
@AGENTS.md

## Claude Code
[instrucciones específicas acá]
```

## Documentación

- Memoria y CLAUDE.md — https://code.claude.com/docs/en/memory
- Skills — https://code.claude.com/docs/en/skills
- Cuándo usar cada mecanismo — https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
