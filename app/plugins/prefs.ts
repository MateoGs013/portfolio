/**
 * Estado de lectura en `<html>`, resuelto por el SSR antes del primer pintado (docs/diseno.md §4):
 * `lang` (de `?lang=en`), `data-theme` (cookie pf-theme), `data-hyperfocus` (cookie pf-hyperfocus o
 * `?foco=1`) y `data-vista` (de `?vista=registro`). Se inicializa una sola vez para toda la app.
 */
import { langFrom } from '~/composables/useLocale'
import { isRecordQuery, RECORD_VALUE } from '~/composables/useRecordView'
import { HYPERFOCUS_COOKIE } from '~/composables/useHyperfocus'
import { isTheme, THEME_COOKIE, themeColor } from '~/composables/useTheme'

/** Claves del sitio anterior, que guardaba las preferencias en localStorage. */
const LEGACY_THEME = 'portfolio-theme'
const LEGACY_HYPERFOCUS = 'portfolio-hyperfocus'

/** Copia una sola vez lo que el sitio anterior guardó en localStorage, si todavía no hay cookie. */
function migrateLegacyPrefs(theme: ReturnType<typeof useTheme>, focus: ReturnType<typeof useHyperfocus>) {
  try {
    const cookies = document.cookie
    const storedTheme = localStorage.getItem(LEGACY_THEME)
    if (!cookies.includes(`${THEME_COOKIE}=`) && isTheme(storedTheme)) theme.setTheme(storedTheme)
    if (!cookies.includes(`${HYPERFOCUS_COOKIE}=`) && localStorage.getItem(LEGACY_HYPERFOCUS) === 'true') focus.setHyperfocus(true)
    localStorage.removeItem(LEGACY_THEME)
    localStorage.removeItem(LEGACY_HYPERFOCUS)
  }
  catch {
    // Sin acceso a localStorage (modo privado estricto): las preferencias quedan por defecto.
  }
}

export default defineNuxtPlugin({
  name: 'prefs',
  setup(nuxtApp) {
    const router = useRouter()
    const theme = useTheme()
    const focus = useHyperfocus()

    // ?foco=1 es la entrada compartible: el SSR ya pinta en Hiperfoco y deja la cookie escrita.
    if (import.meta.server && useRequestURL().searchParams.get('foco') === '1') focus.setHyperfocus(true)

    if (import.meta.client) {
      nuxtApp.hook('app:suspense:resolve', () => {
        migrateLegacyPrefs(theme, focus)
        // Sacar `foco` de la URL: recargar o copiar el enlace después de salir no lo vuelve a encender.
        const { foco, ...rest } = router.currentRoute.value.query
        if (foco !== undefined) router.replace({ ...router.currentRoute.value, query: rest })
      })
    }

    const query = computed(() => router.currentRoute.value.query)
    useHead({
      htmlAttrs: {
        'lang': computed(() => langFrom(query.value)),
        'data-theme': theme.theme,
        'data-hyperfocus': computed(() => (focus.isHyperfocus.value ? 'true' : undefined)),
        'data-vista': computed(() => (isRecordQuery(query.value) ? RECORD_VALUE : undefined)),
      },
      meta: [{ name: 'theme-color', content: computed(() => themeColor[theme.theme.value]) }],
    })
  },
})
