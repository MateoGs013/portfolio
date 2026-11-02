/**
 * Piezas de las pruebas de datos del admin (api-datos.test.ts): subidas multipart, imágenes mínimas,
 * el body de un PUT de obra armado con su GET, y acceso directo a la copia de la base y al disco.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { UPLOAD_DIR, inDir } from '../../server/src/mediaDirs.js'
import type { Reply } from './api.js'

const base = process.env['ADMIN_API_URL'] ?? ''
const token = process.env['PW_ADMIN_TOKEN'] ?? ''

/** PNG de 1×1 válido. `png(w, h)` cambia el tamaño que declara la cabecera (lo que lee el servidor). */
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

export function png(width = 1, height = 1): Blob {
  const buf = Buffer.from(PNG_1X1)
  buf.writeUInt32BE(width, 16)
  buf.writeUInt32BE(height, 20)
  return new Blob([buf], { type: 'image/png' })
}

/** POST multipart al admin: los Blob van como archivos y el resto como campos de texto. */
export async function upload<T = unknown>(route: string, parts: Record<string, Blob | string>): Promise<Reply<T>> {
  const form = new FormData()
  for (const [name, value] of Object.entries(parts)) {
    if (typeof value === 'string') form.append(name, value)
    else form.append(name, value, `${name}.${value.type.split('/')[1] ?? 'bin'}`)
  }
  const res = await fetch(`${base}/api/admin${route}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  const text = await res.text()
  return { status: res.status, body: (text ? JSON.parse(text) : null) as T }
}

export async function uploaded<T = unknown>(route: string, parts: Record<string, Blob | string>): Promise<T> {
  const reply = await upload<T>(route, parts)
  assert.ok(reply.status < 400, `POST ${route} → ${reply.status} ${JSON.stringify(reply.body)}`)
  return reply.body
}

/** Un archivo público de la API: el estado de GET /media/… */
export async function served(src: string): Promise<number> {
  return (await fetch(`${base}${src}`)).status
}

/** Ruta en el disco de un archivo `/media/projects/…` que escribe la API (corre en esta carpeta). */
/** Dónde está en disco: lo subido en UPLOAD_DIR (MEDIA_UPLOAD_DIR, mediaDirs.ts), lo demás bajo public/. */
export const onDisk = (src: string) => inDir(UPLOAD_DIR, src) ?? path.resolve('public', '.' + src)

export function folderFiles(folder: string): string[] {
  const dir = path.resolve(UPLOAD_DIR, folder)
  return existsSync(dir) ? readdirSync(dir) : []
}

/** Borra lo que las pruebas dejaron en el disco y no está versionado. */
export function removeFiles(srcs: Iterable<string>): void {
  for (const src of srcs) rmSync(onDisk(src), { force: true })
}

/** Borra la carpeta si quedó vacía (la que creó una prueba). */
export function removeEmptyFolder(folder: string): void {
  if (folderExists(folder) && folderFiles(folder).length === 0) rmSync(path.resolve(UPLOAD_DIR, folder), { recursive: true })
}

export function folderExists(folder: string): boolean {
  return existsSync(path.resolve(UPLOAD_DIR, folder))
}

/** Una consulta directa a la copia de la base de esta corrida (para dejarla sin un bloque, por ejemplo). */
export async function sql(text: string, values: unknown[] = []): Promise<pg.QueryResult> {
  const client = new pg.Client({ connectionString: process.env['ADMIN_DATABASE_URL'] })
  await client.connect()
  try {
    return await client.query(text, values)
  }
  finally {
    await client.end()
  }
}

type Row = Record<string, unknown>
type English = { translations?: Row[] }

const englishOf = (row: English) => row.translations?.[0] ?? null
const en = (row: English, keys: string[]) => {
  const found = englishOf(row)
  return found ? { translations: { en: Object.fromEntries(keys.map(k => [k, found[k] ?? null])) } } : {}
}

/** El body de PUT /projects/:id armado con lo que devolvió GET /projects/:id (ida y vuelta sin cambios). */
export function projectBody(row: Row): Row {
  const keys = ['slug', 'title', 'year', 'role', 'status', 'featured', 'summary', 'brief', 'outcome', 'url', 'repo', 'sortOrder', 'publishedAt', 'orgId']
  const list = (k: string) => row[k] as (Row & English)[]
  return {
    ...Object.fromEntries(keys.map(k => [k, row[k]])),
    ...en(row as English, ['title', 'role', 'summary', 'brief', 'outcome']),
    techIds: list('techs').map(t => t['id']),
    links: list('links').map(l => ({ id: l['id'], label: l['label'], url: l['url'], ...en(l, ['label']) })),
    steps: list('steps').map(s => ({ id: s['id'], title: s['title'], body: s['body'], mediaId: s['mediaId'], ...en(s, ['title', 'body']) })),
    metrics: list('metrics').map(m => ({
      id: m['id'], key: m['key'], value: m['value'], items: m['items'], unit: m['unit'], label: m['label'],
      source: m['source'], measuredAt: m['measuredAt'], ...en(m, ['label']),
    })),
  }
}

/** Nombres de bloque que el código lee de about y contact: docText/docValue/docList y los mapas del CV. */
export function consumedDocNames(): Set<string> {
  const files = [
    ...walk('app', /\.(vue|ts)$/),
    ...walk('server/src', /\.ts$/).filter(f => !f.includes(`${path.sep}seed${path.sep}`) && !f.includes(`${path.sep}patches${path.sep}`)),
  ]
  const names = new Set<string>()
  const patterns = [
    /doc(?:Text|Value|List)\([^,()]+,\s*'([a-z_]+)'/g,
    // Los mapas de content/cv.ts: `  email: ['contact', 'email'],`
    /^\s+\w+: \['(?:about|contact)', '([a-z_]+)'\],$/gm,
    /\{ field: '([a-z_]+)'/g,
    /(?:about|contact)\.get\('([a-z_]+)'\)/g,
  ]
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    for (const pattern of patterns) for (const match of source.matchAll(pattern)) if (match[1]) names.add(match[1])
  }
  return names
}

function walk(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name.startsWith('.') ? [] : walk(full, pattern)
    return pattern.test(entry.name) ? [full] : []
  })
}
