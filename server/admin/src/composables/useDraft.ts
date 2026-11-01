/**
 * Borrador de lo escrito y no guardado, en sessionStorage, por registro (`adm-draft:orgs:12`): se
 * escribe 500 ms después de la última tecla mientras hay cambios (y al irse de la página, para que una
 * recarga inmediata no pierda lo último) y se borra al guardar o al descartar.
 * Si la pestaña se recarga o la sesión vence y se vuelve a entrar, el editor ofrece «Recuperar
 * cambios del 05/11 14:02». Mientras la oferta está a la vista no se pisa el borrador guardado.
 * Sin sessionStorage (modo privado estricto) no hay borrador y el editor funciona igual.
 */
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

const PREFIX = 'adm-draft:'
const DEBOUNCE_MS = 500

interface StoredDraft<TForm> {
  savedAt: number
  form: TForm
}

export interface DraftOffer {
  savedAt: Date
}

function read<TForm>(key: string): StoredDraft<TForm> | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDraft<TForm>
    return typeof parsed?.savedAt === 'number' && parsed.form && typeof parsed.form === 'object' ? parsed : null
  }
  catch {
    return null
  }
}

function write(key: string, form: unknown): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), form }))
  }
  catch {
    // Lleno o bloqueado: el borrador es una ayuda, no algo que tenga que estar.
  }
}

/** Borra el borrador de `key` (guardado o descartado), aunque el editor ya no esté a la vista. */
export function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key)
  }
  catch {
    // Sin almacenamiento no había borrador.
  }
}

export interface DraftOptions<TForm> {
  /** La clave del registro (`orgs:12`, `orgs:nueva`); null mientras no hay registro cargado. */
  key: MaybeRefOrGetter<string | null>
  form: Ref<TForm>
  /** Lo que se guardaría: si no hay cambios, el borrador se borra. */
  dirty: MaybeRefOrGetter<boolean>
  /** Mientras se guarda no se escribe: el formulario no cambia y el borrador se borra al terminar. */
  paused?: MaybeRefOrGetter<boolean>
}

export function useDraft<TForm>(options: DraftOptions<TForm>) {
  const offer = shallowRef<(DraftOffer & { key: string, form: TForm }) | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Mira si hay un borrador para el registro recién cargado que difiera de lo que se ve. */
  function check(current: unknown): void {
    const key = toValue(options.key)
    offer.value = null
    if (!key) return
    const stored = read<TForm>(key)
    if (!stored) return
    if (JSON.stringify(stored.form) === JSON.stringify(current)) {
      clearDraft(key)
      return
    }
    offer.value = { key, form: stored.form, savedAt: new Date(stored.savedAt) }
  }

  /** Devuelve el formulario guardado en el borrador (para ponerlo en pantalla) y cierra la oferta. */
  function take(): TForm | null {
    const found = offer.value
    offer.value = null
    return found ? found.form : null
  }

  function dismiss(): void {
    const found = offer.value
    offer.value = null
    if (found) clearDraft(found.key)
  }

  function flush(): void {
    clearTimeout(timer)
    timer = undefined
    const key = toValue(options.key)
    if (!key || offer.value || toValue(options.paused)) return
    if (toValue(options.dirty)) write(key, options.form.value)
    else clearDraft(key)
  }

  watch([options.form, () => toValue(options.dirty)], () => {
    clearTimeout(timer)
    timer = setTimeout(flush, DEBOUNCE_MS)
  }, { deep: true })

  // Recargar o cerrar antes de los 500 ms: pagehide llega después de que el usuario aceptó irse.
  const onPageHide = () => {
    if (timer !== undefined) flush()
  }
  if (typeof window !== 'undefined') window.addEventListener('pagehide', onPageHide)

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearTimeout(timer)
      if (typeof window !== 'undefined') window.removeEventListener('pagehide', onPageHide)
    })
  }

  return {
    offer: computed<DraftOffer | null>(() => (offer.value ? { savedAt: offer.value.savedAt } : null)),
    check,
    take,
    dismiss,
    flush,
    clear: () => {
      clearTimeout(timer)
      const key = toValue(options.key)
      if (key) clearDraft(key)
    },
  }
}
