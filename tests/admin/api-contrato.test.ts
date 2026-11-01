/**
 * Contrato de la API del admin (D1): errores por campo en español, /meta con los conteos del sitio,
 * direcciones fijas, inglés de artículos y viñetas, impacto de un borrado y que /admin sirva solo el build
 * (pnpm build:admin antes; tests/e2e/run.mjs ya lo corre).
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/api-contrato.test.ts
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import type { AdminErrorBody, AdminImpact, AdminMeta, AdminStatus, DeleteResult } from '../../server/src/shared/adminContracts.js'
import { JARGON, admin, call, ok } from './api.js'

type Row = Record<string, unknown> & { id: number, slug: string }
interface Envelope<T> { data: T, meta: { count: number } }

function assertFieldErrors(body: AdminErrorBody, paths: string[]): void {
  assert.equal(body.code, 'invalid')
  const found = body.errors.map(e => e.path)
  for (const path of paths) assert.ok(found.includes(path), `falta el error de ${path} en ${JSON.stringify(found)}`)
  for (const e of body.errors) {
    assert.doesNotMatch(e.message, JARGON, `mensaje con jerga: ${e.message}`)
    assert.match(e.message, /[áéíóúñ«]|Completá|Elegí/, `mensaje sin español claro: ${e.message}`)
  }
  assert.doesNotMatch(body.error, JARGON)
}

describe('errores', () => {
  test('una obra con solo título y dirección da todos los campos que faltan, en español', async () => {
    const reply = await admin<AdminErrorBody>('POST', '/projects', { title: 'Obra de prueba', slug: 'obra-de-prueba' })
    assert.equal(reply.status, 400)
    assertFieldErrors(reply.body, ['role', 'summary', 'year', 'status'])
  })

  test('los campos anidados llevan su ruta', async () => {
    const reply = await admin<AdminErrorBody>('POST', '/projects', { title: 'x', slug: 'x', links: [{ label: 'Sitio' }] })
    assert.equal(reply.status, 400)
    assertFieldErrors(reply.body, ['links[0].url'])
  })

  test('un registro que no existe da 404 en español', async () => {
    const reply = await admin<AdminErrorBody>('GET', '/projects/999999')
    assert.equal(reply.status, 404)
    assert.equal(reply.body.code, 'not_found')
    assert.doesNotMatch(reply.body.error, /not found/i)
  })

  test('una dirección repetida da 409 en el campo de la dirección', async () => {
    const reply = await admin<AdminErrorBody>('POST', '/orgs', { name: 'Repetida', slug: 'arg-piscinas' })
    assert.equal(reply.status, 409)
    assert.equal(reply.body.code, 'conflict')
    assert.deepEqual(reply.body.errors.map(e => e.path), ['slug'])
  })

  test('color inválido y año fuera de rango en una tecnología', async () => {
    const reply = await admin<AdminErrorBody>('POST', '/techs', { name: 'Prueba', category: 'TOOLING', since: 1800, color: 'no-es-un-color' })
    assert.equal(reply.status, 400)
    assertFieldErrors(reply.body, ['since', 'color'])
  })
})

describe('meta y estado', () => {
  test('las obras visibles de /meta son las que publica el sitio', async () => {
    const meta = await ok<AdminMeta>('GET', '/meta')
    const site = await call<Envelope<unknown[]>>('GET', '/api/projects')
    assert.equal(site.status, 200)
    assert.equal(meta.summary.projects.visible, site.body.meta.count)
    assert.equal(meta.summary.projects.visible, 6)
    const all = await ok<unknown[]>('GET', '/projects')
    assert.equal(meta.summary.projects.visible + meta.summary.projects.hidden + meta.summary.projects.scheduled, all.length)
  })

  test('enums con rótulo y el esquema, sin las claves del panel anterior', async () => {
    const meta = await ok<AdminMeta>('GET', '/meta')
    assert.deepEqual(meta.enumOptions.ProjectStatus.find(o => o.value === 'LIVE'), { value: 'LIVE', label: 'En producción' })
    assert.ok(!('counts' in meta) && !('enums' in meta))
    assert.equal(meta.schema.Project.summary.label, 'Resumen')
    assert.ok(meta.options.experiences.length > 0 && meta.options.articles.length > 0)
    assert.ok(meta.options.projects.every(p => typeof p.visible === 'boolean'))
  })

  test('/status dice si la base responde y en qué está Eros', async () => {
    const status = await ok<AdminStatus>('GET', '/status')
    assert.equal(status.db.ok, true)
    assert.ok(['ok', 'cooldown', 'down', 'unconfigured', 'auth'].includes(status.eros.state))
  })
})

/** El body de un PUT armado con lo que devolvió el GET (ida y vuelta sin cambios). */
function articleBody(row: Row) {
  const techs = row['techs'] as { id: number }[]
  const keys = ['slug', 'title', 'summary', 'content', 'readingTimeMin', 'status', 'featured', 'coverImage', 'canonicalUrl', 'sortOrder', 'publishedAt', 'projectId']
  return { ...Object.fromEntries(keys.map(k => [k, row[k]])), techIds: techs.map(t => t.id) }
}

