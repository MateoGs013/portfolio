// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Solo `ignores` en el objeto: así el patrón vale para todo el lint, no para un bloque de reglas.
  // El build del admin nuevo y la demo aprobada del rediseño (referencia de look, no código).
  ignores: ['server/admin/dist/**', 'docs/rediseno-admin/**'],
}, {
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
}, {
  // El admin nuevo: archivos chicos y nada de diálogos del navegador (van por stores/dialogs.ts).
  files: ['server/admin/src/**/*.{ts,vue}'],
  rules: {
    'max-lines': ['error', { max: 300 }],
    // Los nombres de los componentes base son los del plan (Button, Field, Tabs…): viven en su propia
    // app y nunca chocan con los del sitio. Un prop opcional sin valor es undefined a propósito.
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'no-restricted-globals': ['error',
      { name: 'confirm', message: 'Usá requestConfirm de stores/dialogs.ts.' },
      { name: 'alert', message: 'Usá toast de stores/toasts.ts.' },
      { name: 'prompt', message: 'Usá un Dialog con un campo.' },
    ],
  },
})
