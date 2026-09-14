import fs from 'node:fs'

// Carga segura de .env en desarrollo local si existe el archivo en disco.
// En entornos cloud (Render, Vercel, Supabase), las variables se inyectan en process.env.
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

export const env = {
  databaseUrl: required('DATABASE_URL'),
  port: Number(process.env['PORT'] ?? process.env['API_PORT'] ?? 3001),
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
}

