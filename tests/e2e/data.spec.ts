import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, test } from '@playwright/test'
import { api } from './support'

/**
 * Cero contenido escrito a mano (decisión 5): nombres, ubicaciones, cifras, obras y enlaces salen de
 * la API; la interfaz, del diccionario. Junta en un lugar los grep de aceptación de cada paquete del
 * rediseño (F1, F3, F6, P1–P4) y los valores reales de la base, y suma dos reglas del sitio: ningún
 * componente escribe HTML crudo y no hay emojis ni en el sitio ni en el admin.
 */
const ROOT = process.cwd()

function files(dir: string, ext = /\.(vue|ts|js|mjs|css|html)$/): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return files(path, ext)
    return ext.test(entry.name) ? [path] : []
  })
}

const read = (file: string) => readFileSync(join(ROOT, file), 'utf8')

/** Los archivos de `scope` que contienen algún literal, con el literal. */
function offenders(scope: string[], literals: string[], skip: (file: string) => boolean = () => false) {
  return scope.filter(file => !skip(file)).flatMap((file) => {
    const text = read(file)
    return literals.filter(literal => text.includes(literal)).map(literal => `${relative(ROOT, join(ROOT, file))}: ${literal}`)
  })
}

const APP = [...files('app'), 'nuxt.config.ts']
const inCv = (file: string) => /app[\\/]components[\\/]cv[\\/]/.test(file)
const under = (dir: string) => files(dir)

test.describe('literales prohibidos', () => {
  test('en app/ y nuxt.config.ts (F1)', () => {
    const literals = ['Paraná', 'Río Negro', 'Cádiz', 'mateogabus', '382', 'Lighthouse', 'PostgreSQL 17', 'null-net', 'lampone', 'github.com/MateoGs013', 'linkedin.com/in']
    expect(offenders(APP, literals, inCv)).toEqual([])
  })

  test('en el visor del CV (F6)', () => {
    const literals = ['Río Negro', 'Buenos Aires', 'Cádiz', 'Escuela', 'CET', '2017', '2026', 'Docker', 'Remoto / Híbrido', '@gmail']
    expect(offenders(under('app/components/cv'), literals)).toEqual([])
  })

  test('ningún componente solo para el Hiperfoco (X1): es el modo Focus existente, no uno paralelo', () => {
    expect(offenders(under('app/components'), ['v-if="isHyperfocus'])).toEqual([])
  })

  test('en el cromo del sitio (F3): ningún email, ubicación ni perfil escritos a mano', () => {
    expect(offenders(under('app/components/site'), ['@', 'Río Negro', 'github.com'])).toEqual([])
  })

  test('en el caso (P3) y en sobre mí (P4)', () => {
    expect(offenders(under('app/components/case'), ['PostgreSQL', 'Lighthouse', 'EROS CORE', '382', 'PARANÁ'])).toEqual([])
    expect(offenders(under('app/components/about'), ['Da Vinci', 'CET', 'Río Negro', 'Español', 'B2'])).toEqual([])
  })

  test('en el inicio y la obra (P1, P2): ni las obras ni el nombre', async ({ request }) => {
    const works = await api<{ slug: string, title: string }[]>(request, '/projects')
    expect(works.length).toBe(6)
    const home = [...under('app/components/home'), 'app/pages/index.vue']
    expect(offenders(home, [...works.map(w => w.title), ...works.map(w => w.slug), 'Mateo', 'Sonzogni'])).toEqual([])
    expect(offenders(under('app/components/work'), works.map(w => w.slug))).toEqual([])
  })

  test('ningún valor de about ni de contact está copiado en app/', async ({ request }) => {
    // cv es una ruta de public/cv que nuxt.config.ts redirige a propósito (las URL sin -ATS).
    const values: string[] = []
    for (const key of ['about', 'contact'] as const) {
      for (const lang of ['es', 'en'] as const) {
        const doc = await api<{ fields: { name: string, value: string | string[] }[] }>(request, `/docs/${key}?lang=${lang}`)
        for (const field of doc.fields) {
          if (field.name === 'cv') continue
          values.push(...[field.value].flat().filter(v => v.length >= 8))
        }
      }
    }
    expect(values.length).toBeGreaterThan(10)
    expect(offenders(APP, [...new Set(values)])).toEqual([])
  })
})

test('ningún componente escribe HTML crudo', () => {
  expect(offenders(under('app/components'), ['innerHTML', 'v-html', 'outerHTML'])).toEqual([])
})

test('sin emojis en el sitio ni en el admin (invariante 5)', () => {
  const emoji = /\p{Extended_Pictographic}/u
  const scope = [...files('app'), ...files('server/admin')].filter(file => !file.endsWith('admin.css'))
  const found = scope.flatMap(file => read(file).split('\n').flatMap((line, i) => {
    const hit = line.match(emoji)
    return hit ? [`${relative(ROOT, join(ROOT, file))}:${i + 1} ${hit[0]}`] : []
  }))
  expect(found).toEqual([])
})
