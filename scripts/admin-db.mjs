#!/usr/bin/env node
/**
 * Copias de la base para las pruebas del admin. Nunca escriben en la base de origen: `create` la lee
 * con pg_dump y la vuelca en `portfolio_admin_<x>`; `drop` solo borra bases con ese prefijo.
 *
 *   node scripts/admin-db.mjs create [x]   → crea portfolio_admin_<x> (x al azar si falta) e imprime su nombre
 *   node scripts/admin-db.mjs drop <nombre|x>
 *
 * El origen es siempre la base `portfolio` del docker-compose (ADMIN_DB_SOURCE la cambia): el .env de
 * un worktree puede apuntar a una base que ya no existe. De DATABASE_URL solo se toman el servidor y
 * el usuario. Antes de copiar se comprueba que el origen existe y tiene tablas, y el volcado va a un
 * archivo: si pg_dump falla, no queda una copia vacía. Usa el contenedor del docker-compose
 * (ADMIN_DB_CONTAINER, `portfolio-db`) y, si no está corriendo, pg_dump y psql locales.
 */
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

export const PREFIX = 'portfolio_admin_'
const CONTAINER = process.env.ADMIN_DB_CONTAINER || 'portfolio-db'
const DEFAULT_SOURCE = 'portfolio'

function sourceUrl() {
  const fileEnv = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {}
  const raw = process.env.DATABASE_URL || fileEnv.DATABASE_URL
  if (!raw) throw new Error('Falta DATABASE_URL (en el entorno o en .env) para saber qué base copiar.')
  const url = new URL(raw)
  url.pathname = `/${process.env.ADMIN_DB_SOURCE || DEFAULT_SOURCE}`
  return url
}

const dbName = url => decodeURIComponent(url.pathname.replace(/^\//, ''))
const isIdentifier = name => /^[a-z0-9_]+$/.test(name)

/** El nombre completo de una copia, validado: solo minúsculas, números y guiones bajos, con el prefijo. */
export function copyName(suffix) {
  const name = suffix.startsWith(PREFIX) ? suffix : `${PREFIX}${suffix}`
  if (!isIdentifier(name) || name === PREFIX) throw new Error(`Nombre de copia inválido: ${name}`)
  return name
}

/** La DATABASE_URL de una copia: la del origen con otro nombre de base. */
export function copyUrl(name) {
  const url = sourceUrl()
  url.pathname = `/${copyName(name)}`
  return url.toString()
}

function containerRunning() {
  const result = spawnSync('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER], { encoding: 'utf8' })
  return result.status === 0 && result.stdout.trim() === 'true'
}

/** Corre un script de shell con las herramientas de Postgres, en el contenedor o en esta máquina. */
function sh(script, url) {
  const user = decodeURIComponent(url.username || 'portfolio')
  const env = { ...process.env, PGUSER: user, PGPASSWORD: decodeURIComponent(url.password), PGHOST: url.hostname, PGPORT: url.port || '5432' }
  const result = containerRunning()
    ? spawnSync('docker', ['exec', '-e', `PGUSER=${user}`, CONTAINER, 'sh', '-c', script], { encoding: 'utf8' })
    : spawnSync('sh', ['-c', script], { encoding: 'utf8', env })
  if (result.status !== 0) throw new Error(`Postgres respondió con un error:\n${result.stderr || result.stdout}`)
  return result.stdout
}

export function createCopy(suffix = randomBytes(4).toString('hex')) {
  const url = sourceUrl()
  const source = dbName(url)
  const name = copyName(suffix)
  if (!isIdentifier(source)) throw new Error(`Nombre de base de origen inválido: ${source}`)
  if (source === name || source.startsWith(PREFIX)) throw new Error(`La base de origen (${source}) no puede ser una copia.`)
  const tables = sh(`psql -At -d postgres -c "select 1 from pg_database where datname = '${source}'" | grep -q 1 && psql -At -d ${source} -c "select count(*) from information_schema.tables where table_schema = 'public'" || echo missing`, url).trim()
  if (tables === 'missing') throw new Error(`La base de origen ${source} no existe. Levantala con pnpm db:up y cargala con pnpm db:seed.`)
  if (tables === '0') throw new Error(`La base de origen ${source} no tiene tablas. Corré pnpm prisma migrate deploy y pnpm db:seed.`)
  // Sin tubería: el estado de pg_dump se comprueba antes de volcar, así una copia vacía no pasa por buena.
  sh(`f=$(mktemp) && pg_dump --no-owner --no-privileges -f "$f" ${source} && dropdb --if-exists --force ${name} && createdb ${name} && psql -q -v ON_ERROR_STOP=1 -d ${name} -f "$f" > /dev/null; s=$?; rm -f "$f"; exit $s`, url)
  return name
}

export function dropCopy(suffix) {
  const name = copyName(suffix)
  sh(`dropdb --if-exists --force ${name}`, sourceUrl())
  return name
}

/** Copias que quedaron (para comprobar que no queda ninguna). */
export function listCopies() {
  const out = sh(`psql -At -d postgres -c "select datname from pg_database where datname like '${PREFIX}%'"`, sourceUrl())
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [command, arg] = process.argv.slice(2)
  try {
    if (command === 'create') console.log(createCopy(arg))
    else if (command === 'drop' && arg) console.log(`borrada ${dropCopy(arg)}`)
    else if (command === 'list') console.log(listCopies().join('\n') || 'sin copias')
    else {
      console.error('Uso: node scripts/admin-db.mjs create [x] | drop <nombre> | list')
      process.exit(2)
    }
  }
  catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}
