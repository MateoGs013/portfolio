/**
 * Parche puntual (30-oct-2026): lleva a una base ya cargada dos correcciones que están en el seed,
 * sin recargarla entera (el seed borra y vuelve a cargar, y pisaría lo editado desde el admin).
 *
 * - Eros: la base de producción todavía lo describe como "director creativo… vault de Obsidian".
 *   Mateo confirmó que es un asistente de carrera; acá queda igual que en `seed.ts`.
 * - Barberpole: su URL de producción es turnos.mateogs.tech (la de Vercel solo redirige).
 *
 * Uso: pnpm tsx server/src/patches/2026-10-30-eros-barberpole.ts   (con DATABASE_URL apuntando a la base)
 * Idempotente: correrlo dos veces deja lo mismo. Si cambia el seed, este archivo no se actualiza: es un registro.
 * Desde la migración 20261101 las métricas son filas Metric: el parche las reemplaza con las mismas reglas.
 */
import { db } from '../db.js'
import { ProjectStatus } from '../../generated/prisma/client.js'
import { metricRows } from '../seed/metrics.js'

const BARBERPOLE_URL = 'https://turnos.mateogs.tech/'

const EROS = {
  title: 'Eros Career OS',
  role: 'Sistema multiagente · IA & automatización',
  status: ProjectStatus.LIVE,
  featured: true,
  summary: 'Asistente de carrera autónomo: rastrea vacantes, las evalúa con IA, adapta el CV Harvard ATS a cada una y genera contenido técnico para LinkedIn, X y Dev.to.',
  brief: 'Automatizar la búsqueda laboral de punta a punta: encontrar vacantes en varios portales, decidir cuáles valen la pena, adaptar el CV a cada una y sostener una presencia técnica en redes sin dedicarle horas todos los días.',
  outcome: 'En producción en eros.mateogs.tech e integrado a la consola del portafolio como Eros AI Suite: Job Hunter, Contenido omnicanal y TrendRadar. Corre en un VPS propio con FastAPI y SQLite, publica a través de n8n y se supervisa desde un bot privado de Telegram.',
  url: 'https://eros.mateogs.tech',
  repo: 'https://github.com/MateoGs013/eros-agent',
}
const EROS_METRICS = metricRows({ freeTierQuota: '1,500 RPD', operatingCost: '$0/mes', platformsCount: 4, responseLatencyMs: 35 })
const EROS_TECHS = ['fastapi', 'python', 'typescript', 'postgresql']
const EROS_LINKS = [
  { label: 'código fuente', url: 'https://github.com/MateoGs013/eros-agent' },
  { label: 'control center', url: 'https://eros.mateogs.tech' },
]
const EROS_STEPS = [
  { title: '01 · fuentes', body: 'Rastreo de vacantes en LinkedIn, Get on Board y RemoteOK, con filtros de stack, modalidad y salario.' },
  { title: '02 · evaluación', body: 'Cada vacante pasa por Gemini: porcentaje de match, fortalezas, objeciones probables, skills que faltan y qué proyectos del portafolio conviene citar.' },
  { title: '03 · postulación', body: 'CV Harvard ATS adaptado a la vacante en una página A4, email de postulación y nota de conexión para el hiring lead detectado en LinkedIn.' },
  { title: '04 · contenido', body: 'TrendRadar detecta temas técnicos afines al stack en Hacker News, Dev.to y GitHub, y el módulo omnicanal los convierte en post de LinkedIn, hilo de X, artículo de Dev.to y carrusel PDF.' },
]

async function main() {
  await db.$transaction(async (tx) => {
    const eros = await tx.project.findUnique({ where: { slug: 'eros' }, select: { id: true } })
    if (eros) {
      await tx.project.update({
        where: { id: eros.id },
        data: {
          ...EROS,
          techs: { set: EROS_TECHS.map(slug => ({ slug })) },
          links: { deleteMany: {}, create: EROS_LINKS },
          steps: { deleteMany: {}, create: EROS_STEPS.map((s, i) => ({ ...s, order: i + 1 })) },
          metrics: { deleteMany: {}, create: EROS_METRICS },
        },
      })
      console.log('eros: actualizado')
    }
    else console.warn('eros: no existe en esta base, no se tocó nada')

    const barberpole = await tx.project.findUnique({ where: { slug: 'barberpole' }, select: { id: true } })
    if (barberpole) {
      await tx.project.update({ where: { id: barberpole.id }, data: { url: BARBERPOLE_URL } })
      const { count } = await tx.link.updateMany({
        where: { projectId: barberpole.id, url: { contains: 'vercel.app' } },
        data: { url: BARBERPOLE_URL, label: 'sitio en vivo' },
      })
      console.log(`barberpole: url actualizada (${count} link${count === 1 ? '' : 's'})`)
    }
    else console.warn('barberpole: no existe en esta base, no se tocó nada')
  })
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
