/**
 * El editor de un registro, igual para todas las colecciones:
 * - `form` es la copia que se edita y `base` lo último que dijo el servidor; `dirty` es la diferencia;
 * - guardar valida con el esquema, manda el PUT (o el POST) y la respuesta es la verdad: el formulario
 *   queda con lo que devolvió la base;
 * - el guardado lleva la clave colección+id: si mientras tanto se fue a otro registro, la respuesta no
 *   pisa al nuevo ni devuelve al usuario al que dejó (solo actualiza la lista y avisa);
 * - mientras guarda, el formulario es de solo lectura (aria-busy) y salir no pregunta;
 * - borrador en sessionStorage, errores por campo, ?campo= y Ctrl/⌘S.
 */
import { computed, getCurrentScope, onScopeDispose, provide, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, useRequestScope } from '../api/client'
import { ApiError, FieldErrors, isAbort, messageOf, RequestError, SessionError } from '../api/errors'
import { editorKey } from '../features/collections/context'
import { collections } from '../features/collections/dict'
import { readPath } from '../features/collections/paths'
import { useSection } from '../features/collections/useSection'
import { phrases } from '../models/labels'
import type { AdminRecord, Model } from '../models/types'
import { validatePayload } from '../models/validate'
import { toast } from '../stores/toasts'
import { announce } from '../ui/announce'
import { rememberRecord } from './useCollection'
import { useDirtyGuard } from './useDirtyGuard'
import { clearDraft, useDraft } from './useDraft'
import { onShortcut } from './useShortcuts'
import { useServerErrors } from './useServerErrors'

export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error'

