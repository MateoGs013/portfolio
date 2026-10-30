// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: [
    'server/generated/**',
    'docs/archive/**',
    'tests/screenshots/**',
    'playwright-report/**',
    'test-results/**',
  ],
  rules: {
    'no-alert': 'error',
  },
}, {
  // El cromo del sitio se controla con un grep de '@' (ningún email escrito a mano en el pie):
  // ahí los eventos van con v-on: en lugar de la forma corta.
  files: ['app/components/site/**/*.vue'],
  rules: {
    'vue/v-on-style': ['warn', 'longform'],
  },
})
