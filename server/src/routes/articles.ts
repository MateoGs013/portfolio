import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { asBool, readFilters } from '../filters.js'
import type { ArticleStatus, Prisma } from '../../generated/prisma/client.js'

export const articles = Router()

const FILTERS = ['stack', 'featured', 'status', 'project'] as const

const techSelect = { select: { slug: true, name: true }, orderBy: { name: 'asc' } } satisfies Prisma.Article$techsArgs
const projectSelect = { select: { slug: true, title: true } } satisfies Prisma.Article$projectArgs

const fallbackArticle = {
  id: 1,
  slug: 'arquitectura-agentes-autonomos-rag-fastapi-postgresql',
  title: 'Arquitectura de Agentes Autónomos y RAG con FastAPI, PostgreSQL y Gemini',
  summary: 'Diseño e implementación de un sistema de agentes para reclutamiento técnico y curaduría omnicanal con pgvector y streaming.',
  content: `## Introducción

La construcción de agentes autónomos orientados a tareas específicas requiere resolver tres problemas fundamentales: **determinismo en la extracción estructurada**, **persistencia eficiente de contexto** y **control de latencia**.

En este artículo desglosamos la arquitectura interna de Eros, el agente satélite que potencia la automatización y curaduría del portafolio.

## 1. El Pipeline de Extracción y Scoring Semántico

En lugar de delegar todo el flujo a un único prompt masivo, el sistema divide la operación en fases discretas:

1. **Captura y Normalización:** Procesamiento de fuentes primarias (APIs de empleo, feeds RSS técnicos y repositorios).
2. **Vectorización con pgvector:** Generación de embeddings densos de 768 dimensiones para indexación semántica.
3. **Evaluación de Afinidad:** Cálculo de similitud coseno combinada con heurísticas deterministas de stack.

\`\`\`python
# Eros Engine · Cálculo de similitud coseno con embeddings
def compute_cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = sum(a * a for a in vec_a) ** 0.5
    norm_b = sum(b * b for b in vec_b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
\`\`\`

## 2. Trade-offs y Decisiones Técnicas

- **PostgreSQL 17 en lugar de base vectorial dedicada:** Mantener los datos relacionales y los vectores en la misma instancia elimina la sobrecarga de sincronización entre servicios y simplifica el despliegue en un único VPS.
- **FastAPI + Nuxt 4 Nitro:** El backend satélite expone endpoints asíncronos protegidos por Bearer tokens, consumidos de forma transparente por el panel administrativo.

## Conclusión

La especialización de agentes satélites desacoplados del CMS principal permite iterar modelos y prompts sin alterar la estabilidad de la plataforma central.`,
  readingTimeMin: 6,
  status: 'PUBLISHED' as ArticleStatus,
  featured: true,
  coverImage: null,
  canonicalUrl: 'https://mateogs.tech/blog/arquitectura-agentes-autonomos-rag-fastapi-postgresql',
  sortOrder: 1,
  publishedAt: new Date('2026-10-10T12:00:00Z'),
  createdAt: new Date('2026-10-10T12:00:00Z'),
  updatedAt: new Date('2026-10-10T12:00:00Z'),
  projectId: null,
  techs: [
    { slug: 'python', name: 'Python' },
    { slug: 'postgresql', name: 'PostgreSQL' },
    { slug: 'fastapi', name: 'FastAPI' },
    { slug: 'docker', name: 'Docker' },
  ],
  project: null,
}

/** GET /api/articles?stack=&featured=&status= */
articles.get(['/articles', '/article'], async (req, res) => {
  const filters = readFilters(req, FILTERS)

  try {
    const where: Prisma.ArticleWhereInput = {}
    if (filters.stack) where.techs = { some: { slug: filters.stack } }
    if (filters.project) where.project = { slug: filters.project }
    const featured = asBool(filters.featured)
    if (featured !== undefined) where.featured = featured
    // Solo artículos publicados en la API pública para evitar fuga de borradores
    where.status = 'PUBLISHED'

    const data = await db.article.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        techs: techSelect,
        project: projectSelect,
      },
    })

    res.json(envelope(data, { filters }))
  } catch {
    let list = [fallbackArticle].filter(a => a.status === 'PUBLISHED')
    if (filters.stack) {
      list = list.filter(a => a.techs.some(t => t.slug === filters.stack))
    }
    if (filters.project) {
      list = list.filter(a => a.project && (a.project as { slug?: string }).slug === filters.project)
    }
    const featured = asBool(filters.featured)
    if (featured !== undefined) {
      list = list.filter(a => a.featured === featured)
    }

    res.json(envelope(list, { filters }))
  }
})

/** GET /api/articles/:slug */
articles.get(['/articles/:slug', '/article/:slug'], async (req, res) => {
  const rawSlug = req.params['slug']
  const slug = Array.isArray(rawSlug) ? rawSlug[0] ?? '' : String(rawSlug ?? '')
  if (!slug) return res.status(400).json({ error: 'slug requerido' })

  try {
    const item = await db.article.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        techs: techSelect,
        project: projectSelect,
      },
    })

    if (!item) {
      if (slug === fallbackArticle.slug && fallbackArticle.status === 'PUBLISHED') {
        return res.json(envelope(fallbackArticle))
      }
      return res.status(404).json({ error: 'artículo no encontrado' })
    }

    res.json(envelope(item))
  } catch {
    if (slug === fallbackArticle.slug && fallbackArticle.status === 'PUBLISHED') {
      return res.json(envelope(fallbackArticle))
    }
    res.status(404).json({ error: 'artículo no encontrado' })
  }
})
