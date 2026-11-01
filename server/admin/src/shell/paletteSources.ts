/**
 * Las fuentes que trae el shell a la paleta: las secciones (de NAV), las acciones y los registros de
 * /meta. Las vacantes se piden a la API recién al abrir la paleta (y a lo sumo una vez por minuto);
 * sin Eros no hay vacantes que mostrar, y la cola de ejemplo del respaldo no cuenta como registro.
 */
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { ref } from 'vue'
import { api } from '../api/client'
import { registerPaletteSource, type PaletteItem } from '../composables/usePalette'
import { setSingleKeys, singleKeysOn } from '../composables/useShortcuts'
import { label, options } from '../stores/meta'
import { toast } from '../stores/toasts'
import { shell } from './dict'
import { NAV_LINKS } from './nav'

const p = shell.palette
const JOBS_TTL_MS = 60_000

interface JobRow {
  id: string | number
  title?: string | null
  company?: string | null
  match_score?: number | null
  _source?: string
}

/** Las secciones y sus pantallas; una pantalla que repite la dirección de su sección la reemplaza. */
function gotoItems(): PaletteItem[] {
  return NAV_LINKS.flatMap((link) => {
    const children = link.children ?? []
    const own = children.some(child => child.to === link.to) ? [] : [{ id: link.to, label: link.label, to: link.to }]
    return [...own, ...children.map(child => ({ id: child.to, label: child.label, hint: link.label, to: child.to }))]
  })
}

/** Dónde se ve en el sitio lo que se está editando; lo que no está publicado lleva a su lista. */
function sitePath(route: RouteLocationNormalizedLoaded): string {
  const id = Number(route.params['id'])
  const opts = options.value
  switch (route.name) {
    case 'obra': {
      const project = opts?.projects.find(x => x.id === id)
      return project?.visible ? `/projects/${project.slug}` : '/projects'
    }
    case 'articulo': {
      const article = opts?.articles.find(x => x.id === id)
      return article?.status === 'PUBLISHED' ? `/articles/${article.slug}` : '/articles'
    }
    case 'obras': case 'obra-nueva': return '/projects'
    case 'articulos': case 'articulo-nuevo': return '/articles'
    case 'trayectoria-cv': return '/about?cv=ats'
    case 'trayectoria': case 'experiencia': case 'experiencia-nueva': case 'perfil': return '/about'
    default: return '/'
  }
}

function actionItems(router: Router): PaletteItem[] {
  const on = singleKeysOn.value
  return [
    { id: 'new-project', label: p.newProject, to: '/obras/nueva' },
    { id: 'new-experience', label: p.newExperience, to: '/trayectoria/nueva' },
    { id: 'new-article', label: p.newArticle, to: '/articulos/nuevo' },
    { id: 'paste-job', label: p.pasteJob, to: { path: '/busqueda/vacantes', query: { pegar: '1' } } },
    { id: 'view-site', label: p.viewSite, run: () => void window.open(sitePath(router.currentRoute.value), '_blank', 'noopener') },
    {
      id: 'single-keys',
      label: on ? p.singleKeysOff : p.singleKeysOn,
      keywords: 'atajos teclas teclado',
      run: () => {
        setSingleKeys(!on)
        toast(on ? p.singleKeysOffDone : p.singleKeysOnDone, { tone: 'info' })
      },
    },
  ]
}

const jobs = ref<PaletteItem[]>([])
let jobsAt = 0

async function loadJobs(): Promise<void> {
  if (Date.now() - jobsAt < JOBS_TTL_MS) return
  jobsAt = Date.now()
  try {
    const rows = await api.get<JobRow[] | { data?: JobRow[] }>('/hunter/jobs')
    const list = Array.isArray(rows) ? rows : rows.data ?? []
    jobs.value = list
      .filter(job => job._source !== 'fallback' && job.title)
      .map(job => ({
        id: String(job.id),
        label: job.company ? `${job.title} · ${job.company}` : String(job.title),
        hint: typeof job.match_score === 'number' ? `${Math.round(job.match_score)} %` : undefined,
        to: `/busqueda/vacantes/${encodeURIComponent(String(job.id))}`,
      }))
  }
  catch {
    // Sin Eros no hay vacantes: el grupo no aparece y la cabecera ya dice qué pasa.
    jobs.value = []
  }
}

/** Registra las fuentes del shell. Devuelve cómo quitarlas (al salir). */
export function registerShellSources(router: Router): () => void {
  const removers = [
    registerPaletteSource({ id: 'goto', group: 'goto', items: gotoItems }),
    registerPaletteSource({ id: 'actions', group: 'actions', items: () => actionItems(router) }),
    registerPaletteSource({
      id: 'projects',
      group: 'projects',
      items: () => (options.value?.projects ?? []).map(x => ({
        id: String(x.id),
        label: x.title,
        hint: [label('ProjectStatus', x.status), x.visible ? '' : p.hidden].filter(Boolean).join(' · '),
        keywords: x.slug,
        to: `/obras/${x.id}`,
      })),
    }),
    registerPaletteSource({
      id: 'experience',
      group: 'experience',
      items: () => (options.value?.experiences ?? []).map(x => ({
        id: String(x.id),
        label: x.title,
        hint: [label('ExperienceKind', x.kind), x.cvOrder ? p.inCv : ''].filter(Boolean).join(' · '),
        keywords: x.slug,
        to: `/trayectoria/${x.id}`,
      })),
    }),
    registerPaletteSource({
      id: 'articles',
      group: 'articles',
      items: () => (options.value?.articles ?? []).map(x => ({ id: String(x.id), label: x.title, hint: label('ArticleStatus', x.status), keywords: x.slug, to: `/articulos/${x.id}` })),
    }),
    registerPaletteSource({
      id: 'stack',
      group: 'stack',
      items: () => (options.value?.techs ?? []).map(x => ({ id: String(x.id), label: x.name, hint: label('TechCategory', x.category), keywords: x.slug, to: `/tecnologias/${x.id}` })),
    }),
    registerPaletteSource({
      id: 'orgs',
      group: 'orgs',
      items: () => (options.value?.orgs ?? []).map(x => ({ id: String(x.id), label: x.name, keywords: x.slug, to: `/empresas/${x.id}` })),
    }),
    registerPaletteSource({ id: 'jobs', group: 'jobs', items: () => jobs.value, refresh: () => void loadJobs() }),
  ]
  return () => removers.forEach(remove => remove())
}
