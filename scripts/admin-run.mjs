#!/usr/bin/env node
/**
 * Corre un comando contra una API del admin propia y descartable: nunca contra la base de trabajo.
 *
 *   node scripts/admin-run.mjs [--eros-mock] [--demo] [--web] -- <comando…>
 *
 * 1. Copia la base (scripts/admin-db.mjs) a portfolio_admin_<x> y le aplica las migraciones pendientes.
 * 2. Levanta la API en un puerto libre entre 3940 y 3990 con un ADMIN_TOKEN al azar (no se imprime),
 *    HUNTER_API_URL=http://127.0.0.1:9 y EROS_API_KEY=offline: Eros real nunca. ARTICLES_WEEKLY=off:
 *    el artículo de los lunes no se pide solo.
 *    --eros-mock  arranca tests/admin/eros-mock.ts en otro puerto libre y apunta HUNTER_API_URL ahí.
 *    --demo       suma EROS_DEMO=1 (la muestra de vacantes de la API de pruebas).
 *    --web        compila Nuxt con NUXT_PUBLIC_API_BASE a esa API y lo sirve en otro puerto (ADMIN_WEB_URL).
 * 3. Corre el comando con ADMIN_API_URL (origen de la API, sin /api), PW_ADMIN_TOKEN y ADMIN_DATABASE_URL.
 * 4. Al terminar, bien o mal, apaga todo y borra la copia. Sale con el código del comando.
 */
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { copyUrl, createCopy, dropCopy } from './admin-db.mjs'

const PORTS = [3940, 3990]
const argv = process.argv.slice(2)
const split = argv.indexOf('--')
const flags = new Set(split === -1 ? argv : argv.slice(0, split))
const command = split === -1 ? [] : argv.slice(split + 1)
const shell = process.platform === 'win32'

if (!command.length) {
  console.error('Uso: node scripts/admin-run.mjs [--eros-mock] [--demo] [--web] -- <comando…>')
  process.exit(2)
}
for (const flag of flags) {
  if (!['--eros-mock', '--demo', '--web'].includes(flag)) {
    console.error(`admin-run: opción desconocida ${flag}`)
    process.exit(2)
  }
}

const taken = new Set()

function tryHost(port, host) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', err => resolve(err.code === 'EAFNOSUPPORT' || err.code === 'EADDRNOTAVAIL'))
    server.listen({ port, host, exclusive: true }, () => server.close(() => resolve(true)))
  })
}

/**
 * Libre en los tres: la API escucha en 0.0.0.0 (server/src/index.ts), pero `localhost` puede resolver
 * a ::1 y caer en otro proceso que tenga el mismo puerto en `::` (en Windows no chocan). Sin IPv6, `::`
 * no cuenta.
 */
async function tryPort(port) {
  for (const host of ['0.0.0.0', '::', '127.0.0.1']) {
    if (!await tryHost(port, host)) return false
  }
  return true
}

async function freePort() {
  for (let port = PORTS[0]; port <= PORTS[1]; port++) {
    if (taken.has(port)) continue
    if (await tryPort(port)) {
      taken.add(port)
      return port
    }
  }
  throw new Error(`No hay puertos libres entre ${PORTS[0]} y ${PORTS[1]}.`)
}

const children = []

function start(name, cmd, args, env) {
  const child = spawn(cmd, args, { shell, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'], detached: !shell })
  const prefix = `[${name}] `
  const relay = stream => chunk => stream.write(String(chunk).split(/\r?\n/).filter(Boolean).map(l => `${prefix}${l}\n`).join(''))
  child.stdout.on('data', relay(process.stdout))
  child.stderr.on('data', relay(process.stderr))
  children.push(child)
  return child
}

function stop(child) {
  if (child.exitCode !== null || child.pid === undefined) return
  if (shell) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else {
    try {
      process.kill(-child.pid, 'SIGTERM')
    }
    catch {
      child.kill('SIGTERM')
    }
  }
}

/** Espera a que `url` responda, o falla si el proceso se cae antes. */
async function ready(url, child, seconds) {
  for (let i = 0; i < seconds * 4; i++) {
    if (child.exitCode !== null) throw new Error(`${url} no arrancó (el proceso terminó con ${child.exitCode}).`)
    const ok = await fetch(url).then(r => r.status < 500, () => false)
    if (ok) return
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error(`${url} no respondió en ${seconds} s.`)
}

function run(cmd, args, env) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell, stdio: 'inherit', env: { ...process.env, ...env } })
    child.on('exit', code => resolve(code ?? 1))
    child.on('error', () => resolve(1))
  })
}

