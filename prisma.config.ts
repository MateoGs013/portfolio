import { defineConfig } from 'prisma/config'

// Prisma 7 no carga .env solo. Node 24 sí puede.
try {
  process.loadEnvFile()
}
catch {
  // Sin .env está bien en CI: DATABASE_URL viene del entorno.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] },
})
