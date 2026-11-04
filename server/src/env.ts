import fs from 'node:fs'

// Carga segura de .env en desarrollo local si existe el archivo en disco.
// En despliegue (Docker / Coolify), las variables se inyectan en process.env.
if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env')
  }
  catch {
    // Silencioso si falla la lectura del archivo .env
  }
}

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Falta la variable de entorno ${name} (ver .env.example)`)
  return v
}

/**
 * Eros (Job Hunter) se lee en cada pedido, no acá: HUNTER_API_URL, EROS_API_KEY y
 * HUNTER_LOCAL_FALLBACK en server/src/admin/proxy.ts, EROS_DEMO en fallbackHunterData.ts.
 * - HUNTER_API_URL: dirección de Eros, sin valor por defecto. Sin ella Eros queda «no configurado».
 * - EROS_API_KEY: clave compartida con Eros.
 * - EROS_DEMO=1: sin Eros, la cola muestra vacantes ficticias (solo pruebas y capturas).
 * - HUNTER_LOCAL_FALLBACK=1: fuera de producción, si HUNTER_API_URL no responde, prueba 127.0.0.1:8000.
 */
export const env = {
  databaseUrl: required('DATABASE_URL'),
  port: Number(process.env['PORT'] ?? process.env['API_PORT'] ?? 3001),
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000,http://127.0.0.1:3000',
}