let database = null
let cleaned = false

function cleanup() {
  if (cleaned) return
  cleaned = true
  for (const child of children.reverse()) stop(child)
  if (database) {
    try {
      dropCopy(database)
    }
    catch (err) {
      console.error(`admin-run: no pude borrar ${database}: ${err instanceof Error ? err.message : err}`)
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    cleanup()
    process.exit(130)
  })
}

let status
try {
  database = createCopy(`run_${randomBytes(4).toString('hex')}`)
  const databaseUrl = copyUrl(database)
  // El origen puede ir atrás de las migraciones de esta rama: la copia queda al día antes de levantar la API.
  if (await run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], { DATABASE_URL: databaseUrl }) !== 0) {
    throw new Error('No pude aplicar las migraciones a la copia.')
  }
  const token = randomBytes(24).toString('hex')
  const apiPort = await freePort()
  const api = `http://localhost:${apiPort}`
  let hunter = 'http://127.0.0.1:9'

  if (flags.has('--eros-mock')) {
    if (!existsSync('tests/admin/eros-mock.ts')) throw new Error('--eros-mock necesita tests/admin/eros-mock.ts.')
    const mockPort = await freePort()
    hunter = `http://127.0.0.1:${mockPort}`
    const mock = start('eros-mock', 'pnpm', ['exec', 'tsx', 'tests/admin/eros-mock.ts'], { PORT: String(mockPort), EROS_MOCK_PORT: String(mockPort) })
    await ready(`${hunter}/`, mock, 30)
  }

  const apiEnv = {
    DATABASE_URL: databaseUrl,
    API_PORT: String(apiPort),
    PORT: String(apiPort),
    ADMIN_TOKEN: token,
    HUNTER_API_URL: hunter,
    EROS_API_KEY: 'offline',
    // El artículo de los lunes nunca corre en una prueba: pediría uno por su cuenta.
    ARTICLES_WEEKLY: 'off',
    CORS_ORIGIN: api,
    ...(flags.has('--demo') ? { EROS_DEMO: '1' } : {}),
  }
  const apiChild = start('api', 'pnpm', ['exec', 'tsx', 'server/src/index.ts'], apiEnv)
  await ready(`${api}/api/live`, apiChild, 60)

  const childEnv = { ADMIN_API_URL: api, PW_ADMIN_TOKEN: token, ADMIN_DATABASE_URL: databaseUrl, HUNTER_API_URL: hunter }
  if (flags.has('--web')) {
    const webPort = await freePort()
    const web = `http://localhost:${webPort}`
    const built = await run('pnpm', ['build'], { NUXT_PUBLIC_API_BASE: `${api}/api`, NUXT_PUBLIC_SITE_URL: web })
    if (built !== 0) throw new Error('El build de Nuxt falló.')
    const webChild = start('web', 'node', ['.output/server/index.mjs'], { PORT: String(webPort), NUXT_PUBLIC_API_BASE: `${api}/api`, NUXT_PUBLIC_SITE_URL: web })
    await ready(web, webChild, 60)
    childEnv.ADMIN_WEB_URL = web
  }

  console.log(`admin-run: API en ${api} sobre ${database}${childEnv.ADMIN_WEB_URL ? `, sitio en ${childEnv.ADMIN_WEB_URL}` : ''}`)
  status = await run(command[0], command.slice(1), childEnv)
}
catch (err) {
  console.error(`admin-run: ${err instanceof Error ? err.message : err}`)
  status = 1
}
finally {
  cleanup()
}
process.exit(status)
