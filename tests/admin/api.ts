/**
 * Cliente mínimo para las pruebas de la API del admin. Las corre scripts/admin-run.mjs, que levanta
 * una API sobre una copia de la base y deja ADMIN_API_URL y PW_ADMIN_TOKEN en el entorno.
 */
import assert from 'node:assert/strict'

const base = process.env['ADMIN_API_URL']
const token = process.env['PW_ADMIN_TOKEN']

if (!base || !token) {
  throw new Error('Faltan ADMIN_API_URL y PW_ADMIN_TOKEN: correr con node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/<archivo>')
}

export interface Reply<T> {
  status: number
  body: T
}

/** Pedido a la API (con el token si la ruta es del admin). `path` empieza con /api o con /admin. */
export async function call<T = unknown>(method: string, path: string, body?: unknown): Promise<Reply<T>> {
  const headers: Record<string, string> = {}
  if (path.startsWith('/api/admin')) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let parsed: unknown = text
  try {
    parsed = text ? JSON.parse(text) : null
  }
  catch {
    // No es JSON (un archivo estático): queda el texto.
  }
  return { status: res.status, body: parsed as T }
}

export const admin = <T = unknown>(method: string, path: string, body?: unknown) => call<T>(method, `/api/admin${path}`, body)

/** Pedido que tiene que salir bien: falla la prueba con el cuerpo de la respuesta si no. */
export async function ok<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const reply = await admin<T>(method, path, body)
  assert.ok(reply.status < 400, `${method} ${path} → ${reply.status} ${JSON.stringify(reply.body)}`)
  return reply.body
}

/** Lo que no puede aparecer en un mensaje para quien edita: jerga de tipos y el formato viejo. */
export const JARGON = /string|ISO|campo "|boolean|integer|null|undefined|enum/i
