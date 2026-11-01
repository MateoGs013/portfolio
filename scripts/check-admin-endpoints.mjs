#!/usr/bin/env node
/**
 * Los endpoints de /api/admin en tres lugares que tienen que decir lo mismo:
 *   1. lo montado: server/src/admin/router.ts y los routers que monta, leídos del código;
 *   2. lo documentado: la tabla «Inventario de endpoints» de docs/admin.md, con sus apartados
 *      «Sin uso en la UI» (montados a propósito, con el motivo) y «Retirados» (ya no existen);
 *   3. lo usado: las llamadas a `api.*` y las direcciones de server/admin/src.
 * Falla si una ruta montada no está documentada, si una documentada no existe, si una retirada
 * sigue montada, si una montada no tiene uso en la UI ni figura sin uso, si la UI llama a una ruta
 * que no existe o si la fila nombra un archivo de la UI que no está. Lo corre `pnpm lint`
 * (scripts/admin-checks.mjs).
 *
 * La lectura del código (comentarios, literales y regex fuera) vive en scripts/admin-endpoints-code.mjs.
 *
 * Uso: node scripts/check-admin-endpoints.mjs [--list]   (--list imprime lo montado y lo usado)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { literalAt, mask, splitArgs, untilClose } from './admin-endpoints-code.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API_DIR = path.join(root, 'server/src/admin')
const UI_DIR = path.join(root, 'server/admin/src')
const DOC = path.join(root, 'docs/admin.md')
const METHODS = ['get', 'post', 'put', 'patch', 'delete']
const rel = file => path.relative(root, file).replaceAll('\\', '/')
/** Rutas montadas cuya dirección no se pudo leer (una variable, una regex). */
const unreadable = []

// ── Lo montado ──────────────────────────────────────────────────────────────────────────────

function mounted() {
  const routers = new Map()
  for (const name of readdirSync(API_DIR).filter(f => f.endsWith('.ts'))) {
    const { code, literals } = mask(readFileSync(path.join(API_DIR, name), 'utf8'))
    for (const [, id] of code.matchAll(/\b(?:export\s+)?const\s+(\w+)\s*=\s*Router\(\)/g)) {
      routers.set(id, { file: name, routes: [], children: [], unreadable: [] })
    }
    for (const [id, router] of routers) {
      if (router.file !== name) continue
      for (const call of code.matchAll(new RegExp(`\\b${id}\\.(${METHODS.join('|')}|use)\\(`, 'g'))) {
        const args = splitArgs(untilClose(code, call.index + call[0].length))
        const first = literals[literalAt(args[0] ?? '')]
        if (call[1] === 'use') {
          const prefix = first?.kind === 'string' ? first.value : ''
          for (const arg of first ? args.slice(1) : args) router.children.push({ prefix, id: arg })
        }
        else {
          // Un string o una lista de strings (Express acepta las dos); cualquier otra cosa no se
          // puede leer y se informa, para que una ruta no se escape del chequeo.
          const where = `${name}:${code.slice(0, call.index).split('\n').length}`
          const paths = first?.kind === 'string'
            ? [first.value]
            : /^\[[\s\0\d,]*\]$/.test(args[0] ?? '')
              ? [...args[0].matchAll(/\0(\d+)\0/g)].map(m => literals[m[1]]).filter(l => l.kind === 'string').map(l => l.value)
              : []
          if (!paths.length) router.unreadable.push(`${where}: ${id}.${call[1]}() con una dirección que no es un texto fijo`)
          for (const p of paths) router.routes.push({ method: call[1].toUpperCase(), path: p, where })
        }
      }
    }
  }
  const out = []
  const walk = (id, prefix, seen) => {
    const router = routers.get(id)
    if (!router || seen.has(id)) return
    unreadable.push(...router.unreadable)
    for (const r of router.routes) out.push({ ...r, path: `${prefix}${r.path}`.replace(/\/$/, '') || '/' })
    for (const child of router.children) walk(child.id, `${prefix}${child.prefix}`, new Set([...seen, id]))
  }
  walk('adminApi', '', new Set())
  if (!out.length) throw new Error('no se encontró ninguna ruta debajo de adminApi en server/src/admin/router.ts')
  return out
}

// ── Lo documentado ──────────────────────────────────────────────────────────────────────────

