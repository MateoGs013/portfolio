/**
 * Se importa primero en los recorridos de scripts/ (antes que server/src/app.js): fija Eros en un
 * puerto cerrado de 127.0.0.1 para que el .env (que apunta al Eros real) no pueda ganar. Las
 * variables ya definidas le ganan a process.loadEnvFile, así que alcanza con fijarlas acá.
 * Solo se respeta un HUNTER_API_URL ya definido si es de esta máquina (el mock de admin-run).
 */
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])

function isLoopback(url: string | undefined): boolean {
  if (!url) return false
  try {
    return LOOPBACK.has(new URL(url).hostname)
  }
  catch {
    return false
  }
}

if (!isLoopback(process.env['HUNTER_API_URL'])) {
  process.env['HUNTER_API_URL'] = 'http://127.0.0.1:9'
  process.env['EROS_API_KEY'] = 'offline'
}
delete process.env['HUNTER_LOCAL_FALLBACK']

export const erosUrl = process.env['HUNTER_API_URL']
