/**
 * Tema claro u oscuro (oscuro por defecto), recordado en la cookie `pf-theme` para que el SSR pinte
 * `data-theme` sin parpadeo. `<html data-theme>` y `theme-color` los pone prefs.ts.
 */
export type Theme = 'dark' | 'light'

export const THEME_COOKIE = 'pf-theme'

/** Fondo de cada tema (`--bg` de docs/diseno.md §3) para la barra del navegador. */
export const themeColor: Record<Theme, string> = { dark: '#0b0b0c', light: '#f1f2f2' }

const YEAR = 60 * 60 * 24 * 365

/** La cookie viaja tal cual (pf-theme=light), sin el JSON que useCookie pone por defecto. */
const plain = (value: string | null) => value ?? ''

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

export function useTheme() {
  const cookie = useCookie<string | null>(THEME_COOKIE, { maxAge: YEAR, sameSite: 'lax', path: '/', encode: plain, decode: plain })
  const theme = useState<Theme>(THEME_COOKIE, () => (isTheme(cookie.value) ? cookie.value : 'dark'))

  function setTheme(next: Theme) {
    theme.value = next
    cookie.value = next
  }

  const toggleTheme = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')

  return { theme: readonly(theme), setTheme, toggleTheme }
}
