#!/usr/bin/env node
/**
 * `pnpm test:e2e`: la suite entera contra el build de producción (playwright.config.ts).
 *
 * La API pública admite 300 pedidos cada 15 minutos por IP, y el SSR le pide todo desde la misma IP:
 * la suite completa pasa de largo ese número. Por eso compila una sola vez y corre cada spec de cada
 * proyecto en su propia invocación de Playwright, que levanta una API nueva (con el contador en cero)
 * y la apaga al terminar.
 *
 * Uso: `pnpm test:e2e [filtros de archivo] [opciones]`. Los filtros y las opciones (`--grep …`,
 * `-g …`, `--project=…`) se pasan a Playwright; si no queda ningún test, sale con error. Con
 * PLAYWRIGHT_BASE_URL no se levanta nada: corre una sola vez contra ese sitio, y reiniciar su API
 * entre specs largas queda a cargo de quien lo levantó.
 *
 * El SSR reenvía el X-Forwarded-For del visitante (useApi): en producción cada visitante tiene su
 * balde. Acá todo sale de 127.0.0.1, así que la suite sigue necesitando una API nueva por corrida.
 *
 * El admin nuevo va aparte, sin tocar la base de trabajo: cada tests/e2e/admin-*.spec.ts corre con
 * `node scripts/admin-run.mjs <flags> -- pnpm exec playwright test -c playwright.admin.config.ts <spec>`,
 * y cada tests/admin/*.test.ts con `node scripts/admin-run.mjs <flags> -- pnpm tsx --test <archivo>`.
 * Los flags (--demo, --eros-mock, --web) los declara el archivo en líneas `admin-run: …` de su
 * cabecera, una por corrida: `admin-run: sin Eros` (sin flags) más `admin-run: --eros-mock` lo corren
 * dos veces. Sin ninguna línea corre una vez, sin flags. Los filtros de archivo eligen también entre
 * estos. Antes se compila el admin (pnpm build:admin, salvo con PW_SKIP_BUILD) y al final se comprueba
 * que no quedó ninguna copia de la base ni nada escuchando en los puertos de admin-run.
 */
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { createConnection, createServer } from 'node:net'
import { listCopies } from '../../scripts/admin-db.mjs'

const args = process.argv.slice(2)
const webPort = process.env.PW_WEB_PORT || '3000'
const apiPort = process.env.PW_API_PORT || '3001'
const shell = process.platform === 'win32'

function run(command, commandArgs, env = {}) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', shell, env: { ...process.env, ...env } })
  return result.status ?? 1
}

/** Filtros de archivo (lo que no es opción ni valor de una opción), como los toma Playwright. */
function fileFilters() {
  const out = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('-')) {
      if (!arg.includes('=') && WITH_VALUE.has(arg)) i++
      continue
    }
    out.push(arg)
  }
  return out
}

const matches = (file, filters) => !filters.length || filters.some((f) => {
  try {
    return new RegExp(f).test(file)
  }
  catch {
    return file.includes(f)
  }
})

/**
 * Las corridas que un archivo declara en su cabecera, una por línea `admin-run: …` con sus flags
 * (`admin-run: --demo --web`; `admin-run: sin Eros` es una corrida sin flags). Sin líneas, una sin flags.
 */
function declaredRuns(file) {
  const head = readFileSync(file, 'utf8').split(/\r?\n/).slice(0, 40)
  const runs = head
    .map(line => line.match(/^\s*\*?\s*admin-run:(.*)$/))
    .filter(Boolean)
    .map(match => match[1].match(/--[a-z-]+/g) ?? [])
  return runs.length ? runs : [[]]
}

/** Corridas del admin nuevo: specs con su config y pruebas de API con node --test. */
function adminRuns() {
  const filters = fileFilters()
  const specs = readdirSync('tests/e2e')
    .filter(f => /^admin-.+\.spec\.ts$/.test(f))
    .map(f => `tests/e2e/${f}`)
  let units = []
  try {
    units = readdirSync('tests/admin').filter(f => f.endsWith('.test.ts')).map(f => `tests/admin/${f}`)
  }
  catch {
    // Todavía no hay pruebas de API del admin.
  }
  const perFile = (file, command) => declaredRuns(file).map(flags => ({ file, flags, command }))
  return [
    ...specs.filter(f => matches(f, filters)).flatMap(file => perFile(file, ['pnpm', 'exec', 'playwright', 'test', '-c', 'playwright.admin.config.ts', file, ...perRunOptions()])),
    ...units.filter(f => matches(f, filters)).flatMap(file => perFile(file, ['pnpm', 'tsx', '--test', file])),
  ]
}

/** Los puertos que usa scripts/admin-run.mjs para la API, el Eros simulado y el sitio. */
const ADMIN_PORTS = [3940, 3990]

function portBindable(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.listen(port, '0.0.0.0', () => server.close(() => resolve(true)))
  })
}