function documented() {
  const rows = []
  let inInventory = false
  let group = 'used'
  readFileSync(DOC, 'utf8').split(/\r?\n/).forEach((line, index) => {
    const heading = /^(#{2,4})\s+(.*)$/.exec(line)
    if (heading) {
      if (heading[1] === '##') inInventory = /Inventario de endpoints/i.test(heading[2])
      if (inInventory) group = /Retirados/i.test(heading[2]) ? 'retired' : /Sin uso en la UI/i.test(heading[2]) ? 'unused' : 'used'
      return
    }
    const row = inInventory && /^\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|\s*`([^`]+)`\s*\|(.*)\|\s*$/.exec(line)
    if (!row) return
    // Solo las rutas en uso nombran dónde las llama la UI (la última columna).
    const where = group === 'used' ? (row[3].split('|').at(-1) ?? '') : ''
    const files = [...where.matchAll(/`([^`]+\.(?:ts|vue))`/g)].map(m => m[1])
    rows.push({ method: row[1], path: row[2].trim(), group, files, line: index + 1 })
  })
  if (!rows.length) throw new Error('docs/admin.md no tiene la tabla «Inventario de endpoints»')
  return rows
}

// ── Lo usado ────────────────────────────────────────────────────────────────────────────────

function sources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sources(full)
    if (name.endsWith('.ts')) return [{ file: full, text: readFileSync(full, 'utf8') }]
    if (name.endsWith('.vue')) {
      const scripts = [...readFileSync(full, 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
      return [{ file: full, text: scripts.map(m => m[1]).join('\n') }]
    }
    return []
  })
}

/**
 * Las llamadas de la UI como { method, path, file, generic }. Se leen tres formas: `api.<método>(…)`
 * con su primer argumento resuelto (literales, constantes y funciones locales que arman la ruta, y
 * `<x>Model.path`), `slugEndpoint: id => …` (lo usa SlugDialog con PATCH) y las direcciones
 * `/api/admin/…` que se abren en un iframe o en otra pestaña (GET con ticket). `generic` marca la ruta
 * de un modelo cualquiera (`model.path` en el marco común), que se expande a todos los modelos.
 */
function used(apiSegments) {
  const files = sources(UI_DIR)
  const models = new Map()
  for (const { text } of files) {
    const name = /export const (\w+Model)\b/.exec(text)?.[1]
    const own = /^\s*path:\s*'([^']+)'/m.exec(text)?.[1]
    if (name && own) models.set(name, own)
  }
  const out = []
  for (const { file, text } of files) {
    const { code, literals } = mask(text)
    const helpers = new Map()
    const consts = new Map()
    for (const h of code.matchAll(/const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\0(\d+)\0/g)) {
      const params = h[2].split(',').map(p => p.trim().split(/[\s:=]/)[0]).filter(Boolean)
      helpers.set(h[1], { params, literal: literals[h[3]] })
    }
    for (const c of code.matchAll(/const\s+(\w+)\s*=\s*\0(\d+)\0/g)) consts.set(c[1], literals[c[2]])
    let generic = false
    const resolve = (expr, args = new Map()) => {
      const text = expr.trim()
      const id = literalAt(text)
      if (id !== undefined) return expand(literals[id], args)
      if (args.has(text)) return [args.get(text)]
      if (consts.has(text)) return expand(consts.get(text), args)
      const model = /^(?:props\.)?(\w+)\.path$/.exec(text)?.[1]
      if (model && models.has(model)) return [models.get(model)]
      if (model) {
        generic = true
        return [...models.values()]
      }
      const call = /^(\w+)\(([\s\S]*)\)$/.exec(text)
      const helper = call && helpers.get(call[1])
      if (!helper) return null
      const given = splitArgs(call[2])
      const bound = new Map(helper.params.map((p, i) => [p, given[i] ? (resolve(given[i], args)?.[0] ?? ':p') : '']))
      return expand(helper.literal, bound)
    }
    const expand = (literal, args) => {
      if (literal.kind === 'string') return [literal.value]
      let options = [literal.parts[0]]
      literal.exprs.forEach((expr, i) => {
        const inner = args.has(expr.trim()) ? [args.get(expr.trim())] : (resolve(expr) ?? [':p'])
        options = options.flatMap(o => inner.map(v => `${o}${v}${literal.parts[i + 1]}`))
      })
      return options
    }
    const push = (method, paths) => {
      for (const p of paths ?? []) out.push({ method, path: p, file: rel(file), generic })
      generic = false
    }
    for (const call of code.matchAll(new RegExp(`\\bapi\\.(${METHODS.join('|')})\\s*(?:<[^()]*?>)?\\(`, 'g'))) {
      const [first] = splitArgs(untilClose(code, call.index + call[0].length))
      if (first) push(call[1].toUpperCase(), resolve(first))
    }
    for (const s of code.matchAll(/slugEndpoint:\s*\(?\s*(\w+)\s*\)?\s*=>\s*\0(\d+)\0/g)) {
      push('PATCH', expand(literals[s[2]], new Map([[s[1], ':p']])))
    }
    for (const literal of literals) {
      const head = literal.kind === 'string' ? literal.value : literal.parts[0]
      if (head.startsWith('/api/admin/') || (head === '/api/admin' && literal.kind === 'template')) push('GET', expand(literal, new Map()))
    }
  }
  const clean = p => p.replace(/^\/api\/admin(?=\/)/, '').split('?')[0].split('/').map(s => (s.includes(':p') ? ':p' : s)).join('/')
  return out
    .map(u => ({ ...u, path: clean(u.path) }))
    .filter(u => u.path.startsWith('/') && apiSegments.has(u.path.split('/')[1]))
}

