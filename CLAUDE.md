# Portfolio — Mateo Sonzogni

Portfolio personal de un creative developer. Concepto **"Ediciones"**: un mismo
contenido que se "reimprime" en distintos sistemas de diseño (Afiche · Terminal ·
Plano), cada uno con modo claro y oscuro diseñados por separado. Incluye un
mini-juego clicker ("La imprenta") que desbloquea las ediciones.

**Regla de oro: antes de tocar cualquier cosa visual o de motion, leé
`docs/DESIGN.md`.** Ahí está la ley del proyecto: qué se hace, qué no, y por qué.
El cliente detectó patrones "de plantilla IA" en la primera iteración — ese doc
existe para que no vuelva a pasar.

## Comandos

```bash
npm run dev        # dev server en localhost:4321
npm run build      # build a dist/
npm run qa         # harness visual: 3 ediciones × 2 temas × 2 viewports
                   # (correr después de npm run build; levanta preview solo)
```

Al iniciar el dev server preferí modo background: `astro dev --background`
(manejo con `astro dev stop|status|logs`).

## Arquitectura

```
docs/DESIGN.md          Ley de diseño y motion (leer SIEMPRE antes de UI)
qa/review.mjs           QA visual con Playwright → qa/artifacts/ (gitignored)
src/
  assets/proyectos/     Screenshots reales de producción (los consume Tirada.astro)
  data/proyectos.ts     Fuente única de los proyectos (nada de contenido duplicado)
  layouts/Base.astro    <html> + fuentes + anti-FOUC (lee ms-tema / ms-theme)
  components/           Secciones de página (.astro), estilos scoped
  pages/index.astro     Home (ensambla componentes + importa scripts/site.ts)
  pages/pieza/[slug].astro  Casos de estudio (proyectos con `caso` en los datos);
                        el título morfea desde la tirada (transition:name)
  pages/especimen.astro Espécimen del sistema de diseño (referencia interna)
  scripts/              Motion en módulos:
    site.ts               entry — orquesta e importa el resto
    eases.ts              curvas del sistema (prensa/tinta/salida) — las ÚNICAS
    lenis.ts              scroll con inercia (ticker de GSAP)
    registro.ts           registro de tintas (reemplazo del preloader) +
                          pageReveal() reutilizado por el cambio de edición +
                          scrub de drift al scroll
    tema.ts               selector de edición (barrido) + claro/oscuro + persistencia
    halftone.ts           trama duotono canvas (el momento firma): las fotos de
                          proyectos se "imprimen" — planchas tinta/acento a
                          15°/75° que convergen a registro con el progreso
    tirada.ts             ScrollTriggers scrub de las piezas (halftone + wipes)
  styles/
    tokens.css            TODO el color vive acá (6 paletas: 3 ediciones × 2 temas)
    base.css              reset, focus, reduced-motion, .wrap
    ediciones.css         reglas globales que dependen de data-tema (.only-*, hero)
```

## Contratos que no se rompen

- **Tokens**: los componentes consumen `var(--bg|--bg2|--ink|--soft|--accent|--accent-ink|--line|--grid|--font-d|--font-b|--font-m)`. Cero color o fuente hardcodeada fuera de `tokens.css`.
- **Temas**: `data-tema` en `<html>` elige la edición; el claro/oscuro sigue a
  `prefers-color-scheme` y `data-theme` lo pisa en ambas direcciones. Cualquier
  componente nuevo debe verse bien en las **6 combinaciones**.
- **Estilos por edición**: los estilos de componentes Astro son scoped — todo
  selector que cruce `:root[data-tema=...]` con un componente va en
  `ediciones.css`, no inline ni con `:global()` disperso.
- **Motion**: GSAP timelines en `src/scripts/` (no inline en componentes).
  `prefers-reduced-motion` se respeta SIEMPRE. Ojo con `immediateRender` de los
  `fromTo` en timelines diferidas: crearlas dentro de un callback `.add(() => ...)`.
- **View transitions**: hay `<ClientRouter />` en Base.astro — los scripts se
  ejecutan UNA vez; todo init de DOM va en `astro:page-load` y la limpieza
  (ScrollTriggers, instancias halftone) en `astro:before-swap`. El anti-FOUC
  lleva `data-astro-rerun` porque el swap pisa los atributos de `<html>`.
- **Contenido**: proyectos salen de `src/data/proyectos.ts`. Copy en español
  rioplatense (vos), sin grandilocuencia ni relleno.
- **Persistencia**: `localStorage` → `ms-tema`, `ms-theme`, `ms-tirada` (clicker);
  `sessionStorage` → `ms-intro`.

## Flujo de trabajo

1. Leer `docs/DESIGN.md` si el cambio toca UI/motion.
2. Implementar. 3. `npm run build && npm run qa` — cero overflow horizontal y
   revisar screenshots de `qa/artifacts/` en las 6 combinaciones.
4. Commit en español, cuerpo explicando el porqué. El usuario revisa cada paso:
   avanzar de a un paso por vez, no hacer todo de una.

## Docs de Astro

Documentación completa: https://docs.astro.build

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Componentes Astro](https://docs.astro.build/en/basics/astro-components/)
- [Componentes de framework (Vue)](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Estilos](https://docs.astro.build/en/guides/styling/)
- [i18n](https://docs.astro.build/en/guides/internationalization/)
