/** Artículos del blog (/articles), en español. */
import { ArticleStatus } from '../../generated/prisma/client.js'
import type { TechSlug } from './stack.js'

export const articles = [
  {
    slug: 'postgresql-17-universal-vector-relational-production',
    title: 'PostgreSQL 17 como Base Relacional y Vectorial Universal en Producción',
    summary: 'Análisis de arquitectura y trade-offs: cómo consolidar pgvector y datos relacionales en PostgreSQL 17 reduciendo latencia y complejidad operativa.',
    content: `# PostgreSQL 17 como Base Relacional y Vectorial Universal en Producción

La proliferación de bases de datos especializadas para vectores resolvió necesidades iniciales en la adopción de modelos de lenguaje. Sin embargo, en arquitecturas de ingeniería de producción introduce una sobrecarga crítica: la sincronización bidireccional entre el sistema transaccional de registro y el índice vectorial externo.

## El Problema del Estado Desacoplado

Cuando el catálogo de vacantes o publicaciones reside en PostgreSQL y los embeddings se sincronizan de forma asíncrona hacia un cluster vectorial externo:
1. Las operaciones no son atómicas.
2. Los filtros estructurados requieren un pipeline de dos fases con serialización intermedia.
3. Las fallas de red generan estados inconsistentes o huérfanos.

## La Solución: pgvector en PostgreSQL 17

Con las mejoras de indexación HNSW en pgvector y la gestión de memoria en PostgreSQL 17:
- Las consultas semánticas se ejecutan dentro del mismo planificador de consultas SQL.
- Los joins entre la tabla vectorial y metadatos relacionales se procesan en memoria compartida sin sobrecarga de red.
- Las garantías ACID se mantienen en cada inserción y mutación de embeddings.

\`\`\`sql
SELECT j.id, j.title, j.company, 1 - (j.embedding <=> $1) AS similarity
FROM "Job" j
WHERE j.status = 'ACTIVE'
ORDER BY j.embedding <=> $1
LIMIT 10;
\`\`\`

## Conclusión

Consolidar la persistencia relacional y vectorial en un único nodo de PostgreSQL 17 reduce costos operativos a cero sobrecosto, elimina workers de sincronización redundantes y garantiza consistencia transaccional estricta.`,
    readingTimeMin: 4,
    status: ArticleStatus.PUBLISHED,
    featured: true,
    publishedAt: new Date('2026-10-12T12:00:00.000Z'),
    canonicalUrl: 'https://mateogs.tech/blog/postgresql-17-universal-vector-relational-production',
    techs: ['postgresql', 'prisma'] satisfies TechSlug[],
  },
]
