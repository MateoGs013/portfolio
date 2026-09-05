// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],

  // El API es un proceso aparte (Express, `pnpm dev:api`). Nitro no sirve rutas propias.
  // `server/` es de Express; se lo saca del alcance de Nitro para que no lo escanee ni tipee.
  serverDir: 'app/nitro',
  nitro: { typescript: { tsConfig: { exclude: ['../../server/**/*'] } } },

  css: ['~/assets/css/fonts.css', '~/assets/css/base.css'],

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3001/api', // NUXT_PUBLIC_API_BASE
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Mateo Sonzogni',
    },
  },
})
