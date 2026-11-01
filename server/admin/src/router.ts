/**
 * Las rutas del admin, por hash: la ruta es el estado (recargar o compartir el enlace deja en el mismo
 * lugar). Cada área tiene una sola entrada, features/<área>/Index.vue, que decide por los parámetros
 * si muestra la lista o el registro. Todas se cargan recién cuando se visitan.
 *
 * Antes de cada navegación: la sesión (sin clave se va a #/ingresar y se vuelve después) y la guarda
 * de cambios sin guardar. Después: el título de la pestaña y el foco al h1 de la vista nueva.
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { confirmLeave } from './composables/useLeaveGuards'
import { shell } from './shell/dict'
import type { NavId } from './shell/nav'
import { focusView, setSectionTitle } from './shell/title'
import { installViewTransitions, sameScreen } from './shell/transition'
import { bootSession, session } from './stores/session'

declare module 'vue-router' {
  interface RouteMeta {
    /** Lo que dice la pestaña después del registro: «Obras». */
    section?: string
    /** La sección de la navegación que queda marcada. */
    nav?: NavId
    /** Se ve sin sesión (el ingreso). */
    public?: boolean
    /** Sin el shell (columna, cabecera y paleta). */
    bare?: boolean
  }
}

const n = shell.nav
const home = () => import('./features/home/Index.vue')
const projects = () => import('./features/projects/Index.vue')
const experience = () => import('./features/experience/Index.vue')
const articles = () => import('./features/articles/Index.vue')
const profile = () => import('./features/profile/Index.vue')
const stack = () => import('./features/stack/Index.vue')
const orgs = () => import('./features/orgs/Index.vue')

/** Las cuatro secciones de una obra y las cuatro etapas de una vacante (plan §3 y §6). */
const PROJECT_SECTIONS = 'esencial|relato|imagenes|datos'
const JOB_STAGES = 'analisis|mensaje|cv|postular'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/inicio' },
  { path: '/ingresar', name: 'ingresar', component: () => import('./shell/LoginView.vue'), meta: { public: true, bare: true, section: shell.login.title } },
  { path: '/inicio', name: 'inicio', component: home, meta: { nav: 'inicio', section: n.home } },

  { path: '/obras', name: 'obras', component: projects, meta: { nav: 'obras', section: n.projects } },
  { path: '/obras/nueva', name: 'obra-nueva', component: projects, meta: { nav: 'obras', section: n.projects } },
  { path: `/obras/:id(\\d+)/:seccion(${PROJECT_SECTIONS})?`, name: 'obra', component: projects, meta: { nav: 'obras', section: n.projects } },

  { path: '/trayectoria', name: 'trayectoria', component: experience, meta: { nav: 'trayectoria', section: n.experience } },
  { path: '/trayectoria/cv', name: 'trayectoria-cv', component: experience, meta: { nav: 'trayectoria', section: n.experience } },
  { path: '/trayectoria/nueva', name: 'experiencia-nueva', component: experience, meta: { nav: 'trayectoria', section: n.experience } },
  { path: '/trayectoria/:id(\\d+)', name: 'experiencia', component: experience, meta: { nav: 'trayectoria', section: n.experience } },

  { path: '/articulos', name: 'articulos', component: articles, meta: { nav: 'articulos', section: n.articles } },
  { path: '/articulos/nuevo', name: 'articulo-nuevo', component: articles, meta: { nav: 'articulos', section: n.articles } },
  { path: '/articulos/:id(\\d+)', name: 'articulo', component: articles, meta: { nav: 'articulos', section: n.articles } },

  { path: '/perfil', redirect: '/perfil/sobre-mi' },
  { path: '/perfil/:doc(sobre-mi|contacto)', name: 'perfil', component: profile, meta: { nav: 'perfil', section: n.profile } },

  { path: '/tecnologias', name: 'tecnologias', component: stack, meta: { nav: 'tecnologias', section: n.stack } },
  { path: '/tecnologias/:id(\\d+)', name: 'tecnologia', component: stack, meta: { nav: 'tecnologias', section: n.stack } },
  { path: '/empresas', name: 'empresas', component: orgs, meta: { nav: 'empresas', section: n.orgs } },
  { path: '/empresas/:id(\\d+)', name: 'empresa', component: orgs, meta: { nav: 'empresas', section: n.orgs } },

  {
    path: '/busqueda',
    component: () => import('./shell/SearchLayout.vue'),
    meta: { nav: 'busqueda' },
    children: [
      { path: '', redirect: '/busqueda/vacantes' },
      { path: `vacantes/:id?/:etapa(${JOB_STAGES})?`, name: 'vacantes', component: () => import('./features/hunter/Index.vue'), meta: { section: n.jobs } },
      { path: 'publicaciones/:id?', name: 'publicaciones', component: () => import('./features/content/Index.vue'), meta: { section: n.posts } },
      { path: 'tendencias/:id?', name: 'tendencias', component: () => import('./features/radar/Index.vue'), meta: { section: n.trends } },
    ],
  },

  { path: '/:rest(.*)*', name: 'no-existe', component: () => import('./shell/NotFound.vue'), meta: { section: shell.notFound.title } },
]

// El Muestrario de los componentes base: solo en `pnpm dev:admin`, el build lo deja afuera.
if (import.meta.env.DEV) {
  routes.unshift({ path: '/muestrario', name: 'muestrario', component: () => import('./ui/Muestrario.vue'), meta: { public: true, bare: true } })
  // El marco de colecciones (C0) sobre las empresas de la base: con sesión y dentro del shell.
  routes.unshift({
    path: '/muestrario/coleccion/:id(\\d+|nueva)?/:seccion(esencial|ubicacion|componentes)?',
    name: 'muestrario-coleccion',
    component: () => import('./features/collections/sample/SampleIndex.vue'),
    meta: { section: 'Muestrario' },
  })
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to, from) => {
  const state = session.value === 'checking' ? await bootSession() : session.value
  if (!to.meta.public && state !== 'in') {
    return { name: 'ingresar', query: to.fullPath === '/inicio' ? {} : { volver: to.fullPath }, replace: true }
  }
  if (to.name === 'ingresar' && state === 'in') return { path: '/inicio', replace: true }
  // Cambiar de pestaña dentro del mismo registro no pierde nada: lo decide cada guarda con `keeps`.
  // Después de Salir ya se preguntó (y sin sesión no hay cómo guardar).
  if (state === 'in' && from.matched.length && to.path !== from.path && !(await confirmLeave(to))) return false
  return true
})

installViewTransitions(router)

router.afterEach((to, from, failure) => {
  if (failure) return
  setSectionTitle(to.meta.section ?? '')
  // En la primera carga el foco queda al principio: el primer Tab es «Saltar al editor».
  if (from.matched.length && !sameScreen(to, from)) void focusView()
})
