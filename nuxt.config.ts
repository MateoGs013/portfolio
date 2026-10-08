import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api'
const apiOrigin = apiBase.replace(/\/api\/?$/, '')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  vite: {
    plugins: [tailwindcss()],
  },

  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/cv', pathPrefix: false },
    { path: '~/components/explorer', pathPrefix: false },
  ],

  // El API es un proceso aparte (Express, `pnpm dev:api`). Nitro no sirve rutas propias.
  // `server/` es de Express; se lo saca del alcance de Nitro para que no lo escanee ni tipee.
  serverDir: 'app/nitro',
  nitro: {
    typescript: { tsConfig: { exclude: ['../../server/**/*'] } },
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        },
      },
      '/admin': { proxy: `${apiOrigin}/admin/` },
      '/admin/**': { proxy: `${apiOrigin}/admin/**` },
      '/api/admin/**': { proxy: `${apiOrigin}/api/admin/**` },
      '/api/**': { proxy: `${apiOrigin}/api/**` },
    },
  },

  css: [
    '~/assets/css/fonts.css',
    '~/assets/css/base.css',
    '~/assets/css/tokens.css',
  ],

  runtimeConfig: {
    public: {
      apiBase, // NUXT_PUBLIC_API_BASE dinámico con fallback a localhost
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Mateo Sonzogni · Software Engineer & Creative Developer',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
        { name: 'description', content: 'Portafolio técnico de Mateo Gabriel Sonzogni: Desarrollador Full Stack y Creative Developer. Arquitecturas relacionales sobre PostgreSQL 17, APIs tipadas en TypeScript y Python, e interfaces reactivas contemporáneas.' },
        { name: 'author', content: 'Mateo Gabriel Sonzogni' },
        { property: 'og:site_name', content: 'Mateo Sonzogni · Portfolio' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://mateogs.tech' },
        { property: 'og:title', content: 'Mateo Sonzogni · Software Engineer & Creative Developer' },
        { property: 'og:description', content: 'Portafolio técnico y explorador de datos relacional sobre PostgreSQL 17. Proyectos reales en producción, métricas de rendimiento y CV en 1 página A4.' },
        { property: 'og:image', content: 'https://mateogs.tech/media/profile/mateo-front.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Mateo Sonzogni · Software Engineer & Creative Developer' },
        { name: 'twitter:description', content: 'Portafolio técnico y explorador de datos relacional sobre PostgreSQL 17. Proyectos reales en producción y CV en 1 página A4.' },
        { name: 'twitter:image', content: 'https://mateogs.tech/media/profile/mateo-front.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'canonical', href: 'https://mateogs.tech' },
      ],
    },
  },
})
