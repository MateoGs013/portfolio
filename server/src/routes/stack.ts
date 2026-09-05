import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { readFilters } from '../filters.js'
import { TechCategory, type Prisma } from '../../generated/prisma/client.js'

export const stack = Router()

const FILTERS = ['category'] as const

function isCategory(value: string): value is TechCategory {
  return (Object.values(TechCategory) as string[]).includes(value)
}

/** GET /api/stack?category= — cada tech con cuántos proyectos y experiencias la usan. */
stack.get('/stack', async (req, res) => {
  const filters = readFilters(req, FILTERS)

  const where: Prisma.TechWhereInput = {}
  const category = filters.category?.toUpperCase()
  if (category && isCategory(category)) where.category = category

  const data = await db.tech.findMany({
    where,
    orderBy: [{ since: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { projects: true, experiences: true } },
    },
  })

  res.json(envelope(data, { filters }))
})
