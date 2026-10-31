/**
 * Precarga de lo que se lee en la primera pantalla: General Sans variable, normal, y desde md el corte
 * latino de Martian Mono, que pinta el atajo de la paleta en la cabecera (`kbd`, oculto en angosto).
 * Si Martian Mono llegara después del primer pintado, el cambio de fuente correría la navegación de la
 * cabecera (CLS). El resto de sus cortes y la itálica se cargan cuando se usan.
 */
import martianMonoUrl from '@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2?url'
import generalSansUrl from '~/assets/fonts/GeneralSans-Variable.woff2?url'

export function usePreloadFonts() {
  useHead({
    link: [
      { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: generalSansUrl },
      { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: martianMonoUrl, media: '(min-width: 48rem)' },
    ],
  })
}