// ── Comparación ─────────────────────────────────────────────────────────────────────────────

const key = (method, p) => `${method} ${p.replace(/:\w+/g, ':')}`
const matches = (route, usage) => {
  const a = route.split('/')
  const b = usage.split('/')
  return a.length === b.length && a.every((s, i) => (s.startsWith(':') ? b[i] !== '' : s === b[i]))
}
const isUsed = (route, usages) => usages.some(u => u.method === route.method && matches(route.path, u.path))

const routes = mounted()
const usages = used(new Set(routes.map(r => r.path.split('/')[1])))
if (process.argv.includes('--list')) {
  console.log('Montadas:')
  for (const r of routes) console.log(`  ${r.method.padEnd(6)} ${r.path}${isUsed(r, usages) ? '' : '  (sin uso en la UI)'}`)
  console.log('Usos en la UI:')
  for (const u of usages) console.log(`  ${u.method.padEnd(6)} ${u.path}  ${u.file}`)
}
const docs = documented()
const problems = [...unreadable]

const docByKey = new Map()
for (const d of docs) {
  const k = key(d.method, d.path)
  if (docByKey.has(k)) problems.push(`docs/admin.md:${d.line}: ${d.method} ${d.path} está dos veces en el inventario`)
  docByKey.set(k, d)
}
const routeKeys = new Set(routes.map(r => key(r.method, r.path)))

for (const r of routes) {
  const d = docByKey.get(key(r.method, r.path))
  const inUi = isUsed(r, usages)
  if (!d) problems.push(`${r.method} ${r.path} (${r.where}): está montada y docs/admin.md no la documenta`)
  else if (d.group === 'retired') problems.push(`${r.method} ${r.path} (${r.where}): figura como retirada y sigue montada`)
  else if (d.group === 'used' && !inUi) problems.push(`${r.method} ${r.path} (${r.where}): la UI no la usa; pasala a «Sin uso en la UI» con el motivo o retirala`)
  else if (d.group === 'unused' && inUi) problems.push(`${r.method} ${r.path} (${r.where}): figura sin uso en la UI y la UI la usa; pasala al inventario`)
}
for (const d of docs) {
  if (d.group !== 'retired' && !routeKeys.has(key(d.method, d.path))) {
    problems.push(`docs/admin.md:${d.line}: ${d.method} ${d.path} está documentada y no está montada`)
  }
  if (d.group === 'used' && !d.files.length) problems.push(`docs/admin.md:${d.line}: ${d.method} ${d.path} no dice dónde la usa la UI`)
  for (const f of d.files.filter(f => !existsSync(path.join(UI_DIR, f)))) {
    problems.push(`docs/admin.md:${d.line}: ${f} no existe en server/admin/src`)
  }
}
for (const u of usages.filter(u => !u.generic)) {
  if (!routes.some(r => r.method === u.method && matches(r.path, u.path))) {
    problems.push(`${u.file}: llama a ${u.method} ${u.path}, que no está montada`)
  }
}

if (problems.length) {
  console.error(`check-admin-endpoints: ${problems.length} problema(s)`)
  for (const p of [...new Set(problems)]) console.error(`  ${p}`)
  process.exit(1)
}
const unused = docs.filter(d => d.group === 'unused').length
const retired = docs.filter(d => d.group === 'retired').length
console.log(`check-admin-endpoints: ${routes.length} rutas montadas y documentadas (${unused} sin uso en la UI, con su motivo), ${retired} retiradas.`)
