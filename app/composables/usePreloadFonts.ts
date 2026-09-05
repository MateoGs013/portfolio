/**
 * Preload de la fuente que cada superficie usa arriba de todo.
 * Las URLs salen del pipeline de Vite (`?url`), así coinciden con las que
 * emite el CSS de @fontsource y no hay que copiar archivos a public/.
 */
import frauncesUrl from '@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2?url'
import martianUrl from '@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2?url'
import generalSansUrl from '~/assets/fonts/GeneralSans-Variable.woff2?url'
import type { World } from '~/lib/path'

const fonts: Record<World | 'umbral', string[]> = {
  datos: [martianUrl, generalSansUrl],
  diseno: [frauncesUrl, generalSansUrl],
  umbral: [generalSansUrl, frauncesUrl, martianUrl],
}

export function usePreloadFonts(surface: World | 'umbral') {
  useHead({
    link: fonts[surface].map(href => ({
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      crossorigin: '',
      href,
    })),
  })
}
