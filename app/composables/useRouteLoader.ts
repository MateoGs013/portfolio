import { ref, computed } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

export interface RouteLoaderMeta {
  title: string
  query: string
  target: string
  tag: string
}

export function resolveRouteMetadata(path: string): RouteLoaderMeta {
  const clean = path.replace(/^\/|\/$/g, '')
  const parts = clean ? clean.split('/') : []
  const root = parts[0] || ''
  const sub = parts[1] || ''

  if (!root) {
    return {
      title: 'BOOT // SYSTEM ARCHITECTURE',
      query: 'SELECT * FROM "SystemMeta" · PG-17 CORE',
      target: 'db / root',
      tag: 'SYS_INIT',
    }
  }

  if (root === 'projects') {
    if (sub) {
      const formattedSlug = sub.replace(/-/g, ' ').toUpperCase()
      return {
        title: `FETCH // DOSSIER: ${formattedSlug}`,
        query: `SELECT p.*, t.name FROM "Project" p JOIN "_ProjectTech" ON p.id = t.id WHERE p.slug = '${sub}'`,
        target: `projects/${sub}`,
        tag: 'RELATIONAL',
      }
    }
    return {
      title: 'INDEX // PRODUCTION APPLICATIONS',
      query: 'SELECT * FROM "Project" WHERE status = \'LIVE\' ORDER BY year DESC',
      target: '01 · projects',
      tag: 'QUERY',
    }
  }

  if (root === 'experience') {
    if (sub) {
      return {
        title: `TIMELINE // ROLE: ${sub.toUpperCase()}`,
        query: `SELECT * FROM "Experience" WHERE slug = '${sub}'`,
        target: `experience/${sub}`,
        tag: 'CHRONO',
      }
    }
    return {
      title: 'TIMELINE // PROFESSIONAL HISTORY',
      query: 'SELECT * FROM "Experience" ORDER BY "startDate" DESC · 6 roles',
      target: '02 · experience',
      tag: 'CHRONO',
    }
  }

  if (root === 'stack') {
    if (sub) {
      return {
        title: `QUERY // TECH: ${sub.toUpperCase()}`,
        query: `SELECT * FROM "Technology" WHERE slug = '${sub}'`,
        target: `stack/${sub}`,
        tag: 'TAXONOMY',
      }
    }
    return {
      title: 'CATALOG // TECH ARSENAL & RUNTIMES',
      query: 'SELECT * FROM "Technology" GROUP BY category · 22 packages',
      target: '03 · stack',
      tag: 'TAXONOMY',
    }
  }

  if (root === 'articles') {
    if (sub) {
      return {
        title: `READ // ARTICLE: ${sub.toUpperCase()}`,
        query: `SELECT * FROM "Article" WHERE slug = '${sub}'`,
        target: `articles/${sub}`,
        tag: 'MARKDOWN',
      }
    }
    return {
      title: 'STREAM // ENGINEERING BLOG & DEV.TO',
      query: 'FETCH dev.to markdown & PostgreSQL Article cache',
      target: '04 · articles',
      tag: 'CACHE',
    }
  }

  if (root === 'about') {
    return {
      title: 'PARSING // CURRICULUM VITAE ATS',
      query: 'RESOLVING HARVARD ATS PROFILE & CORE PRINCIPLES',
      target: '05 · about',
      tag: 'DOSSIER',
    }
  }

  if (root === 'contact') {
    return {
      title: 'HANDSHAKE // CHANNELS & AVAILABILITY',
      query: 'POST /api/inbox/handshake · ENCRYPTED RELAY & PGP',
      target: '06 · contact',
      tag: 'SECURITY',
    }
  }

  if (root === 'lab') {
    return {
      title: 'CALIBRATE // BENCHO UI v2.0',
      query: 'INITIALIZING 28 SPRING PHYSICS & WEB AUDIO API',
      target: '07 · lab',
      tag: 'PHYSICS',
    }
  }

  return {
    title: `RESOLVING // ${clean.toUpperCase()}`,
    query: `SELECT * FROM relational_graph WHERE route = '${clean}'`,
    target: clean,
    tag: 'ROUTING',
  }
}

// Estado singleton reactivo global
const visible = ref(false)
const progress = ref(0)
const elapsedMs = ref(0)
const isResolved = ref(false)
const routeMeta = ref<RouteLoaderMeta>(resolveRouteMetadata('/'))

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let rafProgress: number | null = null
let timerMs: ReturnType<typeof setInterval> | null = null
let startTime = 0

export function useRouteLoader() {
  const { isHyperfocus } = useHyperfocus()
  const { playSound } = useBenchoSound()

  function startLoading(destinationPath: string) {
    if (!import.meta.client) return

    // Cancelar cualquier transición previa pendiente
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }

    routeMeta.value = resolveRouteMetadata(destinationPath)
    isResolved.value = false
    startTime = performance.now()
    elapsedMs.value = 0
    progress.value = 12

    // Umbral anti-parpadeo: si la página carga en menos de 75ms (caché/in-memory), no mostrar loader
    debounceTimer = setTimeout(() => {
      visible.value = true
      startProgressLoop()
    }, 75)
  }

  function startProgressLoop() {
    if (timerMs) clearInterval(timerMs)
    timerMs = setInterval(() => {
      elapsedMs.value = Math.round(performance.now() - startTime)
    }, 32)

    const step = () => {
      if (!visible.value || isResolved.value) return

      // Avance asintótico elástico hacia el 85%
      const target = 85
      const diff = target - progress.value
      progress.value += Math.max(0.4, diff * 0.08)

      if (progress.value < target) {
        rafProgress = requestAnimationFrame(step)
      }
    }
    rafProgress = requestAnimationFrame(step)
  }

  function finishLoading() {
    if (!import.meta.client) return

    // Si terminó antes del debounce (75ms), cancelar sin mostrar nada
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }

    if (!visible.value) {
      progress.value = 0
      elapsedMs.value = 0
      return
    }

    // Completar barra y activar estado resuelto (200 OK)
    progress.value = 100
    isResolved.value = true
    elapsedMs.value = Math.round(performance.now() - startTime)

    if (rafProgress) {
      cancelAnimationFrame(rafProgress)
      rafProgress = null
    }
    if (timerMs) {
      clearInterval(timerMs)
      timerMs = null
    }

    playSound('poke')

    // Disolución óptica suave tras 160ms de confirmación visual
    setTimeout(() => {
      visible.value = false
      setTimeout(() => {
        isResolved.value = false
        progress.value = 0
        elapsedMs.value = 0
      }, 220)
    }, 160)
  }

  return {
    visible: computed(() => visible.value),
    progress: computed(() => progress.value),
    elapsedMs: computed(() => elapsedMs.value),
    isResolved: computed(() => isResolved.value),
    routeMeta: computed(() => routeMeta.value),
    isHyperfocus,
    startLoading,
    finishLoading,
  }
}
