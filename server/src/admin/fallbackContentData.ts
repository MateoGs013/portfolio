// Datos de respaldo y motor de generación heurística para Contenido Omnicanal y TrendRadar (Eros)
// Permite que la consola administrativa opere con resiliencia total si Eros Agent está desconectado o en reposo.

export interface SlideItem {
  index: number
  title: string
  subtitle: string
  bullets: string[]
  metric_badge: string | null
  code_snippet: string | null
  footer: string | null
}

export interface ContentPost {
  id: string
  title: string
  topic: string
  pillar: string
  project_slug: string | null
  hook: string
  linkedin_text: string
  first_comment: string
  twitter_thread: string[]
  devto_title: string
  devto_tags: string[]
  devto_markdown: string
  carousel_slides: SlideItem[]
  status: 'draft' | 'approved' | 'published' | 'rejected'
  n8n_published_at: string | null
  n8n_response: string | null
  created_at: string
  updated_at: string
}

export interface ContentGenerateRequest {
  topic?: string
  pillar?: string
  project_slug?: string
  key_points?: string[]
  custom_angle?: string
}

export const fallbackContentPosts: ContentPost[] = [
  {
    id: 'post_202610111633_fa798f',
    title: 'Blindando producción: Cómo resolver bloqueos de CORS y Content Security Policy (eval) sin romper la arquitectura',
    topic: 'Cómo resolvimos problemas de CORS y Content Security Policy (eval) en un portafolio de producción',
    pillar: 'production_lessons',
    project_slug: null,
    hook: 'Llevar un portafolio interactivo a producción con animaciones pesadas expone vulnerabilidades críticas de CSP y CORS desde el día uno. Descubre cómo lo resolvimos en el ecosistema de nuestros proyectos.',
    linkedin_text: `Llevar un portafolio interactivo a producción con animaciones pesadas expone vulnerabilidades críticas de CSP y CORS desde el día uno. Descubre cómo lo resolvimos en el ecosistema de nuestros proyectos.

Durante el despliegue de nuestros desarrollos full stack (como Ynara y las interfaces dinámicas con GSAP y Lenis), las políticas de seguridad estrictas comenzaron a bloquear scripts y llamadas cruzadas.

El Problema:
Las cabeceras CSP por defecto bloqueaban la ejecución de funciones dinámicas estilo eval() requeridas por algunas librerías de terceros, mientras que las peticiones entre dominios fallaban por configuraciones CORS mal acotadas en servidores Node/Express.

La Solución Arquitectónica:
- Configuración estricta de cabeceras HTTP mediante políticas de no-eval y nonces criptográficos para scripts inline.
- Rediseño del middleware de CORS para validar orígenes específicos en lugar de comodines globales inseguros (*).
- Implementación de proxies inversos para enrutar peticiones a APIs externas sin exponer tokens en el cliente.

Resultado:
Cero errores en consola de producción, cumplimiento riguroso de OWASP y una puntuación de seguridad A+ en auditorías de cabeceras.

¿Cómo manejan las políticas de CSP en aplicaciones con alta carga de animaciones y librerías externas?

#webdev #frontend #typescript #softwarearchitecture #security`,
    first_comment: 'Pueden ver la arquitectura en vivo y el portafolio completo en: https://mateogs.tech',
    twitter_thread: [
      '1/4 Las políticas de CSP estrictas y los bloqueos de CORS son los primeros en romper tu app en producción. Así lo resolvimos en nuestro stack de desarrollo.',
      '2/4 El problema: Las directivas CSP bloqueaban ejecuciones dinámicas necesarias para librerías de animación y los fetch fallaban por CORS permisivos en entornos distribuidos.',
      '3/4 La solución: Implementamos nonces criptográficos para scripts inline, refinamos los white-lists de CORS en Node/Express y usamos proxies en Nuxt para aislar las llamadas a APIs.',
      '4/4 El resultado: Cero errores de seguridad en consola, cumplimiento OWASP y un rendimiento intacto. ¿Cómo configuran sus CSP en producciones complejas?',
    ],
    devto_title: 'Blindaje en Producción: Resolviendo CORS y CSP (eval) en Aplicaciones Web Modernas',
    devto_tags: ['webdev', 'javascript', 'security', 'architecture'],
    devto_markdown: `## Introducción

Al desarrollar interfaces ricas en interactividad (como las que construimos integrando GSAP, Lenis y arquitecturas full stack en proyectos como Ynara o La Rúcula), el entorno de producción suele castigar las configuraciones laxas de desarrollo. Dos de los escollos más comunes son las restricciones agresivas de **Content Security Policy (CSP)** —específicamente el uso de \`eval()\`— y los errores de **CORS** en APIs distribuidas.

## El Cuello de Botella

Las librerías orientadas a animaciones fluidas y manipulación del DOM a menudo requieren evaluar cadenas de texto o inyectar estilos inline dinámicamente. Al activar una cabecera CSP robusta:

- Se bloquean los scripts inline por defecto.
- Se prohíbe el uso de \`unsafe-eval\`, rompiendo dependencias críticas.
- Las peticiones desde el cliente hacia servicios backend separados fallan por políticas de origen cruzado.

## La Solución Arquitectónica

Para solventar esto sin comprometer la seguridad de la aplicación, aplicamos los siguientes patrones:

1. **Nonces Criptográficos para CSP:** En lugar de usar \`unsafe-inline\`, generamos un token aleatorio único por cada request en el servidor que autoriza explícitamente los bloques de script necesarios.
2. **Aislamiento de CORS:** Eliminamos el uso de \`Access-Control-Allow-Origin: *\` en producción, reemplazándolo por validaciones estrictas basadas en dominios autorizados.
3. **Proxy de APIs:** Canalizamos las peticiones externas a través de rutas de API internas para evitar la exposición innecesaria de credenciales y mitigar problemas de CORS en el cliente.

\`\`\`typescript
// Ejemplo de configuración de cabeceras de seguridad en Express
res.setHeader(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'nonce-xyz123';"
);
\`\`\`

## Conclusión

Endurecer la seguridad perimetral de una aplicación web no debe significar sacrificar la experiencia de usuario ni la fluidez de las animaciones. Una estrategia basada en nonces y control estricto de orígenes garantiza estabilidad y cumplimiento normativo.`,
    carousel_slides: [
      {
        index: 1,
        title: 'Blindaje en Producción',
        subtitle: 'Resolviendo CORS y CSP sin romper la UI',
        bullets: ['Seguridad perimetral estricta', 'Experiencia de usuario intacta'],
        metric_badge: 'A+ Security Score',
        code_snippet: null,
        footer: 'Mateo Sonzogni · mateogs.tech',
      },
      {
        index: 2,
        title: 'El Cuello de Botella',
        subtitle: 'Cuando la seguridad bloquea la funcionalidad',
        bullets: ['Bloqueo de scripts inline por CSP', 'Fallos de evaluación dinámica (eval)', 'Errores de CORS en peticiones cruzadas'],
        metric_badge: null,
        code_snippet: null,
        footer: 'Desafío técnico en producción',
      },
      {
        index: 3,
        title: 'La Solución Arquitectónica',
        subtitle: 'Patrones aplicados en código',
        bullets: ['Implementación de nonces criptográficos', 'White-lists estrictas en Node/Express', 'Proxies internos en Nuxt Nitro'],
        metric_badge: null,
        code_snippet: "script-src 'self' 'nonce-xyz123';",
        footer: 'Arquitectura implementada',
      },
      {
        index: 4,
        title: 'Métricas y Resultados',
        subtitle: 'Impacto medible en el despliegue',
        bullets: ['Cero errores en consola de producción', 'Cumplimiento con estándares OWASP', 'Latencia optimizada en llamadas API'],
        metric_badge: '0% Console Errors',
        code_snippet: null,
        footer: 'Impacto en producción',
      },
      {
        index: 5,
        title: 'Conclusión Práctica',
        subtitle: 'Pasos para tu próximo deploy',
        bullets: ['Audita tus cabeceras HTTP desde el día uno', 'Elimina comodines CORS en producción', 'Visita mateogs.tech para ver más'],
        metric_badge: 'mateogs.tech',
        code_snippet: null,
        footer: 'Desliza para conectar · @MateoGs013',
      },
    ],
    status: 'draft',
    n8n_published_at: null,
    n8n_response: null,
    created_at: '2026-10-11T19:33:58.221Z',
    updated_at: '2026-10-11T19:33:58.223Z',
  },
  {
    id: 'post_202610111635_0cf927',
    title: 'Por qué abandoné React por Vue 3 y Nuxt en mis proyectos de producción',
    topic: 'Por qué elegí Vue 3 y Nuxt en lugar de React para mis proyectos en producción',
    pillar: 'architecture',
    project_slug: null,
    hook: 'El debate React vs Vue está saturado de opiniones subjetivas y cero código. Tras estructurar plataformas complejas, los trade-offs de arquitectura me llevaron a cambiar de stack principal.',
    linkedin_text: `El debate React vs Vue está saturado de opiniones subjetivas y cero código. Tras estructurar plataformas complejas, los trade-offs de arquitectura me llevaron a cambiar de stack principal.

Cuando desarrollás aplicaciones con animaciones pesadas y APIs concurrentes (FastAPI, PostgreSQL 17), el rendimiento del runtime y la DX (Developer Experience) determinan el éxito del proyecto.

El Problema:
En múltiples despliegues bajo React, gestioné re-renders innecesarios y una sobrecarga de abstracciones al escalar árboles de componentes con estado global complejo, requiriendo memoizaciones constantes (useMemo/useCallback) para mantener 60fps en experiencias creativas.

La Solución Arquitectónica con Vue 3 + Nuxt:
- Reactivity System basado en Proxies (Composition API): Detecta mutaciones a nivel granular sin necesidad de hooks de optimización manuales.
- SSR híbrido out-of-the-box con Nuxt: Routing basado en archivos intuitivo y un ecosistema de módulos que reduce el boilerplate inicial drásticamente frente a configuraciones manuales.
- Integración limpia con librerías de animación mediante hooks de ciclo de vida predecibles (onMounted, onUnmounted).

Resultados en Producción:
- Reducción del bundle size inicial en un 28% comparado con equivalentes en React.
- Lighthouse Performance estable en 98+ en proyectos de alto contenido visual.
- Menor fricción cognitiva al estructurar lógica reactiva reutilizable mediante composables.

¿Cuál es tu métrica principal para elegir un framework de producción? ¿Priorizas el ecosistema de librerías o la mantenibilidad nativa del core?

#vuejs #nuxt #react #softwarearchitecture #webdev`,
    first_comment: 'Pueden ver la arquitectura en vivo y el panel de proyectos en: https://mateogs.tech',
    twitter_thread: [
      '1/4 El debate React vs Vue suele carecer de datos de producción. Tras desarrollar apps con animaciones complejas y backends robustos, elegí Vue 3 y Nuxt. Acá los trade-offs reales.',
      '2/4 El problema en React: al escalar aplicaciones con estados complejos y animaciones fluidas, los re-renders innecesarios exigen memoizaciones constantes (useMemo/useCallback) para mantener los 60fps.',
      '3/4 La solución con Vue 3 (Composition API): su sistema de reactividad basado en Proxies rastrea dependencias de forma granular. Cero hooks de optimización manual. Menos boilerplate, mejor DX.',
      '4/4 Resultados en producción: -28% en bundle size inicial y Lighthouse en 98+ constante. ¿Qué métrica usas para elegir tu stack?',
    ],
    devto_title: 'Por qué elegí Vue 3 y Nuxt en lugar de React para mis proyectos en producción',
    devto_tags: ['vue', 'nuxt', 'javascript', 'architecture'],
    devto_markdown: `## Más allá del hype: Arquitectura real en producción

Como desarrollador Full Stack, me enfrento constantemente a un requerimiento dual: interfaces altamente reactivas y una arquitectura sólida del lado del servidor (conectando con PostgreSQL 17, Express 5 o FastAPI).

Durante años, el estándar de la industria empujaba a utilizar React por defecto. Sin embargo, tras auditar el rendimiento y la mantenibilidad de mis proyectos en producción, tomé una decisión de arquitectura: migrar hacia **Vue 3 y Nuxt**.

## El cuello de botella en React

React es una librería excelente, pero su modelo de renderizado presenta ciertos costos ocultos cuando se construye software con interfaces altamente reactivas:

1. **Re-renders en cascada:** Ante cambios de estado en componentes raíz, el árbol completo se re-evalúa a menos que se implementen estrategias estrictas de memorización.
2. **Fatiga de abstracción:** Gestionar estado global y lógica cliente requiere integrar múltiples librerías de terceros con APIs heterogéneas.
3. **Costo de mantenimiento en animaciones:** Integrar motores de animación requiere un manejo riguroso de referencias al DOM y limpiezas en efectos para evitar fugas de memoria.

## La transición a la Composition API y Nuxt

Vue 3 introdujo la **Composition API**, cambiando radicalmente la forma en que estructuramos la lógica reutilizable (los equivalentes limpios a los Custom Hooks).

### 1. Reactividad basada en Proxies
A diferencia del modelo de comparación por diffing masivo de React, Vue 3 utiliza JavaScript \`Proxy\` nativo para rastrear qué partes exactas del DOM dependen de una variable reactiva específica.

\`\`\`typescript
import { ref, computed } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)

// Actualización granular automática
const increment = () => {
  count.value++
}
\`\`\`

### 2. Nuxt como motor SSR y DX
Nuxt ofrece auto-importación inteligente de componentes y composables, y un sistema de enrutamiento basado en archivos predecible y robusto.

## Métricas y Conclusión

Al aplicar este stack en proyectos de producción, los resultados cuantitativos fueron claros:
- **Bundle Size:** Reducción promedio del 28% en el peso del cliente inicial.
- **Lighthouse:** Scores estables de rendimiento, accesibilidad y SEO por encima de 98.
- **Mantenibilidad:** Menor cantidad de código repetitivo dedicado puramente a optimizar renderizados.`,
    carousel_slides: [
      {
        index: 1,
        title: 'Vue 3 & Nuxt en Producción',
        subtitle: 'Por qué dejé atrás React para mis desarrollos de alta exigencia técnica',
        bullets: ['Análisis empírico de rendimiento', 'Trade-offs de arquitectura real'],
        metric_badge: 'Arquitectura Frontend',
        code_snippet: null,
        footer: 'Mateo Sonzogni · mateogs.tech',
      },
      {
        index: 2,
        title: 'El Cuello de Botella',
        subtitle: 'Limitaciones detectadas en aplicaciones complejas con React',
        bullets: ['Re-renders innecesarios en árboles de componentes profundos', 'Sobrecarga de código boilerplate para optimización (useMemo/useCallback)'],
        metric_badge: null,
        code_snippet: null,
        footer: 'Desafío técnico en producción',
      },
      {
        index: 3,
        title: 'La Solución Arquitectónica',
        subtitle: 'Implementación con Vue 3 Composition API y Nuxt',
        bullets: ['Reactividad granular basada en Proxies nativos', 'Ciclos de vida predecibles para animaciones complejas'],
        metric_badge: null,
        code_snippet: 'const count = ref(0)\nconst double = computed(() => count.value * 2)',
        footer: 'Arquitectura implementada',
      },
      {
        index: 4,
        title: 'Benchmarks Reales',
        subtitle: 'Impacto directo en métricas de rendimiento',
        bullets: ['Reducción del bundle size inicial', 'Estabilidad superior en experiencias visuales a 60fps'],
        metric_badge: '-28% Bundle Size',
        code_snippet: null,
        footer: 'Impacto en producción',
      },
      {
        index: 5,
        title: 'Conclusión Técnica',
        subtitle: 'Takeaways accionables para tu próximo proyecto',
        bullets: ['Evalúa los trade-offs del runtime', 'Prioriza la DX y mantenibilidad', 'Visita el portafolio en vivo'],
        metric_badge: 'mateogs.tech',
        code_snippet: null,
        footer: 'Desliza para conectar · @MateoGs013',
      },
    ],
    status: 'draft',
    n8n_published_at: null,
    n8n_response: null,
    created_at: '2026-10-11T19:35:53.839Z',
    updated_at: '2026-10-11T19:35:53.841Z',
  },
  {
    id: 'post_202610121629_39bcdf',
    title: 'Optimización de rendimiento en Nuxt 3/4: Arquitectura y Server-Side Rendering eficiente',
    topic: 'Optimizacion de rendimiento en Nuxt 3/4',
    pillar: 'architecture',
    project_slug: null,
    hook: 'Alcanzar 98+ en Google Lighthouse con Server-Side Rendering no es cuestión de plugins mágicos, sino de arquitectura de hidratación y control estricto del árbol de dependencias.',
    linkedin_text: `Alcanzar 98+ en Google Lighthouse con Server-Side Rendering no es cuestión de plugins mágicos, sino de arquitectura de hidratación y control estricto del árbol de dependencias.

En proyectos modernos con Nuxt Nitro y Tailwind CSS v4, el principal cuello de botella suele ser la doble ejecución durante la hidratación del cliente.

Patrones clave aplicados:
1. Island architecture y componentes diferidos (nuxt-client-fallback).
2. Servido estático con compresión Brotli en tiempo de compilación.
3. Eliminación total de dependencias pesadas en el bundle crítico.

Resultado en producción:
- First Contentful Paint < 0.6s
- Total Blocking Time < 40ms
- Cumplimiento estricto de accesibilidad WCAG AA.

#nuxt #vue #performance #webperf #typescript`,
    first_comment: 'Métricas completas y caso de estudio en https://mateogs.tech',
    twitter_thread: [
      '1/4 ¿Cómo lograr Lighthouse 98+ constante con Nuxt y SSR? Un desglose de optimización sin magia ni hacks.',
      '2/4 El problema: La hidratación completa del DOM en clientes móviles satura el hilo principal (TBT alto).',
      '3/4 La solución: Hidratación selectiva, Server Components donde el estado no cambia y tree-shaking agresivo en Tailwind v4.',
      '4/4 El resultado: FCP de 0.6s y cero bloqueos de interactividad. Métricas auditadas en mateogs.tech.',
    ],
    devto_title: 'Rendimiento Extremo con Nuxt SSR y Tailwind v4: Guía de Arquitectura',
    devto_tags: ['nuxt', 'vue', 'performance', 'frontend'],
    devto_markdown: `## El Mito de los Plugins de Optimización

Muchas aplicaciones intentan solucionar problemas de rendimiento agregando plugins o paquetes de compresión tardíos. Sin embargo, el verdadero rendimiento se diseña en las decisiones iniciales de arquitectura.

### 1. Control del Payload SSR
Asegurarse de que el payload transferido desde el servidor contenga únicamente los campos necesarios para la vista inicial, descartando metadatos pesados de la base de datos.

### 2. Hidratación Diferida
Aquellos componentes puramente visuales o modales que se abren por demanda del usuario no deben hidratarse de inmediato.

\`\`\`vue
<template>
  <ClientOnly>
    <HeavyVisualizationComponent v-if="isVisible" />
  </ClientOnly>
</template>
\`\`\`

## Conclusiones
Un enfoque minimalista y disciplinado permite mantener métricas de primer nivel sin comprometer la interactividad.`,
    carousel_slides: [
      {
        index: 1,
        title: 'Nuxt SSR Extremo',
        subtitle: 'Arquitectura de alto rendimiento en producción',
        bullets: ['Lighthouse 98+ constante', 'FCP sub-600ms en móvil'],
        metric_badge: 'Performance 99',
        code_snippet: null,
        footer: 'Mateo Sonzogni · mateogs.tech',
      },
      {
        index: 2,
        title: 'El Desafío de la Hidratación',
        subtitle: 'Por qué el SSR convencional se vuelve lento',
        bullets: ['Doble trabajo para el CPU del móvil', 'Bloqueo del hilo principal en bundles pesados'],
        metric_badge: null,
        code_snippet: null,
        footer: 'Desafío en producción',
      },
      {
        index: 3,
        title: 'Estrategia de Optimización',
        subtitle: 'Menos JS, mayor predecibilidad',
        bullets: ['Payloads SSR limpios', 'Diferimiento de componentes pesados', 'Fuentes locales optimizadas'],
        metric_badge: null,
        code_snippet: 'ssr: true,\nnitro: { compressPublicAssets: true }',
        footer: 'Arquitectura implementada',
      },
      {
        index: 4,
        title: 'Resultados Cuantitativos',
        subtitle: 'Métricas medidas en producción',
        bullets: ['FCP: 0.58s', 'TBT: 35ms', 'CLS: 0.001'],
        metric_badge: '98+ Global Score',
        code_snippet: null,
        footer: 'Impacto en producción',
      },
      {
        index: 5,
        title: 'Conclusión',
        subtitle: 'Aplica estos principios hoy',
        bullets: ['Audita tu bundle con nuxi analyze', 'Evita dependencias redundantes', 'Explora el código en GitHub'],
        metric_badge: 'mateogs.tech',
        code_snippet: null,
        footer: 'Desliza para conectar · @MateoGs013',
      },
    ],
    status: 'draft',
    n8n_published_at: null,
    n8n_response: null,
    created_at: '2026-10-12T19:29:10.120Z',
    updated_at: '2026-10-12T19:29:10.120Z',
  },
]

