// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['server/generated/**', 'docs/prototipos/**'],
  rules: {
    'no-alert': 'error',
  },
})
