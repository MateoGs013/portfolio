import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { apiGet, idOf, mod, saveState, signedIn, withoutStamps } from './admin-support'

/**
 * Ida y vuelta (plan §5): lo que el editor lee lo devuelve igual. Por cada colección y los dos
 * documentos del perfil se abre un registro real, se cambia un campo y se guarda, se lo vuelve a su
 * valor y se guarda otra vez: el GET del admin (y el de la API pública, donde lo hay) queda idéntico al
 * de antes, con los ids de métricas, enlaces, pasos e imágenes incluidos. Solo cambia updatedAt.
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-idayvuelta.spec.ts
 *
 * Guardar sin cambios no manda nada (el editor dice «Sin cambios»): por eso el campo va y vuelve, y el
 * segundo PUT lleva el formulario entero con los valores originales.
 */
interface Case {
  name: string
  /** El id del registro en la copia (null para los documentos). */
  id: (request: APIRequestContext) => Promise<number | null>
  hash: (id: number | null) => string
  /** El GET del admin que se compara. */
  read: (request: APIRequestContext, id: number | null) => Promise<unknown>
  /** La ruta del PUT que guarda el editor. */
  put: (id: number | null) => RegExp
  field: string
  /** La API pública que lo sirve, si la hay: también tiene que quedar igual. */
  site?: (request: APIRequestContext) => Promise<unknown>
}

const listed = (path: string) => async (request: APIRequestContext, id: number | null) =>
  (await apiGet<{ id: number }[]>(request, path)).find(row => row.id === id)
const site = (path: string) => async (request: APIRequestContext) => {
  const res = await request.get(`/api${path}`)
  expect(res.ok(), `GET /api${path}`).toBe(true)
  const body = await res.json() as { meta?: unknown }
  // El sobre de la API pública (fuente y fecha de la respuesta) no es contenido.
  return withoutStamps({ ...body, meta: undefined })
}

const CASES: Case[] = [
  {
    name: 'Obras: La Rúcula, con métricas, enlaces, pasos e imágenes',
    id: request => idOf(request, '/projects', 'la-rucula'),
    hash: id => `#/obras/${id}`,
    read: (request, id) => apiGet(request, `/projects/${id}`),
    put: id => new RegExp(`/api/admin/projects/${id}$`),
    field: 'Título',
    site: site('/projects/la-rucula'),
  },
  {
    name: 'Trayectoria: una entrada con viñetas en los dos idiomas',
    id: request => idOf(request, '/experience', 'la-rucula'),
    hash: id => `#/trayectoria/${id}`,
    read: listed('/experience'),
    put: id => new RegExp(`/api/admin/experience/${id}$`),
    field: 'Cargo · Español',
    site: site('/experience'),
  },
  {
    name: 'Artículos: el artículo publicado',
    id: async request => (await apiGet<{ id: number }[]>(request, '/articles'))[0]!.id,
    hash: id => `#/articulos/${id}`,
    read: (request, id) => apiGet(request, `/articles/${id}`),
    put: id => new RegExp(`/api/admin/articles/${id}$`),
    field: 'Título · Español',
  },
  {
    name: 'Tecnologías: JavaScript',
    id: request => idOf(request, '/techs', 'javascript'),
    hash: id => `#/tecnologias/${id}`,
    read: listed('/techs'),
    put: id => new RegExp(`/api/admin/techs/${id}$`),
    field: 'Nombre',
  },
  {
    name: 'Empresas: La Rúcula Gastrobar',
    id: request => idOf(request, '/orgs', 'la-rucula-gastrobar'),
    hash: id => `#/empresas/${id}`,
    read: (request, id) => apiGet(request, `/orgs/${id}`),
    put: id => new RegExp(`/api/admin/orgs/${id}$`),
    field: 'Nombre',
  },
  {
    name: 'Perfil: Sobre mí',
    id: async () => null,
    hash: () => '#/perfil/sobre-mi',
    read: request => apiGet(request, '/docs/about'),
    put: () => /\/api\/admin\/docs\/about$/,
    field: 'Bajada · Español',
    site: site('/docs/about'),
  },
  {
    name: 'Perfil: Contacto',
    id: async () => null,
    hash: () => '#/perfil/contacto',
    read: request => apiGet(request, '/docs/contact'),
    put: () => /\/api\/admin\/docs\/contact$/,
    field: 'Tiempo de respuesta · Español',
    site: site('/docs/contact'),
  },
]

/** Escribe `value` en el campo y guarda con Ctrl/⌘S: espera el PUT y el «Guardado» del pie. */
async function saveWith(page: Page, label: string, value: string, put: RegExp): Promise<void> {
  const input = page.getByLabel(label, { exact: true })
  await input.fill(value)
  const response = page.waitForResponse(res => res.request().method() === 'PUT' && put.test(new URL(res.url()).pathname))
  await input.press(`${mod}+s`)
  expect((await response).status(), `PUT ${put}`).toBe(200)
  await expect(saveState(page)).toContainText('Guardado')
}

test.describe('guardar lo que se leyó no cambia nada', () => {
  for (const c of CASES) {
    test(c.name, async ({ page, request }) => {
      const id = await c.id(request)
      const before = withoutStamps(await c.read(request, id))
      expect(before, 'el registro existe en la copia').toBeTruthy()
      const siteBefore = await c.site?.(request)

      await signedIn(page, c.hash(id))
      const input = page.getByLabel(c.field, { exact: true })
      await expect(input).not.toHaveValue('')
      const original = await input.inputValue()

      await saveWith(page, c.field, `${original} (ida)`, c.put(id))
      expect(withoutStamps(await c.read(request, id)), 'la ida cambió el campo').not.toEqual(before)
      await saveWith(page, c.field, original, c.put(id))

      const after = withoutStamps(await c.read(request, id)) as { metrics?: { id: number }[] }
      expect(after).toEqual(before)
      // Las métricas se sincronizan por id: el mismo id en cada una, no filas nuevas.
      const metrics = (before as { metrics?: { id: number }[] }).metrics
      if (metrics) {
        expect(metrics.length, 'la obra trae métricas').toBeGreaterThan(0)
        expect(after.metrics?.map(m => m.id)).toEqual(metrics.map(m => m.id))
      }
      if (c.site) expect(await c.site(request), 'la API pública').toEqual(siteBefore)
    })
  }
})