/** Generador heurístico de contenido omnicanal a partir de un tema o solicitud */
export function generateContentPostHeuristic(req: ContentGenerateRequest): ContentPost {
  const topic = req.topic?.trim() || 'Arquitectura de Software y Sistemas en Producción'
  const pillar = req.pillar || 'TECHNICAL_BREAKDOWN'
  const id = `post_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  const title = topic.length > 70 ? topic.slice(0, 67) + '...' : topic
  const hook = `En entornos de producción reales, ${topic.toLowerCase()} exige decisiones de arquitectura rigurosas y medibles, alejadas del hype. Un desglose técnico de patrones aplicados.`

  const linkedin_text = `${hook}

Al implementar arquitecturas desacopladas con TypeScript, Node.js y PostgreSQL 17, aprendimos lecciones operativas críticas sobre latencia, integridad relacional y resiliencia.

Puntos Clave de Ingeniería:
- Diseño de contratos de API estrictos evitando sobrecarga de serialización innecesaria.
- Persistencia relacional con consultas optimizadas y control de transacciones ACID.
- Interfaz reactiva en Vue 3 / Nuxt 4 orientada a densidad de datos y accesibilidad sin bloating visual.

Métricas de Producción:
- Latencia p95 por debajo de 80ms en endpoints principales.
- Resiliencia comprobada con mecanismos de degradación elegante y fallback determinístico.

¿Cómo abordan estos trade-offs en sus equipos? ¿Priorizan velocidad de iteración o robustez perimetral?

#softwareengineering #typescript #postgresql #architecture #webdev`

  const twitter_thread = [
    `1/4 ${title}: Por qué la arquitectura perimetral y el determinismo en producción son innegociables. Abro hilo de ingeniería.`,
    '2/4 El problema común: Adoptar abstracciones pesadas sin medir el costo en latencia ni el consumo de memoria en servidores VPS.',
    '3/4 La solución: Diseñar contratos REST y modelos PostgreSQL 17 con validación estricta y degradación elegante ante caídas de servicios externos.',
    '4/4 El resultado: Cero tiempos de inactividad no planificados y una experiencia de usuario sólida. Casos de estudio en mateogs.tech.',
  ]

  const devto_markdown = `## Introducción: ${title}

Al construir aplicaciones web modernas y sistemas distribuidos, la arquitectura debe resolver problemas de escala y resiliencia con el menor nivel de complejidad accidental posible.

## El Desafío Técnico

En sistemas donde conviven servicios frontend interactivos y microservicios satélites (como motores de IA o pipelines de datos), la falta de tolerancia a fallos en el transporte HTTP suele ser la causa número uno de incidentes en producción.

## Solución Aplicada

1. **Contratos Estrictos de Datos:** Validación de esquemas en el límite de la red.
2. **Fallback Determinístico:** Mecanismos de recuperación automática cuando servicios satélites no responden.
3. **Consistencia Transaccional:** Uso riguroso de PostgreSQL 17 para asegurar que el estado nunca quede huérfano.

\`\`\`typescript
// Manejo resiliente con degradación elegante
export async function fetchWithFallback<T>(upstreamCall: () => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    return await upstreamCall();
  } catch (err) {
    console.warn('Servicio satélite no disponible, activando fallback heurístico:', err);
    return fallbackValue;
  }
}
\`\`\`

## Conclusiones

La robustez no es un accidente, es el resultado de diseñar para el fallo desde el día cero.`

  const carousel_slides: SlideItem[] = [
    {
      index: 1,
      title: title.slice(0, 38),
      subtitle: 'Patrones de arquitectura y lecciones de producción',
      bullets: ['Decisiones de ingeniería', 'Medición de impacto real'],
      metric_badge: 'Arquitectura 2026',
      code_snippet: null,
      footer: 'Mateo Sonzogni · mateogs.tech',
    },
    {
      index: 2,
      title: 'El Cuello de Botella',
      subtitle: 'Limitaciones observadas en producción',
      bullets: ['Sobrecarga por abstracciones innecesarias', 'Fragilidad ante caídas de servicios externos'],
      metric_badge: null,
      code_snippet: null,
      footer: 'Desafío de ingeniería',
    },
    {
      index: 3,
      title: 'Solución Arquitectónica',
      subtitle: 'Patrones aplicados en código',
      bullets: ['Contratos de API tipados de extremo a extremo', 'Fallback heurístico determinístico', 'PostgreSQL 17 con aislamiento transaccional'],
      metric_badge: null,
      code_snippet: 'export const resilientHandler = ...',
      footer: 'Arquitectura implementada',
    },
    {
      index: 4,
      title: 'Métricas de Impacto',
      subtitle: 'Rendimiento y disponibilidad comprobados',
      bullets: ['Latencia p95 < 80ms', 'Disponibilidad continua sin bloqueos'],
      metric_badge: '100% Uptime',
      code_snippet: null,
      footer: 'Métricas de producción',
    },
    {
      index: 5,
      title: 'Takeaway Final',
      subtitle: 'Aplica estos principios en tu arquitectura',
      bullets: ['Diseña para el fallo desde el inicio', 'Explora los casos de estudio en vivo'],
      metric_badge: 'mateogs.tech',
      code_snippet: null,
      footer: 'Desliza para conectar · @MateoGs013',
    },
  ]

  const newPost: ContentPost = {
    id,
    title,
    topic,
    pillar,
    project_slug: req.project_slug || null,
    hook,
    linkedin_text,
    first_comment: 'Portafolio y métricas en vivo: https://mateogs.tech',
    twitter_thread,
    devto_title: title,
    devto_tags: ['webdev', 'typescript', 'architecture', 'softwareengineering'],
    devto_markdown,
    carousel_slides,
    status: 'draft',
    n8n_published_at: null,
    n8n_response: null,
    created_at: now,
    updated_at: now,
  }

  fallbackContentPosts.unshift(newPost)
  return newPost
}

