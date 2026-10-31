#!/usr/bin/env node
/**
 * `pnpm test:e2e`: la suite entera contra el build de producción (playwright.config.ts).
 *
 * La API pública admite 300 pedidos cada 15 minutos por IP, y el SSR le pide todo desde la misma IP:
 * la suite completa pasa de largo ese número. Por eso compila una sola vez y corre cada spec de cada
 * proyecto en su propia invocación de Playwright, que levanta una API nueva (con el contador en cero)
 * y la apaga al terminar.
 *
 * Uso: `pnpm test:e2e [filtros de archivo] [--opción=valor]`. Los filtros y las opciones (--grep=…,
 * --project=…) se pasan a Playwright. Con PLAYWRIGHT_BASE_URL no se levanta nada: corre una sola vez
 * contra ese sitio, y reiniciar su API entre specs largas queda a cargo de quien lo levantó.
 */
import { spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'

const args = process.argv.slice(2)
const webPort = process.env.PW_WEB_PORT || '3000'
const apiPort = process.env.PW_API_PORT || '3001'
const shell = process.platform === 'win32'

function run(command, commandArgs, env = {}) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', shell, env: { ...process.env, ...env } })
  return result.status ?? 1
}

if (process.env.PLAYWRIGHT_BASE_URL) process.exit(run('pnpm', ['exec', 'playwright', 'test', ...args]))

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
function listRuns() {
  const result = spawnSync('pnpm', ['exec', 'playwright', 'test', '--list', '--reporter=json', ...args], { shell, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PW_SKIP_BUILD: '1' } })
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

const runs = listRuns()
// Las opciones van a cada corrida; los filtros de archivo y el proyecto los fija cada par.
const options = args.filter(arg => arg.startsWith('--') && !arg.startsWith('--project'))

if (!process.env.PW_SKIP_BUILD) {
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

console.log(`\n${runs.length - failed.length} de ${runs.length} corridas en verde.`)
if (failed.length) {
  console.log(`Fallaron:\n${failed.map(f => `  ${f}`).join('\n')}`)
  process.exit(1)
}
