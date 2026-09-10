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