/** Lo que admin-run tiene que dejar limpio: ninguna copia de la base y ningún puerto suyo ocupado. */
async function adminLeftovers() {
  const left = []
  try {
    left.push(...listCopies().map(name => `la base ${name}`))
  }
  catch (err) {
    left.push(`no se pudieron listar las copias de la base (${err instanceof Error ? err.message : err})`)
  }
  for (let port = ADMIN_PORTS[0]; port <= ADMIN_PORTS[1]; port++) {
    if (!await portBindable(port)) left.push(`el puerto ${port} ocupado`)
  }
  return left
}

async function runAdmin(runs) {
  if (!runs.length) return []
  if (!process.env.PW_SKIP_BUILD && run('pnpm', ['build:admin']) !== 0) return ['admin · pnpm build:admin']
  const failed = []
  for (const { file, flags, command } of runs) {
    const label = `admin${flags.length ? ` ${flags.join(' ')}` : ''} · ${file}`
    console.log(`\n· ${label}`)
    const status = run('node', ['scripts/admin-run.mjs', ...flags, '--', ...command])
    if (status !== 0) failed.push(label)
  }
  const left = await adminLeftovers()
  if (left.length) failed.push(`admin-run dejó ${left.join(', ')}`)
  else console.log('\nadmin-run no dejó copias de la base ni puertos ocupados entre 3940 y 3990.')
  return failed
}

/** El puerto quedó libre: el servidor de la corrida anterior ya se apagó. */
function portFree(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port: Number(port), host: 'localhost' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(true))
  })
}

async function waitForPorts() {
  for (let i = 0; i < 100; i++) {
    if (await portFree(webPort) && await portFree(apiPort)) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`los puertos ${webPort} y ${apiPort} siguen ocupados`)
}

/** Pares proyecto · spec que Playwright correría con estos argumentos. */
function listRuns(hasAdmin) {
  const result = spawnSync('pnpm', ['exec', 'playwright', 'test', '--list', '--reporter=json', ...args], { shell, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PW_SKIP_BUILD: '1' } })
  if (result.status !== 0 && hasAdmin && /No tests found/i.test(result.stdout + result.stderr)) return []
  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }
  const report = JSON.parse(result.stdout)
  const runs = new Map()
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) runs.set(`${t.projectName}\0${spec.file}`, { project: t.projectName, file: spec.file })
    }
    for (const child of suite.suites ?? []) walk(child)
  }
  for (const suite of report.suites) walk(suite)
  return [...runs.values()]
}

/** Opciones de Playwright que llevan su valor en el argumento siguiente (`--grep foo`, `-g foo`). */
const WITH_VALUE = new Set(['-g', '--grep', '--grep-invert', '-j', '--workers', '-p', '--project', '--repeat-each', '--retries', '--timeout', '--global-timeout', '--reporter', '--output', '-c', '--config', '--shard', '--trace', '--max-failures', '--test-list'])

/**
 * Las opciones van a cada corrida tal cual (con su valor, pegado o en el argumento siguiente); los
 * filtros de archivo y el proyecto solo eligen los pares, que cada corrida fija por su cuenta.
 */
function perRunOptions() {
  const out = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg.startsWith('-')) continue
    const name = arg.split('=')[0]
    const value = !arg.includes('=') && WITH_VALUE.has(name) && i + 1 < args.length ? args[++i] : undefined
    if (name === '--project' || name === '-p') continue
    out.push(arg, ...(value === undefined ? [] : [value]))
  }
  return out
}

const admin = adminRuns()

if (process.env.PLAYWRIGHT_BASE_URL) {
  const status = run('pnpm', ['exec', 'playwright', 'test', ...args])
  const failed = await runAdmin(admin)
  process.exit(status || (failed.length ? 1 : 0))
}

const runs = listRuns(admin.length > 0)
const options = perRunOptions()
if (!runs.length && !admin.length) {
  console.error('Ningún test coincide con esos filtros.')
  process.exit(1)
}

if (runs.length && !process.env.PW_SKIP_BUILD) {
  // El proxy de /api, /media y /admin queda fijo en el build: se compila con el puerto de la prueba.
  const status = run('pnpm', ['build'], { NUXT_PUBLIC_API_BASE: `http://localhost:${apiPort}/api`, NUXT_PUBLIC_SITE_URL: `http://localhost:${webPort}` })
  if (status !== 0) process.exit(status)
}

const failed = []
for (const { project, file } of runs) {
  await waitForPorts()
  console.log(`\n· ${project} · ${file}`)
  const status = run('pnpm', ['exec', 'playwright', 'test', `--project=${project}`, `tests/e2e/${file}`, ...options], { PW_SKIP_BUILD: '1', PW_FRESH_SERVERS: '1' })
  if (status !== 0) failed.push(`${project} · ${file}`)
}

failed.push(...await runAdmin(admin))

const total = runs.length + admin.length
console.log(`\n${total - failed.length} de ${total} corridas en verde.`)
if (failed.length) {
  console.log(`Fallaron:\n${failed.map(f => `  ${f}`).join('\n')}`)
  process.exit(1)
}
