# Portfolio — Mateo Sonzogni

Portfolio personal de un creative developer. Concepto **"Ediciones"**: un mismo
contenido que se "reimprime" en distintos sistemas de diseño (Afiche · Terminal ·
Plano, siempre libres), cada uno con modo claro y oscuro diseñados por separado
y su propio reencuadre del contenido. El mini-juego clicker ("La imprenta", en
la home) desbloquea la 4ª edición secreta **Fanzine** a los 20 ejemplares
(`ms-tirada` / `ms-fanzine` en localStorage).

Cada edición es una **ruta** propia (`/` = Afiche · `/terminal` · `/plano` ·
`/fanzine`): el selector navega y el `<ClientRouter />` hace la transición. La
edición la fija la ruta del lado del servidor (prop `edicion` → `data-tema` en
`<html>`), no un swap en caliente.

**Regla de oro: antes de tocar cualquier cosa visual o de motion, leé
`docs/DESIGN.md`.** Ahí está la ley del proyecto: qué se hace, qué no, y por qué.
El cliente detectó patrones "de plantilla IA" en la primera iteración — ese doc
existe para que no vuelva a pasar. El tope del doc lleva un banner **CONGELADO**
(23-jul): concepto cerrado, cero re-fundaciones hasta enviar una edición terminada.

## Comandos

```bash
npm run dev        # dev server en localhost:4321
npm run build      # build a dist/
npm run qa         # harness visual: 4 ediciones × 2 temas × 2 viewports
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
  layouts/Base.astro    <html> + fuentes + anti-FOUC. La edición la fija la ruta
                        (prop `edicion` → data-tema); el anti-FOUC sólo restaura
                        ms-theme (claro/oscuro)
  components/           Secciones de página (.astro), estilos scoped
    Portada.astro       cuerpo compartido (Topbar+Hero+Tirada+Imprenta+Colofón);
                        MISMA composición para las 4 ediciones (paridad §4c.8)
    Colofon.astro       la ficha de imprenta final (compartida por las 4)
  pages/index.astro     Home = edición Afiche (<Base edicion="afiche"><Portada/>)
  pages/{terminal,plano,fanzine}.astro  Las otras ediciones: misma Portada,
                        distinto data-tema por ruta (Fanzine gated por el link)
  pages/pieza/[slug].astro  Casos de estudio (proyectos con `caso` en los datos);
                        el título morfea desde la tirada (transition:name)
  pages/especimen.astro Espécimen del sistema de diseño (referencia interna)
  scripts/              Motion en módulos:
    site.ts               entry — orquesta e importa el resto
    eases.ts              curvas del sistema (prensa/tinta/salida) — las ÚNICAS
    lenis.ts              scroll con inercia (ticker de GSAP)
    registro.ts           registro de tintas (reemplazo del preloader) +
                          pageReveal() (corre en cada page-load / navegación) +
                          scrub de drift al scroll
    tema.ts               toggle claro/oscuro (Tinta) + gating del enlace Fanzine
                          (el selector de edición navega por ruta — ver Topbar)
    halftone.ts           trama duotono canvas (el momento firma): las fotos de
                          proyectos se "imprimen" — planchas tinta/acento a
                          15°/75° que convergen a registro con el progreso
    tirada.ts             ScrollTriggers scrub de las piezas (halftone + wipes)
    imprenta.ts           clicker del taller: tirada, hojas, desbloqueo Fanzine
  styles/
    tokens.css            TODO el color vive acá (8 paletas: 4 ediciones × 2 temas)
    base.css              reset, focus, reduced-motion, .wrap
    ediciones.css         reglas globales que dependen de data-tema (.only-*, hero)
```

## Contratos que no se rompen

- **Tokens**: los componentes consumen `var(--bg|--bg2|--ink|--soft|--accent|--accent-ink|--line|--grid|--font-d|--font-b|--font-m)`. Cero color o fuente hardcodeada fuera de `tokens.css`.
- **Temas**: `data-tema` en `<html>` elige la edición y lo fija la RUTA del lado
  del servidor (prop `edicion` en Base.astro), no un swap en cliente. El
  claro/oscuro sigue a `prefers-color-scheme` y `data-theme` lo pisa en ambas
  direcciones. Ediciones: afiche · terminal · plano · fanzine (secreta).
  Cualquier componente nuevo debe verse bien en las **16 combinaciones**
  (4 ediciones × 2 temas × 2 viewports).
- **Estilos por edición**: los estilos de componentes Astro son scoped — todo
  selector que cruce `:root[data-tema=...]` con un componente va en
  `ediciones.css`, no inline ni con `:global()` disperso.
- **Motion**: GSAP timelines en `src/scripts/` (no inline en componentes).
  `prefers-reduced-motion` se respeta SIEMPRE. Ojo con `immediateRender` de los
  `fromTo` en timelines diferidas: crearlas dentro de un callback `.add(() => ...)`.
- **View transitions**: hay `<ClientRouter />` en Base.astro — los scripts se
  ejecutan UNA vez; todo init de DOM va en `astro:page-load` y la limpieza
  (ScrollTriggers, instancias halftone, tipos) en `astro:before-swap`. El
  anti-FOUC lleva `data-astro-rerun` porque el swap pisa los atributos de
  `<html>` (ahora sólo restaura `data-theme`; la edición viene de la ruta).
- **Ediciones como rutas**: el selector son `<a href>` por ruta (`/`,
  `/terminal`, `/plano`, `/fanzine`) con `aria-current` en la activa; el
  ClientRouter hace la transición. La física propia de una edición (p.ej.
  `pared.ts` = Afiche) monta SÓLO en su ruta (gate `data-tema` + presencia del
  DOM), con `init`/`clear` idempotentes y ScrollTriggers con id prefijado para
  kill selectivo. NO hay swap en caliente: `ms:edicion`, `portal.ts` y la
  cortina `#wipe` se retiraron (congelado en DESIGN.md, 23-jul). La lectura de
  "reimpresión" se logra con view transitions (`transition:persist` /
  `transition:name`, §6.6).
- **Contenido**: proyectos salen de `src/data/proyectos.ts`. Copy en español
  rioplatense (vos), sin grandilocuencia ni relleno.
- **Persistencia**: `localStorage` → `ms-theme` (claro/oscuro), `ms-tirada` +
  `ms-fanzine` (clicker); `sessionStorage` → `ms-intro`. La edición ya NO se
  persiste: la fija la ruta.

## Flujo de trabajo

1. Leer `docs/DESIGN.md` si el cambio toca UI/motion.
2. Implementar. 3. `npm run build && npm run qa` — cero overflow horizontal y
   revisar screenshots de `qa/artifacts/` en las 16 combinaciones.
4. Commit en español, cuerpo explicando el porqué. El usuario revisa cada paso:
   avanzar de a un paso por vez, no hacer todo de una.

## Docs de Astro

Documentación completa: https://docs.astro.build

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Componentes Astro](https://docs.astro.build/en/basics/astro-components/)
- [Componentes de framework (Vue)](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Estilos](https://docs.astro.build/en/guides/styling/)
- [View transitions](https://docs.astro.build/en/guides/view-transitions/)
- [i18n](https://docs.astro.build/en/guides/internationalization/)
