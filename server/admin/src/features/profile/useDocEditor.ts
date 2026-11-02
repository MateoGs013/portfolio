/**
 * El editor de un documento de Perfil (about o contact). Los documentos no tienen id ni lista, así que
 * no pasan por useEditor; esto arma lo mismo con sus piezas:
 * - `form` es la copia que se edita y `base` lo último que dijo el servidor; la respuesta del PUT es la
 *   verdad y el formulario queda con ella;
 * - mientras guarda, el formulario es de solo lectura (aria-busy) y salir no pregunta;
 * - borrador en sessionStorage (`adm-draft:perfil:about`), errores por campo, ?campo= y Ctrl/⌘S;
 * - el retrato sube aparte (POST /docs/about/portrait): `adopt` pone el documento que devolvió sin
 *   tocar lo que se está escribiendo.
 */
import type { AdminDoc } from '@shared/adminContracts'
import type { DocKey } from '@shared/docSchema'
import { computed, getCurrentScope, onScopeDispose, provide, ref, shallowRef, type Ref } from 'vue'
import { api, useRequestScope } from '../../api/client'
import { ApiError, FieldErrors, isAbort, messageOf, SessionError } from '../../api/errors'
import type { SaveStatus } from '../../composables/useEditor'
import { useCampoFocus } from '../../composables/useEditorParts'
import { useDirtyGuard } from '../../composables/useDirtyGuard'
import { clearDraft, useDraft } from '../../composables/useDraft'
import { onShortcut } from '../../composables/useShortcuts'
import { toast } from '../../stores/toasts'
import { announce } from '../../ui/announce'
import { editorKey } from '../collections/context'
import { collections } from '../collections/dict'
import { DOC_ROUTES, profile } from './dict'
import { toForm, toPayload, type BlockForm, type DocForm, type FreeForm } from './model'
import { useDocErrors } from './useDocErrors'
import { validateDoc } from './validate'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function useDocEditor(key: DocKey) {
  const t = profile.docs[key]
  const path = `/docs/${key}`
  const draftKey = `perfil:${key}`
  const scope = useRequestScope()

  const record = shallowRef<AdminDoc | null>(null)
  const form = ref<DocForm>({ fields: {}, free: [] }) as Ref<DocForm>
  const base = ref(JSON.stringify(form.value))
  const loading = ref(true)
  const loadError = shallowRef<ApiError | null>(null)
  const busy = ref(false)
  const outcome = ref<'idle' | 'saved' | 'error'>('idle')
  const savedAt = ref<Date | null>(null)
  let disposed = false

  const ready = computed(() => record.value !== null && !loading.value && !loadError.value)
  const dirty = computed(() => ready.value && JSON.stringify(form.value) !== base.value)
  const status = computed<SaveStatus>(() => {
    if (busy.value) return 'saving'
    if (outcome.value === 'error') return 'error'
    if (dirty.value) return 'dirty'
    return outcome.value === 'saved' ? 'saved' : 'clean'
  })

  const errors = useDocErrors(form, record)
  const draft = useDraft({ key: () => (ready.value ? draftKey : null), form, dirty, paused: busy })

  function reset(doc: AdminDoc): void {
    record.value = doc
    form.value = toForm(doc)
    base.value = JSON.stringify(form.value)
  }

  async function load(): Promise<void> {
    const signal = scope.renew()
    loading.value = true
    loadError.value = null
    errors.clear()
    try {
      reset(await api.get<AdminDoc>(path, { signal }))
      loading.value = false
      draft.check(form.value)
    }
    catch (err) {
      if (isAbort(err)) return
      loadError.value = err instanceof ApiError ? err : new ApiError(0, null, messageOf(err))
      loading.value = false
    }
  }

  async function save(): Promise<void> {
    const doc = record.value
    if (!ready.value || busy.value || !doc) return
    if (!dirty.value) {
      announce(collections.save.nothing)
      return
    }
    const found = validateDoc(form.value, doc)
    if (found.length) {
      outcome.value = 'error'
      await errors.show(found)
      return
    }
    errors.clear()
    draft.flush()
    busy.value = true
    try {
      const saved = await api.put<AdminDoc>(path, toPayload(form.value, doc))
      clearDraft(draftKey)
      toast(t.saved)
      if (disposed) return
      reset(saved)
      outcome.value = 'saved'
      savedAt.value = new Date()
    }
    catch (err) {
      if (isAbort(err)) return
      outcome.value = 'error'
      // La sesión vencida la atiende la reautenticación; lo escrito queda en el borrador.
      if (err instanceof SessionError) return
      if (err instanceof FieldErrors && !disposed) await errors.show(err.issues)
      else toast(`${profile.saveFailed(t.title)}. ${messageOf(err)}`, { tone: 'error' })
    }
    finally {
      busy.value = false
    }
  }

  function discard(): void {
    if (!ready.value || busy.value) return
    form.value = JSON.parse(base.value) as DocForm
    errors.clear()
    draft.clear()
    outcome.value = 'idle'
  }

  /** Lo que escribe cada campo: el formulario es de este editor y los componentes no lo mutan. */
  function setBlock(name: string, value: BlockForm): void {
    form.value.fields[name] = value
  }

  function setFree(free: FreeForm[]): void {
    form.value.free = free
  }

  /** El documento cambió en el servidor por otro camino (el retrato): lo escrito se conserva. */
  function adopt(doc: AdminDoc): void {
    record.value = doc
  }

  function recoverDraft(): void {
    const stored = draft.take()
    if (!stored) return
    form.value = clone(stored)
    toast(collections.draft.recovered, { tone: 'info' })
  }

  function dismissDraft(): void {
    draft.dismiss()
    announce(collections.draft.dismissed)
  }

  void load()
  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      // Salir con cambios sin estar guardando es haber elegido «Salir sin guardar».
      if (dirty.value && !busy.value) clearDraft(draftKey)
    })
  }

  useCampoFocus(computed(() => draftKey), ready, errors.focusField)
  onShortcut('save', () => void save())
  useDirtyGuard({
    dirty,
    saving: busy,
    keeps: to => to.name === 'perfil' && DOC_ROUTES[String(to.params['doc']) as keyof typeof DOC_ROUTES] === key,
  })
  provide(editorKey, { busy: computed(() => busy.value), isNew: computed(() => false), messageFor: errors.messageFor })

  return {
    key,
    record,
    form,
    loading,
    loadError,
    ready,
    dirty,
    busy,
    status,
    savedAt,
    errors,
    draftOffer: draft.offer,
    load,
    save,
    discard,
    adopt,
    setBlock,
    setFree,
    recoverDraft,
    dismissDraft,
  }
}

export type DocEditor = ReturnType<typeof useDocEditor>
