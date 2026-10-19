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
})