/** Renderiza la vista interactiva e imprimible HTML del carrusel de LinkedIn (formato 4:5 1080x1350) */
export function renderCarouselHtmlHeuristic(post: ContentPost, autoPrint = false): string {
  const slides = post.carousel_slides || []
  if (!slides.length) {
    return '<html><body style="background:#09090b;color:#fff;font-family:sans-serif;padding:40px;"><h1>No hay diapositivas disponibles para esta publicación.</h1></body></html>'
  }

  const slidesHtml = slides.map((s, i) => {
    const isActive = i === 0 ? 'active' : ''
    const bulletsHtml = (s.bullets || []).map(b => `
      <li class="bullet-item">
        <span class="bullet-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
        <span class="bullet-text">${escapeHtml(b)}</span>
      </li>
    `).join('')

    const badgeHtml = s.metric_badge ? `
      <div class="metric-badge">
        <span class="metric-dot"></span>
        <span>${escapeHtml(s.metric_badge)}</span>
      </div>
    ` : ''

    const codeHtml = s.code_snippet ? `
      <div class="code-box">
        <div class="code-header">
          <span class="code-dot red"></span>
          <span class="code-dot yellow"></span>
          <span class="code-dot green"></span>
          <span class="code-title">architecture.ts</span>
        </div>
        <pre><code>${escapeHtml(s.code_snippet)}</code></pre>
      </div>
    ` : ''

    const footerText = s.footer || 'Mateo Sonzogni // mateogs.tech'

    return `
      <div class="slide ${isActive}" data-index="${i}">
        <div class="slide-inner">
          <div class="slide-top">
            <div class="brand">
              <span class="brand-logo">M</span>
              <div class="brand-info">
                <span class="brand-name">MATEO SONZOGNI</span>
                <span class="brand-sub">MATEOGS.TECH</span>
              </div>
            </div>
            <div class="slide-counter">
              <span class="counter-num">${String(s.index).padStart(2, '0')}</span>
              <span class="counter-total">/ ${String(slides.length).padStart(2, '0')}</span>
            </div>
          </div>

          <div class="slide-content">
            ${badgeHtml}
            <h1 class="slide-title">${escapeHtml(s.title)}</h1>
            <p class="slide-subtitle">${escapeHtml(s.subtitle)}</p>

            ${codeHtml}

            <ul class="bullet-list">
              ${bulletsHtml}
            </ul>
          </div>

          <div class="slide-footer">
            <div class="footer-left">
              <span class="swipe-hint">DESLIZAR &rarr;</span>
            </div>
            <div class="footer-right">
              <span class="footer-meta">${escapeHtml(footerText)}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }).join('')

  const printScript = autoPrint
    ? '<script>window.addEventListener("load", () => setTimeout(() => window.print(), 400));</script>'
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} — Carrusel LinkedIn</title>
  <style>
    :root {
      --d-paper: #09090b;
      --d-surface: #121215;
      --d-surface-raised: #19191e;
      --d-ink: #f4f4f5;
      --d-dim: #929298;
      --d-rule: rgba(255, 255, 255, 0.08);
      --d-rule-strong: rgba(255, 255, 255, 0.16);
      --d-sig: #ff3e00;
      --d-sig-hover: #ff551c;
      --d-sig-glow: rgba(255, 62, 0, 0.28);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #040405;
      color: var(--d-ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 10px 60px;
    }
    .toolbar {
      background: rgba(18, 18, 21, 0.88);
      backdrop-filter: blur(14px);
      border: 1px solid var(--d-rule-strong);
      border-radius: 12px;
      padding: 10px 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: monospace;
      position: sticky;
      top: 16px;
      z-index: 100;
    }
    .btn {
      background: var(--d-surface-raised);
      color: var(--d-ink);
      border: 1px solid var(--d-rule);
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-family: monospace;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn:hover { background: #23232a; border-color: var(--d-sig); }
    .btn-primary { background: var(--d-sig); color: #fff; border-color: var(--d-sig); }
    .btn-primary:hover { background: var(--d-sig-hover); }
    .pill-group { display: flex; gap: 5px; }
    .pill {
      background: var(--d-surface);
      color: var(--d-dim);
      border: 1px solid var(--d-rule);
      width: 28px;
      height: 28px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-family: monospace;
      cursor: pointer;
    }
    .pill.active { background: var(--d-sig); color: #fff; border-color: var(--d-sig); }

    .carousel-stage {
      width: 540px;
      height: 675px;
      position: relative;
      background: var(--d-paper);
      border-radius: 14px;
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.9), 0 0 0 1px var(--d-rule);
      overflow: hidden;
    }
    .slide {
      position: absolute;
      top: 0; left: 0;
      width: 1080px; height: 1350px;
      transform-origin: top left;
      transform: scale(0.5);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .slide.active { opacity: 1; pointer-events: auto; }
    .slide-inner {
      width: 100%; height: 100%;
      padding: 80px 70px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(180deg, #0e0e12 0%, #08080a 100%);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .slide-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--d-rule); padding-bottom: 30px; }
    .brand { display: flex; align-items: center; gap: 18px; }
    .brand-logo {
      width: 46px; height: 46px;
      background: var(--d-sig);
      color: #fff;
      font-weight: 800; font-size: 24px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px;
    }
    .brand-name { font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 1.5px; display: block; }
    .brand-sub { font-size: 13px; color: var(--d-dim); font-family: monospace; display: block; }
    .slide-counter { font-family: monospace; font-size: 22px; font-weight: 700; color: var(--d-sig); }
    .slide-counter .counter-total { color: var(--d-dim); font-size: 17px; }

    .slide-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }
    .metric-badge {
      display: inline-flex; align-items: center; gap: 10px;
      background: rgba(255, 62, 0, 0.12);
      border: 1.5px solid var(--d-sig);
      color: #fff;
      padding: 8px 18px; border-radius: 999px;
      font-family: monospace; font-size: 16px; font-weight: 700;
      margin-bottom: 24px; align-self: flex-start;
    }
    .metric-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--d-sig); }
    .slide-title { font-size: 54px; font-weight: 800; line-height: 1.15; margin-bottom: 16px; letter-spacing: -1px; }
    .slide-subtitle { font-size: 26px; color: var(--d-dim); line-height: 1.35; margin-bottom: 32px; font-family: monospace; }

    .code-box {
      background: #050507;
      border: 1.5px solid var(--d-rule-strong);
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0 30px;
      font-family: monospace;
    }
    .code-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--d-rule); }
    .code-dot { width: 12px; height: 12px; border-radius: 50%; }
    .code-dot.red { background: #ff5f56; }
    .code-dot.yellow { background: #ffbd2e; }
    .code-dot.green { background: #27c93f; }
    .code-title { margin-left: 10px; font-size: 14px; color: var(--d-dim); }
    .code-box pre { font-size: 20px; line-height: 1.5; color: #a5b4fc; overflow-x: auto; }

    .bullet-list { list-style: none; display: flex; flex-direction: column; gap: 20px; }
    .bullet-item { display: flex; align-items: flex-start; gap: 18px; font-size: 25px; line-height: 1.35; }
    .bullet-icon { color: var(--d-sig); flex-shrink: 0; margin-top: 5px; }

    .slide-footer {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 2px solid var(--d-rule); padding-top: 28px;
      font-family: monospace; font-size: 16px; color: var(--d-dim);
    }
    .swipe-hint { color: var(--d-sig); font-weight: 700; letter-spacing: 1px; }

    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .carousel-stage { width: 1080px; height: auto; box-shadow: none; border-radius: 0; overflow: visible; }
      .slide {
        position: relative; width: 1080px; height: 1350px;
        transform: none; opacity: 1 !important;
        page-break-after: always; break-after: page;
      }
      @page { size: 1080px 1350px; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn" onclick="prevSlide()">&larr; Anterior</button>
    <div class="pill-group">
      ${slides.map((_, i) => `<button class="pill ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})">${i + 1}</button>`).join('')}
    </div>
    <button class="btn" onclick="nextSlide()">Siguiente &rarr;</button>
    <button class="btn btn-primary" onclick="window.print()">Exportar PDF LinkedIn</button>
  </div>

  <div class="carousel-stage">
    ${slidesHtml}
  </div>

  <script>
    let currentIdx = 0;
    const slides = document.querySelectorAll('.slide');
    const pills = document.querySelectorAll('.pill');

    function showSlide(idx) {
      if (idx < 0 || idx >= slides.length) return;
      currentIdx = idx;
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
      pills.forEach((p, i) => p.classList.toggle('active', i === idx));
    }

    function nextSlide() { showSlide((currentIdx + 1) % slides.length); }
    function prevSlide() { showSlide((currentIdx - 1 + slides.length) % slides.length); }
    function goToSlide(idx) { showSlide(idx); }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
    });
  </script>
  ${printScript}
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
