/**
 * Los pedidos de artículos a Eros (/articles/generate y /articles/runs), una sola copia para la lista
 * de Artículos, el diálogo «Pedir un artículo a Eros» y Tendencias. El pedido que se hace desde esta
 * pestaña se sigue cada 3 s hasta que Eros lo publica o falla, aunque se cierre el diálogo o se cambie
 * de pantalla: al terminar, un aviso lo dice (con «Abrir» si nadie lo está mirando).
 */
import type { ArticleGenerateRequest, ArticleRunList, ArticleRunReply, ArticleRunView } from '@shared/articleRunContracts'
import { computed, ref, shallowRef } from 'vue'
import { api } from '../../api/client'
import { router } from '../../router'
import { toast } from '../../stores/toasts'
import { asked } from './dict'

const POLL_MS = 3000
/** Sin respuesta tantas veces seguidas, se deja de mirar (el pedido sigue en el servidor). */
const MAX_MISSES = 5

export const runsApi = {
  list: (limit = 10) => api.get<ArticleRunList>('/articles/runs', { query: { limit } }),
  one: (id: number) => api.get<ArticleRunReply>(`/articles/runs/${id}`),
  generate: (request: ArticleGenerateRequest) => api.post<ArticleRunReply>('/articles/generate', request),
}

const list = shallowRef<ArticleRunList | null>(null)
const listFailed = ref(false)

/** Los últimos pedidos, el próximo lunes y si el horario está encendido; null hasta la primera lectura. */
export const runs = computed(() => list.value)
export const runsFailed = computed(() => listFailed.value)

export async function loadRuns(limit = 20): Promise<void> {
  try {
    list.value = await runsApi.list(limit)
    listFailed.value = false
  }
  catch {
    listFailed.value = true
  }
}

/** El pedido que se sigue desde esta pestaña (el último que se hizo acá). */
export const tracked = shallowRef<ArticleRunView | null>(null)
/** Alguien está mirando el pedido (el diálogo abierto): el aviso no ofrece «Abrir», ya se abre solo. */
export const watching = ref(false)

/** Pone el pedido en la lista, en su lugar o primero. */
function remember(run: ArticleRunView): void {
  if (!list.value) return
  const exists = list.value.runs.some(r => r.id === run.id)
  const rows = exists ? list.value.runs.map(r => (r.id === run.id ? run : r)) : [run, ...list.value.runs]
  list.value = { ...list.value, runs: rows }
}

export const editorPath = (run: ArticleRunView) => (run.article ? `/articulos/${run.article.id}` : '/articulos')

function settled(run: ArticleRunView): void {
  if (run.status === 'done' && run.article) {
    const article = run.article
    toast(asked.published(article.title), watching.value
      ? {}
      : { action: { label: asked.open, run: () => void router.push({ path: editorPath(run), query: { origen: 'eros' } }) } })
    return
  }
  // Con el diálogo abierto el motivo ya está a la vista: el aviso sería repetirlo.
  if (!watching.value) toast(asked.failedToast(run.error ?? asked.failedFallback), { tone: 'error' })
}

let timer: ReturnType<typeof setTimeout> | null = null

function follow(id: number, misses = 0): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    timer = null
    try {
      const { run } = await runsApi.one(id)
      if (tracked.value?.id !== id) return
      tracked.value = run
      remember(run)
      if (run.status === 'running') follow(id)
      else settled(run)
    }
    catch {
      if (tracked.value?.id === id && misses + 1 < MAX_MISSES) follow(id, misses + 1)
    }
  }, POLL_MS)
}

/** Se lo pide a Eros y lo sigue. Lanza el error del servidor (campos, 409, Eros caído). */
export async function askArticle(request: ArticleGenerateRequest): Promise<ArticleRunView> {
  const { run } = await runsApi.generate(request)
  tracked.value = run
  remember(run)
  if (run.status === 'running') follow(run.id)
  else settled(run)
  return run
}

/** Hay un pedido escribiendo, según lo último que se sabe (el de esta pestaña o el de la lista). */
export const writing = computed<ArticleRunView | null>(() => {
  if (tracked.value?.status === 'running') return tracked.value
  return list.value?.runs.find(r => r.status === 'running') ?? null
})

/** Sigue un pedido que empezó en otro lado (el de los lunes, otra pestaña): para verlo terminar acá. */
export function followRun(run: ArticleRunView): void {
  if (run.status !== 'running' || tracked.value?.id === run.id) return
  tracked.value = run
  follow(run.id)
}