describe('artículos', () => {
  test('el inglés se guarda y la API pública lo sirve', async () => {
    const [article] = await ok<Row[]>('GET', '/articles')
    assert.ok(article)
    await ok('PUT', `/articles/${article.id}`, { ...articleBody(article), translations: { en: { title: 'English title from the admin' } } })
    const site = await call<Envelope<{ title: string }>>('GET', `/api/articles/${article.slug}?lang=en`)
    assert.equal(site.body.data.title, 'English title from the admin')
  })

  test('la dirección no cambia al guardar y cambia con PATCH', async () => {
    const [article] = await ok<Row[]>('GET', '/articles')
    assert.ok(article)
    const moved = await admin<AdminErrorBody>('PUT', `/articles/${article.id}`, { ...articleBody(article), slug: 'otra-direccion' })
    assert.equal(moved.status, 400)
    assert.deepEqual(moved.body.errors.map(e => e.path), ['slug'])
    assert.match(moved.body.errors[0]?.message ?? '', /Cambiar dirección/)

    const changed = await ok<Row>('PATCH', `/articles/${article.id}/slug`, { slug: 'direccion-nueva' })
    assert.equal(changed.slug, 'direccion-nueva')
    assert.equal((await call('GET', '/api/articles/direccion-nueva')).status, 200)
    assert.equal((await call('GET', `/api/articles/${article.slug}`)).status, 404)
  })

  test('nace en borrador, sin fecha y con la dirección del título sin acentos', async () => {
    const row = await ok<Row>('POST', '/articles', { title: 'Ñandú: acentos y más', summary: 'Bajada', content: 'Texto', status: 'PUBLISHED', publishedAt: '2026-01-01' })
    assert.equal(row.slug, 'nandu-acentos-y-mas')
    assert.equal(row['status'], 'DRAFT')
    assert.equal(row['publishedAt'], null)
    const site = await call<Envelope<{ slug: string }[]>>('GET', '/api/articles')
    assert.ok(!site.body.data.some(a => a.slug === row.slug))
  })
})

function experienceBody(row: Row) {
  const keys = ['slug', 'kind', 'role', 'startedAt', 'endedAt', 'summary', 'story', 'highlights', 'location', 'cvOrder', 'orgId']
  const ids = (k: string) => (row[k] as { id: number }[]).map(x => x.id)
  return { ...Object.fromEntries(keys.map(k => [k, row[k]])), techIds: ids('techs'), projectIds: ids('projects') }
}

