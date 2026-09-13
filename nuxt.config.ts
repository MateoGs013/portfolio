// https://nuxt.com/docs/api/configuration/nuxt-config
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api'
const apiOrigin = apiBase.replace(/\/api\/?$/, '')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],

  // El API es un proceso aparte (Express, `pnpm dev:api`). Nitro no sirve rutas propias.
  // `server/` es de Express; se lo saca del alcance de Nitro para que no lo escanee ni tipee.
  serverDir: 'app/nitro',
  nitro: {
    typescript: { tsConfig: { exclude: ['../../server/**/*'] } },
    routeRules: {
      '/admin': { proxy: `${apiOrigin}/admin/` },
      '/admin/**': { proxy: `${apiOrigin}/admin/**` },
      '/api/admin/**': { proxy: `${apiOrigin}/api/admin/**` },
    },
  },

  css: [
    '~/assets/css/fonts.css',
    '~/assets/css/base.css',
    '~/worlds/datos/tokens.css',
  ],

  runtimeConfig: {
    public: {
      apiBase, // NUXT_PUBLIC_API_BASE dinámico con fallback a localhost
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Mateo Sonzogni',
    },
  },
})
