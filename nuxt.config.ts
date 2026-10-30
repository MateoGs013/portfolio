import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config

/** El proceso de la API (Express). En el SSR se le habla directo; el navegador usa /api del mismo origen. */
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api'
const apiOrigin = new URL(apiBase).origin

/** Origen absoluto del sitio: la única fuente para canonical, hreflang, og:url y el sitemap. */
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * CSP por entorno. Sin hash de scripts: un hash anula 'unsafe-inline' y bloquearía window.__NUXT__ y
 * el script del head. En desarrollo se suman eval y los websockets de Vite; en producción no.
 * Las fuentes son locales: no hay dominios de fuentes externas. Se arma en el hook nitro:config, que
 * sabe si es `nuxt dev` o `nuxt build` (NODE_ENV todavía no está fijado al leer este archivo).
 */
const cspFor = (isDev: boolean) => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob: ${apiOrigin}`,
  `media-src 'self' blob: ${apiOrigin}`,
  `connect-src 'self'${isDev ? ' http://localhost:* ws://localhost:* wss://localhost:*' : ''}`,
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(siteUrl.startsWith('https://') ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

/**
 * Primera visita a `/` sin reduced motion ni Hiperfoco: marca `data-intro` para que el cargador corra
 * una vez por sesión (P1 escribe `mov-visited`). Tema e Hiperfoco ya vienen del SSR por cookie.
 */
const introScript = `(function(){try{var d=document.documentElement;if(location.pathname!=='/'||location.hash||d.getAttribute('data-hyperfocus')==='true'||/[?&]foco=1(&|$)/.test(location.search)||sessionStorage.getItem('mov-visited')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.setAttribute('data-intro','')}catch(e){}})()`

/** /lab se archiva (docs/archive/lab/): la ruta y sus alias van a la home (Respuestas de Mateo). */
const labRedirects = ['lab', 'library', 'libreria', 'componentes', 'components', 'showcase']
  .flatMap(seg => [`/${seg}`, `/${seg}/**`])
  .map(path => [path, { redirect: { to: '/', statusCode: 301 } }] as const)

/** Los PDF sin -ATS eran copias: redirigen al único CV por idioma. */
const cvRedirects = ['ES', 'EN'].map(lang => [
  `/cv/CV-${lang}-Mateo-Sonzogni.pdf`,
  { redirect: { to: `/cv/CV-${lang}-Mateo-Sonzogni-ATS.pdf`, statusCode: 301 } },
] as const)

const componentDirs = ['site', 'home', 'work', 'case', 'about', 'articles', 'record', 'motion', 'media', 'cv', 'ui']

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' },
  modules: ['@nuxt/eslint'],
  vite: {
    plugins: [tailwindcss()],
  },

  // Una carpeta por área (pathPrefix false). Las que todavía no existen las crean las olas siguientes.
  components: componentDirs
    .filter(dir => existsSync(fileURLToPath(new URL(`./app/components/${dir}`, import.meta.url))))
    .map(dir => ({ path: `~/components/${dir}`, pathPrefix: false })),

  experimental: {
    viewTransition: true,
  },

  // routeRules de Nuxt (no de Nitro): también aplican en la navegación del cliente.
  routeRules: {
    ...Object.fromEntries(labRedirects),
    ...Object.fromEntries(cvRedirects),
    // public/cv/ es una carpeta: sin esta regla el servidor estático respondería /cv con /cv/.
    '/cv': { redirect: { to: '/about?cv=ats', statusCode: 301 } },
  },

  // El API es un proceso aparte (Express, `pnpm dev:api`). Nitro solo sirve el sitemap y proxía.
  // `server/` es de Express; se lo saca del alcance de Nitro para que no lo escanee ni tipee.
  serverDir: 'app/nitro',
  nitro: {
    typescript: { tsConfig: { exclude: ['../../server/**/*'] } },
    routeRules: {
      '/admin': { proxy: `${apiOrigin}/admin/` },
      '/admin/**': { proxy: `${apiOrigin}/admin/**` },
      '/api/admin/**': { proxy: `${apiOrigin}/api/admin/**` },
      '/api/**': { proxy: `${apiOrigin}/api/**` },
      // Lo subido por el admin vive en el volumen del API; lo versionado también está en public/.
      '/media/**': { proxy: `${apiOrigin}/media/**` },
    },
  },

  hooks: {
    'nitro:config'(nitroConfig) {
      nitroConfig.routeRules ??= {}
      const all = nitroConfig.routeRules['/**'] ?? {}
      nitroConfig.routeRules['/**'] = {
        ...all,
        headers: { ...all.headers, ...securityHeaders, 'Content-Security-Policy': cspFor(!!nitroConfig.dev) },
      }
    },
  },

  css: [
    '~/assets/css/fonts.css',
    '~/assets/css/base.css',
    '~/assets/css/tokens.css',
  ],

  runtimeConfig: {
    public: {
      apiBase,
      siteUrl,
    },
  },

  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      script: [{ innerHTML: introScript, tagPosition: 'head' }],
    },
  },
})
