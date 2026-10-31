/**
 * Acceso a la API pública. Toda llamada lleva el idioma; los parámetros de vista (`vista`, `cv`,
 * `foco`) son de la página y nunca viajan a la API. En el SSR se llama directo al proceso de la API;
 * en el navegador, a `/api` del mismo origen (Nitro la proxía), así no depende de CORS ni del host
 * interno de producción.
 */
import type { LocationQuery } from 'vue-router'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { NuxtApp } from '#app'
import type { Envelope, Experience, Project, ProjectSummary } from '~/lib/api'
import type { Lang } from '~/lib/dict'

/** Filtros que acepta cada colección; la query pública mapea uno a uno con la API. */
export const API_PARAMS = {
  projects: ['status', 'stack', 'featured', 'year', 'org'],
  stack: ['category'],
  experience: ['stack', 'org'],
  articles: ['stack', 'featured', 'project'],
} as const

/** Parámetros que solo cambian cómo se ve la página. */
export const VIEW_PARAMS = ['vista', 'cv', 'foco'] as const

export type ApiCollection = keyof typeof API_PARAMS
export type ProjectFilters = Partial<Record<(typeof API_PARAMS)['projects'][number], string>>

/** La query de la página reducida a los filtros que entiende `collection`, en orden estable. */
export function apiParams<C extends ApiCollection>(collection: C, query: LocationQuery | Record<string, string | undefined>) {
  const out: Partial<Record<(typeof API_PARAMS)[C][number], string>> = {}
  for (const key of API_PARAMS[collection] as readonly (typeof API_PARAMS)[C][number][]) {
    const raw = (query as Record<string, unknown>)[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (typeof value === 'string' && value.trim() !== '') out[key] = value.trim().toLowerCase()
  }
  return out
}

/** Parte de la clave de caché que identifica los filtros: '' sin filtros. */
function filterKey(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
}

/** Lo ya traído (hidratación o navegación previa) se reusa; un refresh explícito vuelve a pedir. */
function getCachedData<T>(key: string, nuxtApp: NuxtApp, ctx: { cause: string }): T | undefined {
  if (ctx.cause === 'refresh:manual' || ctx.cause === 'refresh:hook') return undefined
  return (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as T | undefined
}

function statusOf(err: unknown): number | undefined {
  const e = err as { statusCode?: number, status?: number, response?: { status?: number } }
  return e.response?.status ?? e.statusCode ?? e.status
}

/**
 * En el SSR la API ve como cliente al proceso de Nuxt, no a quien pidió la página: sin esto, todo el
 * tráfico renderizado cae en un solo balde del rate limit público (300 cada 15 min) y, pasado ese
 * número, el sitio entero responde 503. Se reenvía el X-Forwarded-For que llegó (lo pone Traefik) o,
 * sin proxy delante, la dirección del socket; es lo mismo que hace el proxy de Nitro con `/api/**`.
 */
function forwardedFor(): Record<string, string> {
  const req = useRequestEvent()?.node.req
  if (!req) return {}
  const header = req.headers['x-forwarded-for']
  const value = (Array.isArray(header) ? header.join(', ') : header) || req.socket.remoteAddress
  return value ? { 'x-forwarded-for': value } : {}
}

export function useApi() {
  const config = useRuntimeConfig()
  const { lang } = useLocale()
  const base = import.meta.server ? config.public.apiBase : '/api'
  const headers = import.meta.server ? forwardedFor() : {}

  /** GET a la API con `lang`. 404 se propaga; sin respuesta es 503 y un 5xx es 502. */
  async function get<T>(path: string, params: Record<string, string | undefined> = {}, as: Lang = lang.value): Promise<Envelope<T>> {
    const query = { ...params, lang: as }
    try {
      return await $fetch<Envelope<T>>(`${base}${path}`, { query, headers, timeout: 8000 })
    }
    catch (err) {
      const status = statusOf(err)
      if (status === 404) throw createError({ statusCode: 404, statusMessage: 'not found' })
      const statusCode = status === undefined || status === 503 ? 503 : 502
      throw createError({ statusCode, statusMessage: statusCode === 503 ? 'api unavailable' : 'api error' })
    }
  }

  return { get, lang }
}

/** Lanza el error de una carga para que lo dibuje error.vue (404, 502 o 503). */
export function failOn(error: Ref<{ statusCode?: number, statusMessage?: string } | null | undefined>) {
  const e = error.value
  if (e) throw createError({ statusCode: e.statusCode ?? 503, statusMessage: e.statusMessage, fatal: true })
}

/**
 * Lista de obras visibles, en sortOrder. Sin filtros comparte una sola clave por idioma
 * ('projects:es'), que reusan el inicio, Obra, el caso y la siguiente obra; la siguiente obra sale
 * siempre de esta lista completa. Con filtros, la clave los incluye.
 */
export function useProjects(filters?: MaybeRefOrGetter<ProjectFilters | undefined>) {
  const { get, lang } = useApi()
  const params = computed(() => apiParams('projects', toValue(filters) ?? {}))
  const key = computed(() => {
    const f = filterKey(params.value)
    return f ? `projects:${lang.value}:${f}` : `projects:${lang.value}`
  })
  return useAsyncData(key, () => get<ProjectSummary[]>('/projects', params.value).then(r => r.data), {
    getCachedData,
  })
}

/** Un caso completo; 404 si no existe o no se publica. */
export function useProject(slug: MaybeRefOrGetter<string>) {
  const { get, lang } = useApi()
  const key = computed(() => `project:${toValue(slug).toLowerCase()}:${lang.value}`)
  return useAsyncData(key, () => get<Project>(`/projects/${encodeURIComponent(toValue(slug).toLowerCase())}`).then(r => r.data), {
    getCachedData,
  })
}

/** La trayectoria completa (experiencia y formación). */
export function useExperience() {
  const { get, lang } = useApi()
  const key = computed(() => `experience:${lang.value}`)
  return useAsyncData(key, () => get<Experience[]>('/experience').then(r => r.data), { getCachedData })
}

export { getCachedData as cachedApiData }
