/**
 * Datos del admin (D2): documentos con esquema fijo, retrato en _perfil, métricas por id con su rótulo
 * en inglés, dirección fija de la obra y reemplazo de media que conserva la fila.
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/api-datos.test.ts
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { after, describe, test } from 'node:test'
import type { AdminDoc, AdminErrorBody, AdminMeta } from '../../server/src/shared/adminContracts.js'
import { docSchemas } from '../../server/src/shared/docSchema.js'
import { admin, call, ok } from './api.js'
import { consumedDocNames, folderExists, folderFiles, onDisk, png, projectBody, removeEmptyFolder, removeFiles, served, sql, upload, uploaded } from './datos.js'

type Row = Record<string, unknown> & { id: number, slug: string }
type Field = AdminDoc['fields'][number]
interface Envelope<T> { data: T }
interface PublicDoc { fields: { name: string, type: string, value: string | string[] }[] }

const written = new Set<string>()
const hadProfileFolder = folderExists('_perfil')
after(() => {
  removeFiles(written)
  if (!hadProfileFolder) removeEmptyFolder('_perfil')
})

const valueOf = (doc: PublicDoc | AdminDoc, name: string) => doc.fields.find(f => f.name === name)?.value
const withField = (doc: AdminDoc, name: string, change: Partial<Field>) => doc.fields.map(f => (f.name === name ? { ...f, ...change } : f))

async function publicDoc(key: string, lang: string): Promise<PublicDoc> {
  return (await call<Envelope<PublicDoc>>('GET', `/api/docs/${key}?lang=${lang}`)).body.data
}

describe('documentos', () => {
  test('el esquema cubre cada bloque que leen el sitio, el CV y el Job Hunter', () => {
    const known = new Set([...docSchemas.about.blocks, ...docSchemas.contact.blocks].map(b => b.name))
    const used = [...consumedDocNames()]
    assert.ok(used.length >= 15, `se encontraron pocos bloques leídos: ${used.join(', ')}`)
    assert.deepEqual(used.filter(n => !known.has(n)), [])
  })

  test('GET devuelve bloques, esquema y faltantes, con el retrato como imagen sin inglés', async () => {
    const about = await ok<AdminDoc>('GET', '/docs/about')
    assert.equal(about.schema.length, docSchemas.about.blocks.length)
    assert.deepEqual(about.missing, [])
    const portrait = about.fields.find(f => f.name === 'portrait')
    assert.equal(portrait?.type, 'image')
    assert.equal(portrait?.en, undefined)
    assert.equal((await admin('GET', '/docs/otro')).status, 404)
    assert.equal((await admin('DELETE', '/docs/about')).status, 404)
  })

  test('un email nuevo llega al inglés, al CV en inglés y al CV del Job Hunter; el PDF EN queda', async () => {
    const contact = await ok<AdminDoc>('GET', '/docs/contact')
    await ok('PUT', '/docs/contact', { title: 'Otro título', fields: withField(contact, 'email', { value: 'nuevo@ejemplo.com' }) })
    const english = await publicDoc('contact', 'en')
    assert.equal(valueOf(english, 'email'), 'nuevo@ejemplo.com')
    assert.equal(valueOf(english, 'cv'), '/cv/CV-EN-Mateo-Sonzogni-ATS.pdf')
    assert.equal(valueOf(await publicDoc('contact', 'es'), 'cv'), '/cv/CV-ES-Mateo-Sonzogni-ATS.pdf')
    const cv = await call<Envelope<{ header: { email: string } }>>('GET', '/api/cv?lang=en')
    assert.equal(cv.body.data.header.email, 'nuevo@ejemplo.com')
    const job = { title: 'Frontend Engineer (Vue 3 / TypeScript)', company: 'Example', description: 'We are hiring a frontend engineer to build Vue 3 interfaces with TypeScript.', tags: ['Vue', 'TypeScript'], url: '', contact_email: null }
    const hunter = await ok('POST', '/hunter/cv/3735c0410255ea25', { job })
    assert.match(JSON.stringify(hunter), /nuevo@ejemplo\.com/)
    assert.equal((await ok<AdminDoc>('GET', '/docs/contact')).title, contact.title, 'el título guardado se conserva')
  })

  test('un bloque fijo no se renombra, no cambia de tipo ni se quita', async () => {
    const about = await ok<AdminDoc>('GET', '/docs/about')
    const renamed = await admin<AdminErrorBody>('PUT', '/docs/about', { fields: withField(about, 'display_name', { name: 'nombre_visible' }) })
    assert.equal(renamed.status, 400)
    assert.ok(renamed.body.errors.some(e => e.path === 'fields.display_name' && /no se quita ni se renombra/.test(e.message)))
    const retyped = await admin<AdminErrorBody>('PUT', '/docs/about', { fields: withField(about, 'headline', { type: 'list' }) })
    assert.deepEqual(retyped.body.errors.map(e => e.path), ['fields.headline.type'])
    const free = await admin<AdminErrorBody>('PUT', '/docs/about', { fields: [...about.fields, { name: 'sitio_extra', type: 'url', value: 'https://ejemplo.com' }] })
    assert.deepEqual(free.body.errors.map(e => e.path), ['fields.sitio_extra.type'])
  })

  test('un bloque libre de texto se guarda con su inglés, después de los fijos', async () => {
    const about = await ok<AdminDoc>('GET', '/docs/about')
    const saved = await ok<AdminDoc>('PUT', '/docs/about', { fields: [{ name: 'hobby', type: 'string', value: 'Ajedrez', en: 'Chess' }, ...about.fields] })
    assert.equal(saved.fields.at(-1)?.name, 'hobby')
    assert.equal(valueOf(await publicDoc('about', 'en'), 'hobby'), 'Chess')
    await ok('PUT', '/docs/about', { fields: about.fields })
  })

  test('el PDF del CV pide los dos idiomas como /cv/<archivo>.pdf', async () => {
    const contact = await ok<AdminDoc>('GET', '/docs/contact')
    const bad = await admin<AdminErrorBody>('PUT', '/docs/contact', { fields: withField(contact, 'cv', { en: '/cv/cv.docx' }) })
    assert.deepEqual(bad.body.errors.map(e => e.path), ['fields.cv.en'])
    const { en: _en, ...withoutEn } = contact.fields.find(f => f.name === 'cv') as Field
    const kept = await ok<AdminDoc>('PUT', '/docs/contact', { fields: contact.fields.map(f => (f.name === 'cv' ? withoutEn : f)) })
    assert.equal(kept.fields.find(f => f.name === 'cv')?.en, '/cv/CV-EN-Mateo-Sonzogni-ATS.pdf')
  })

  test('un bloque requerido que falta en la base se crea al guardarlo', async () => {
    await sql(`UPDATE "Doc" SET fields = (SELECT jsonb_agg(f) FROM jsonb_array_elements(fields::jsonb) f WHERE f->>'name' <> 'time_zone') WHERE key = 'contact'`)
    const contact = await ok<AdminDoc>('GET', '/docs/contact')
    assert.deepEqual(contact.missing, ['time_zone'])
    await ok('PUT', '/docs/contact', { fields: contact.fields })
    const saved = await ok<AdminDoc>('PUT', '/docs/contact', { fields: [...contact.fields, { name: 'time_zone', type: 'string', value: 'America/Argentina/Buenos_Aires' }] })
    assert.deepEqual(saved.missing, [])
    assert.equal(saved.fields.findIndex(f => f.name === 'time_zone'), docSchemas.contact.blocks.findIndex(b => b.name === 'time_zone'))
  })

  test('el retrato se sube a _perfil y el sitio lo sirve en los dos idiomas', async () => {
    const wrong = await upload<AdminErrorBody>('/docs/about/portrait', { file: new Blob(['hola'], { type: 'text/plain' }) })
    assert.equal(wrong.status, 400)
    const first = await uploaded<AdminDoc>('/docs/about/portrait', { file: png(4, 5) })
    const src = String(valueOf(first, 'portrait'))
    written.add(src)
    assert.match(src, /^\/media\/projects\/_perfil\/retrato-[a-z0-9]+\.png$/)
    assert.equal(valueOf(await publicDoc('about', 'en'), 'portrait'), src)
    assert.equal(await served(src), 200)

    const second = await uploaded<AdminDoc>('/docs/about/portrait', { file: png(6, 7) })
    const next = String(valueOf(second, 'portrait'))
    written.add(next)
    assert.notEqual(next, src)
    assert.equal(existsSync(onDisk(src)), false, 'el retrato anterior de _perfil se borra')
    assert.equal(existsSync(onDisk('/media/profile/mateo-front.png')), true, 'el retrato versionado no se toca')
  })
})

describe('obras, métricas y media', () => {
  const projectId = async (slug: string) => {
    const row = (await ok<Row[]>('GET', '/projects')).find(p => p.slug === slug)
    assert.ok(row, `no está la obra ${slug}`)
    return row.id
  }

  test('guardar la-rucula sin cambios conserva los ids de sus métricas', async () => {
    const id = await projectId('la-rucula')
    const before = await ok<Row>('GET', `/projects/${id}`)
    const saved = await ok<Row>('PUT', `/projects/${id}`, projectBody(before))
    const ids = (row: Row) => (row['metrics'] as Row[]).map(m => [m['id'], m['key'], String(m['value'])])
    assert.deepEqual(ids(saved), ids(before))
    assert.equal(saved['sortOrder'], before['sortOrder'])
    // El admin actual no manda ids: la clave identifica la fila y tampoco se recrea.
    const body = projectBody(before)
    const legacy = await ok<Row>('PUT', `/projects/${id}`, { ...body, metrics: (body['metrics'] as Row[]).map(({ id: _id, ...m }) => m) })
    assert.deepEqual(ids(legacy), ids(before))
  })

  test('las métricas se mueven, se renombran y llevan su rótulo en inglés sin perder el id', async () => {
    const id = await projectId('la-rucula')
    const body = projectBody(await ok<Row>('GET', `/projects/${id}`))
    const metrics = body['metrics'] as Row[]
    const [a, b] = metrics
    assert.ok(a && b)
    const swapped = [{ ...b, key: a['key'] }, { ...a, key: b['key'] }, ...metrics.slice(2), { key: 'tiempoDeCarga', value: 2, label: 'Tiempo de carga', translations: { en: { label: 'Load time' } } }]
    const saved = await ok<Row>('PUT', `/projects/${id}`, { ...body, metrics: swapped })
    const rows = saved['metrics'] as Row[]
    assert.deepEqual(rows.slice(0, 2).map(m => [m['id'], m['key']]), [[b['id'], a['key']], [a['id'], b['key']]])
    assert.deepEqual(rows.map(m => m['order']), rows.map((_m, i) => i))

    const site = await call<Envelope<{ metrics: { key: string, label: string | null, untranslated: string[] }[] }>>('GET', '/api/projects/la-rucula?lang=en')
    const custom = site.body.data.metrics.find(m => m.key === 'tiempoDeCarga')
    assert.deepEqual([custom?.label, custom?.untranslated], ['Load time', []])

    const meta = await ok<AdminMeta>('GET', '/meta')
    assert.ok((meta.metricKeys.catalog.find(k => k.key === 'lcp')?.uses ?? 0) > 0)
    assert.deepEqual(meta.metricKeys.unlisted.find(k => k.key === 'tiempoDeCarga'), { key: 'tiempoDeCarga', label: 'Tiempo de carga', uses: 1 })

    const current = projectBody(await ok<Row>('GET', `/projects/${id}`))
    const last = current['metrics'] as Row[]
    const unlabeled = last.map(m => (m['key'] === 'tiempoDeCarga' ? { ...m, translations: { en: { label: '' } } } : m))
    await ok('PUT', `/projects/${id}`, { ...current, metrics: unlabeled })
    const pending = (await ok<AdminMeta>('GET', '/meta')).untranslated.find(r => r.collection === 'projects' && r.id === id)
    assert.ok(pending?.fields.includes(`metrics[${last.length - 1}].translations.en.label`), JSON.stringify(pending))
    const english = await call<Envelope<{ metrics: { key: string, untranslated: string[] }[] }>>('GET', '/api/projects/la-rucula?lang=en')
    assert.deepEqual(english.body.data.metrics.find(m => m.key === 'tiempoDeCarga')?.untranslated, ['label'])
  })

  test('la dirección de una obra no cambia al guardar y cambia con PATCH', async () => {
    const id = await projectId('barberpole')
    const body = projectBody(await ok<Row>('GET', `/projects/${id}`))
    const moved = await admin<AdminErrorBody>('PUT', `/projects/${id}`, { ...body, slug: 'otra-direccion' })
    assert.deepEqual(moved.body.errors.map(e => e.path), ['slug'])
    assert.equal((await ok<Row>('PATCH', `/projects/${id}/slug`, { slug: 'barberpole-turnos' })).slug, 'barberpole-turnos')
    assert.equal((await call('GET', '/api/projects/barberpole-turnos')).status, 200)
    assert.equal((await call('GET', '/api/projects/barberpole')).status, 404)
  })

  test('una obra nueva va al final; reemplazar su imagen conserva id, inglés y paso; borrarla limpia la carpeta', async () => {
    const all = await ok<Row[]>('GET', '/projects')
    const top = Math.max(...all.map(p => Number(p['sortOrder'])))
    const created = await ok<Row>('POST', '/projects', { title: 'Obra de prueba D2', year: 2026, role: 'Dev', status: 'WIP', summary: 'Una obra para probar' })
    assert.deepEqual([created.slug, created['sortOrder']], ['obra-de-prueba-d2', top + 1])

    const media = await uploaded<Row>('/media', { file: png(3, 2), projectId: String(created.id), alt: 'Captura', role: 'GALLERY' })
    written.add(String(media['src']))
    await ok('PATCH', `/media/${media.id}`, { en: { alt: 'Screenshot' }, tint: '#B97E46' })
    const body = projectBody(await ok<Row>('GET', `/projects/${created.id}`))
    await ok('PUT', `/projects/${created.id}`, { ...body, steps: [{ title: 'Paso', body: 'Texto', mediaId: media.id }] })

    const wrongKind = await upload<AdminErrorBody>(`/media/${media.id}/file`, { file: new Blob([Buffer.from('1a45dfa3', 'hex')], { type: 'video/webm' }) })
    assert.equal(wrongKind.status, 400)
    const replaced = await uploaded<Row & { translations: Row[] }>(`/media/${media.id}/file`, { file: png(8, 6) })
    written.add(String(replaced['src']))
    assert.deepEqual([replaced.id, replaced['width'], replaced['height'], replaced['tint']], [media.id, 8, 6, '#b97e46'])
    assert.equal(replaced.translations[0]?.['alt'], 'Screenshot')
    assert.equal(existsSync(onDisk(String(media['src']))), false, 'el archivo anterior se borra')
    assert.equal(await served(String(replaced['src'])), 200)
    const steps = (await ok<Row>('GET', `/projects/${created.id}`))['steps'] as Row[]
    assert.equal(steps[0]?.['mediaId'], media.id)

    const badTint = await admin<AdminErrorBody>('PATCH', `/media/${media.id}`, { tint: 'rojo' })
    assert.deepEqual(badTint.body.errors.map(e => e.path), ['tint'])

    assert.ok(folderFiles(created.slug).length > 0)
    await ok('DELETE', `/projects/${created.id}`)
    assert.equal(folderExists(created.slug), false, 'la carpeta vacía de la obra se borra')
    assert.equal(folderExists('_perfil'), true, '_perfil nunca se borra')
  })
})