export interface EditorOptions<TRecord extends AdminRecord, TForm extends object> {
  model: Model<TRecord, TForm>
  /** El registro de la ruta: su id, 'nueva' para uno nuevo, o null si no hay ninguno abierto. */
  id: MaybeRefOrGetter<number | 'nueva' | null>
  /** Después de cada guardado bueno (también si ya se estaba en otro registro: `current` false). */
  onAfterSave?: (record: TRecord, info: { created: boolean, current: boolean }) => void
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const toApiError = (err: unknown) => (err instanceof ApiError ? err : new ApiError(0, null, messageOf(err)))

export function useEditor<TRecord extends AdminRecord, TForm extends object>(options: EditorOptions<TRecord, TForm>) {
  const { model } = options
  const say = phrases(model.noun)
  const route = useRoute()
  const router = useRouter()
  const scope = useRequestScope()
  const section = useSection(model)

  const record = shallowRef<TRecord | null>(null)
  const form = ref(model.blank()) as Ref<TForm>
  const base = ref(JSON.stringify(form.value))
  /** La clave del registro que está en el formulario (la de la ruta puede ir adelante mientras carga). */
  const loadedKey = ref<string | null>(null)
  const loading = ref(false)
  const loadError = shallowRef<ApiError | null>(null)
  const savingKey = ref<string | null>(null)
  const outcome = ref<'idle' | 'saved' | 'error'>('idle')
  const savedAt = ref<Date | null>(null)
  /** Lo que devolvió el POST: al pasar a la ruta del registro creado no se vuelve a pedir. */
  let adopted: TRecord | null = null

  const routeId = computed(() => toValue(options.id))
  const key = computed(() => (routeId.value === null ? null : `${model.key}:${routeId.value}`))
  const isNew = computed(() => routeId.value === 'nueva')
  const ready = computed(() => key.value !== null && loadedKey.value === key.value && !loading.value && !loadError.value)
  const dirty = computed(() => ready.value && JSON.stringify(form.value) !== base.value)
  const busy = computed(() => savingKey.value !== null && savingKey.value === key.value)
  const status = computed<SaveStatus>(() => {
    if (busy.value) return 'saving'
    if (outcome.value === 'error') return 'error'
    if (dirty.value) return 'dirty'
    return outcome.value === 'saved' ? 'saved' : 'clean'
  })

  const errors = useServerErrors(model, form, id => section.go(id))
  const draft = useDraft({ key: loadedKey, form, dirty, paused: busy })

  /** Las secciones con algo distinto de lo guardado, para la marca de su pestaña. */
  const changedSections = computed(() => {
    if (!dirty.value) return new Set<string>()
    const saved: unknown = JSON.parse(base.value)
    const differs = (path: string) => JSON.stringify(readPath(form.value, path) ?? null) !== JSON.stringify(readPath(saved, path) ?? null)
    return new Set(model.sections.filter(s => s.fields.some(differs)).map(s => s.id))
  })

  function reset(next: TForm, rec: TRecord | null, forKey: string): void {
    record.value = rec
    form.value = clone(next)
    base.value = JSON.stringify(form.value)
    loadedKey.value = forKey
  }

  /**
   * Pone en el formulario un registro que llegó del servidor. Rechaza lo que no es de este editor:
   * otra clave (se cambió de registro) u otro id.
   */
  function applySaved(rec: TRecord, forKey: string | null = key.value): boolean {
    if (!forKey || forKey !== key.value) return false
    if (!isNew.value && rec.id !== routeId.value) return false
    reset(model.toForm(rec), rec, forKey)
    return true
  }

  /** Solo algunos campos cambiaron en el servidor (la dirección): el resto de lo escrito se conserva. */
  function applyPatch(rec: TRecord, fields: readonly (keyof TForm & string)[]): void {
    if (rec.id !== routeId.value) return
    const next = model.toForm(rec)
    const saved = JSON.parse(base.value) as TForm
    for (const name of fields) {
      form.value[name] = clone(next[name])
      saved[name] = clone(next[name])
    }
    record.value = rec
    base.value = JSON.stringify(saved)
    rememberRecord(model.path, rec)
  }

  async function load(): Promise<void> {
    const id = routeId.value
    const forKey = key.value
    errors.clear()
    outcome.value = 'idle'
    savedAt.value = null
    loadError.value = null
    if (id === null || forKey === null) return
    const signal = scope.renew()
    const found = adopted
    adopted = null
    if (id === 'nueva' || (found && found.id === id)) {
      reset(found ? model.toForm(found) : model.blank(), found, forKey)
      if (found) outcome.value = 'saved'
      if (found) savedAt.value = new Date()
      else draft.check(form.value)
      return
    }
    loading.value = true
    try {
      const rec = model.detail === false
        ? (await api.get<TRecord[]>(model.path, { signal })).find(r => r.id === id)
        : await api.get<TRecord>(`${model.path}/${id}`, { signal })
      if (!rec) throw new RequestError(404, 'not_found', say.missing)
      if (key.value !== forKey) return
      reset(model.toForm(rec), rec, forKey)
      draft.check(form.value)
    }
    catch (err) {
      if (!isAbort(err) && key.value === forKey) loadError.value = toApiError(err)
    }
    finally {
      if (key.value === forKey) loading.value = false
    }
  }

  /** Dejar un registro con cambios sin estar guardándolo es haber elegido «Salir sin guardar». */
  function forgetLeft(): void {
    const left = loadedKey.value
    if (left && JSON.stringify(form.value) !== base.value && savingKey.value !== left) clearDraft(left)
  }

  watch(key, (next, previous) => {
    if (previous !== undefined) forgetLeft()
    if (next !== previous) void load()
  }, { immediate: true })
  if (getCurrentScope()) onScopeDispose(forgetLeft)

  async function save(): Promise<void> {
    if (!ready.value || busy.value) return
    if (!dirty.value && !isNew.value) {
      announce(collections.save.nothing)
      return
    }
    const forKey = key.value!
    const rec = record.value
    const creating = rec === null
    const payload = model.toPayload(form.value, rec)
    const found = [...validatePayload(model.schema, payload, { creating }), ...(model.validate?.(form.value, rec) ?? [])]
    if (found.length) {
      outcome.value = 'error'
      await errors.show(found)
      return
    }
    errors.clear()
    draft.flush()
    savingKey.value = forKey
    try {
      const saved = creating
        ? await api.post<TRecord>(model.path, payload)
        : await api.put<TRecord>(`${model.path}/${rec.id}`, payload)
      rememberRecord(model.path, saved)
      clearDraft(forKey)
      const current = key.value === forKey
      toast(creating ? say.created : say.saved)
      if (current) {
        applySaved(saved, forKey)
        outcome.value = 'saved'
        savedAt.value = new Date()
      }
      if (creating && current) {
        adopted = saved
        await router.replace(model.routes.record(saved.id))
      }
      options.onAfterSave?.(saved, { created: creating, current })
    }
    catch (err) {
      if (isAbort(err)) return
      const current = key.value === forKey
      if (current) outcome.value = 'error'
      // La sesión vencida la atiende la reautenticación; si se canceló, el pie dice que no se guardó.
      if (err instanceof SessionError) return
      if (err instanceof FieldErrors && current) await errors.show(err.issues)
      else toast(`${say.saveFailed}. ${messageOf(err)}`, { tone: 'error' })
    }
    finally {
      if (savingKey.value === forKey) savingKey.value = null
    }
  }

  function discard(): void {
    if (!ready.value || busy.value) return
    form.value = JSON.parse(base.value) as TForm
    errors.clear()
    draft.clear()
    outcome.value = 'idle'
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

  // ?campo=<ruta>: abre la sección del campo y le lleva el foco, una vez por registro y valor.
  let lastCampo = ''
  watch([() => route.query['campo'], ready], ([campo, isReady]) => {
    const path = typeof campo === 'string' ? campo : ''
    const mark = `${key.value}|${path}`
    if (!path) lastCampo = ''
    if (!path || !isReady || mark === lastCampo) return
    lastCampo = mark
    void errors.focusField(path)
  }, { immediate: true })

  onShortcut('save', () => void save())
  useDirtyGuard({
    dirty,
    saving: busy,
    keeps: to => to.name === route.name && String(to.params['id'] ?? '') === String(route.params['id'] ?? ''),
  })
  provide(editorKey, { busy, isNew, messageFor: errors.messageFor })

  return {
    model,
    record,
    form,
    key,
    isNew,
    loading,
    loadError,
    ready,
    dirty,
    busy,
    status,
    savedAt,
    errors,
    section,
    changedSections,
    draftOffer: draft.offer,
    load,
    save,
    discard,
    applySaved,
    applyPatch,
    recoverDraft,
    dismissDraft,
  }
}

/** Un editor cualquiera, sin lo que depende del tipo del registro: lo que usa EditorFrame. */
export type EditorView = Omit<ReturnType<typeof useEditor<AdminRecord, object>>, 'applySaved' | 'applyPatch'>