describe('trayectoria', () => {
  const pick = async (slug: string) => {
    const row = (await ok<Row[]>('GET', '/experience')).find(e => e.slug === slug)
    assert.ok(row, `no está la experiencia ${slug}`)
    return row
  }

  test('la dirección no cambia al guardar y cambia con PATCH', async () => {
    const row = await pick('ynara')
    const moved = await admin<AdminErrorBody>('PUT', `/experience/${row.id}`, { ...experienceBody(row), slug: 'ynara-otra' })
    assert.equal(moved.status, 400)
    assert.deepEqual(moved.body.errors.map(e => e.path), ['slug'])
    const changed = await ok<Row>('PATCH', `/experience/${row.id}/slug`, { slug: 'ynara-estudio' })
    assert.equal(changed.slug, 'ynara-estudio')
    assert.equal((await call('GET', '/api/experience/ynara-estudio')).status, 200)
    assert.equal((await call('GET', '/api/experience/ynara')).status, 404)
  })

  test('las viñetas en inglés quedan en su posición', async () => {
    const row = await pick('escuela-da-vinci')
    const es = row['highlights'] as string[]
    assert.equal(es.length, 2)
    const saved = await ok<Row>('PUT', `/experience/${row.id}`, { ...experienceBody(row), translations: { en: { highlights: ['', 'only second'] } } })
    const [english] = saved['translations'] as { highlights: string[] }[]
    assert.deepEqual(english?.highlights, ['', 'only second'])

    const site = await call<Envelope<{ highlights: string[], untranslated: string[] }>>('GET', '/api/experience/escuela-da-vinci?lang=en')
    assert.deepEqual(site.body.data.highlights, [es[0], 'only second'])
    assert.ok(site.body.data.untranslated.includes('highlights[0]'))
    assert.ok(!site.body.data.untranslated.includes('highlights[1]'))
  })

  test('una viñeta en inglés sin par en español es un error', async () => {
    const row = await pick('escuela-da-vinci')
    const reply = await admin<AdminErrorBody>('PUT', `/experience/${row.id}`, { ...experienceBody(row), translations: { en: { highlights: ['a', 'b', 'c'] } } })
    assert.equal(reply.status, 400)
    assertFieldErrors(reply.body, ['translations.en.highlights'])
  })

  test('el orden del CV se escribe 1..n y el resto queda fuera', async () => {
    const all = await ok<Row[]>('GET', '/experience')
    const chosen = all.filter(e => e['cvOrder'] !== null).map(e => e.id).reverse().slice(0, 3)
    const rows = await ok<Row[]>('PATCH', '/experience/order', { ids: chosen })
    for (const row of rows) {
      const at = chosen.indexOf(row.id)
      assert.equal(row['cvOrder'], at === -1 ? null : at + 1)
    }
  })
})

describe('empresas y tecnologías', () => {
  test('el impacto de una empresa lista sus obras y experiencias, y el borrado las pasa a otra', async () => {
    const org = (await ok<Row[]>('GET', '/orgs')).find(o => o.slug === 'arg-piscinas')
    assert.ok(org)
    const impact = await ok<AdminImpact>('GET', `/orgs/${org.id}/impact`)
    assert.ok(impact.projects.length > 0 && impact.experiences.length > 0)

    const target = await ok<Row>('POST', '/orgs', { name: 'Empresa de destino', url: 'ejemplo.com' })
    assert.equal(target.slug, 'empresa-de-destino')
    assert.equal(target['url'], 'https://ejemplo.com')
    const result = await ok<DeleteResult>('DELETE', `/orgs/${org.id}?reassignTo=${target.id}`)
    assert.equal(result.moved, impact.total)
    const after = await ok<AdminImpact>('GET', `/orgs/${target.id}/impact`)
    assert.deepEqual(after.projects.map(p => p.id).sort(), impact.projects.map(p => p.id).sort())
    assert.deepEqual(after.experiences.map(e => e.id).sort(), impact.experiences.map(e => e.id).sort())
  })

  test('una tecnología borrada con reasignación deja la otra en su lugar', async () => {
    const techs = await ok<Row[]>('GET', '/techs')
    const used = techs.find(t => (t['_count'] as { projects: number }).projects > 0)
    const other = techs.find(t => t.id !== used?.id)
    assert.ok(used && other)
    const impact = await ok<AdminImpact>('GET', `/techs/${used.id}/impact`)
    await ok('DELETE', `/techs/${used.id}?reassignTo=${other.id}`)
    const after = await ok<AdminImpact>('GET', `/techs/${other.id}/impact`)
    for (const p of impact.projects) assert.ok(after.projects.some(q => q.id === p.id))
  })

  test('la dirección de una empresa no cambia al guardar', async () => {
    const org = (await ok<Row[]>('GET', '/orgs'))[0]
    assert.ok(org)
    const reply = await admin<AdminErrorBody>('PUT', `/orgs/${org.id}`, { name: org['name'], slug: 'otra' })
    assert.equal(reply.status, 400)
    assert.deepEqual(reply.body.errors.map(e => e.path), ['slug'])
  })
})

describe('archivos del admin', () => {
  test('solo se sirve el build: el panel anterior y las fuentes no existen', async () => {
    for (const file of ['/admin/vite.config.ts', '/admin/tsconfig.json', '/admin/js/app.js', '/admin/admin.css', '/admin/vendor/vue.js', '/admin/src/main.ts', '/admin/assets/no-existe.js']) {
      assert.equal((await call('GET', file)).status, 404, file)
    }
    assert.equal((await call('GET', '/admin/')).status, 200)
    assert.equal((await call('GET', '/admin/obras')).status, 200)
  })
})
