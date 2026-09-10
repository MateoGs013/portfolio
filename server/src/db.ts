import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { env } from './env.js'

const isLocal = env.databaseUrl.includes('localhost') || env.databaseUrl.includes('127.0.0.1')
const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

const adapter = new PrismaPg(pool)

export const db = new PrismaClient({ adapter })
