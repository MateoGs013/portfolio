/**
 * Precarga de la única fuente que se lee en la primera pantalla: General Sans variable, normal.
 * Martian Mono (identificadores del registro) y la itálica se cargan cuando se usan.
 */
import generalSansUrl from '~/assets/fonts/GeneralSans-Variable.woff2?url'

export function usePreloadFonts() {
  useHead({
    link: [{ rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: generalSansUrl }],
  })
}
