import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { env } from './env.js'

const needsSsl = env.databaseUrl.includes('sslmode=require')
  || env.databaseUrl.includes('supabase.com')
  || env.databaseUrl.includes('neon.tech')
  || process.env['DATABASE_SSL'] === 'true'

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
})

// Prevenir caídas del proceso por desconexión de clientes inactivos
pool.on('error', (err) => {
  console.error('[DB Pool] Error en cliente inactivo:', err.message)
})

const adapter = new PrismaPg(pool)

export const db = new PrismaClient({ adapter })
