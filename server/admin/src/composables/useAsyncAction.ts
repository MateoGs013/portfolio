/**
 * Una acción asíncrona con su estado: `pending` para el botón (no se dispara dos veces), `error` para
 * mostrarlo en el lugar y, si se pide, un aviso al terminar. Un 401 no avisa: lo atiende la sesión.
 * Lo abortado (la vista se cerró) no es un error.
 */
import { ref, shallowRef } from 'vue'
import { ApiError, FieldErrors, isAbort, messageOf, SessionError } from '../api/errors'
import { toast } from '../stores/toasts'

export interface AsyncActionOptions<R> {
  /** Aviso al salir bien: texto completo por modelo («Experiencia guardada»). */
  success?: string | ((result: R) => string)
  /** Aviso de error al pie. Apagalo si el error se muestra en el lugar (campos, ErrorState). */
  errorToast?: boolean
}

export function useAsyncAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, options: AsyncActionOptions<R> = {}) {
  const pending = ref(false)
  const error = shallowRef<ApiError | null>(null)
  const message = ref('')

  async function run(...args: A): Promise<R | undefined> {
    if (pending.value) return undefined
    pending.value = true
    error.value = null
    message.value = ''
    try {
      const result = await fn(...args)
      const success = typeof options.success === 'function' ? options.success(result) : options.success
      if (success) toast(success)
      return result
    }
    catch (err) {
      if (isAbort(err)) return undefined
      error.value = err instanceof ApiError ? err : new ApiError(0, null, messageOf(err))
      message.value = error.value.message
      const quiet = err instanceof SessionError || (err instanceof FieldErrors && options.errorToast === undefined)
      if (options.errorToast !== false && !quiet) toast(message.value, { tone: 'error' })
      return undefined
    }
    finally {
      pending.value = false
    }
  }

  return { run, pending, error, message }
}
