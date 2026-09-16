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
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
})

const adapter = new PrismaPg(pool)

export const db = new PrismaClient({ adapter })
