/**
 * Preload de las fuentes del Portafolio Técnico Mateo Sonzogni (Mundo DATOS).
 * Martian Mono Variable (Mono) + General Sans Variable (Sans).
 */
import martianUrl from '@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2?url'
import generalSansUrl from '~/assets/fonts/GeneralSans-Variable.woff2?url'
import type { World } from '~/lib/path'

const fonts = [martianUrl, generalSansUrl]

export function usePreloadFonts(_surface?: World | 'umbral') {
  useHead({
    link: fonts.map(href => ({
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      crossorigin: '',
      href,
    })),
  })
}
