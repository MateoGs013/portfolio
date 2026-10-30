/**
 * Hiperfoco: la capa de presentación para leer sin ruido (docs/diseno.md §5). El estado vive en la
 * cookie `pf-hyperfocus`, que lee el SSR para pintar `data-hyperfocus` antes del primer cuadro; no
 * hay localStorage ni lecturas en onMounted por consumidor. `?foco=1` entra desde un enlace (prefs.ts).
 */
export const HYPERFOCUS_COOKIE = 'pf-hyperfocus'

const YEAR = 60 * 60 * 24 * 365

/** La cookie viaja tal cual (pf-hyperfocus=true), sin el JSON que useCookie pone por defecto. */
const plain = (value: string | null) => value ?? ''

export function useHyperfocus() {
  const cookie = useCookie<string | null>(HYPERFOCUS_COOKIE, { maxAge: YEAR, sameSite: 'lax', path: '/', encode: plain, decode: plain })
  const state = useState<boolean>(HYPERFOCUS_COOKIE, () => cookie.value === 'true')

  /** Entrar escribe la cookie; salir la borra, así un enlace viejo no lo vuelve a encender. */
  function setHyperfocus(on: boolean) {
    state.value = on
    cookie.value = on ? 'true' : null
  }

  const toggleHyperfocus = () => setHyperfocus(!state.value)

  return { isHyperfocus: readonly(state), setHyperfocus, toggleHyperfocus }
}
