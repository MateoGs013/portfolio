import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'

export const docs = Router()

interface FallbackField {
  name: string
  type: string
  value: string
}

const fallbackDocs: Record<string, { key: string, title: string, updatedAt: string, fields: FallbackField[] }> = {
  about: {
    key: 'about',
    title: 'about',
    updatedAt: new Date().toISOString(),
    fields: [
      { name: 'fullName', type: 'string', value: 'Mateo Gabriel Sonzogni' },
      { name: 'preferred_name', type: 'string', value: 'Mateo' },
      { name: 'born', type: 'string', value: '2004 (22 años)' },
      { name: 'base_location', type: 'string', value: 'Río Negro, Patagonia Argentina (Remoto global / Freelance)' },
      { name: 'academic_formation', type: 'string', value: 'Escuela Da Vinci (Buenos Aires) · Tecnicatura Superior en Diseño y Desarrollo Web (2024–2026)' },
      { name: 'degree', type: 'string', value: 'Tesis de grado preaprobada: Ynara (Asistente de IA Adaptativo con Memoria Vectorial)' },
      { name: 'availability_status', type: 'string', value: 'DISPONIBLE // Búsqueda de equipo o proyectos de alto impacto' },
      { name: 'work_modalities', type: 'string', value: 'Remoto · Híbrido · Presencial' },
      { name: 'timezone', type: 'string', value: 'UTC-3 (Argentina / Compatible con US & EU)' },
      { name: 'languages', type: 'string', value: 'Español (Nativo) · Inglés (B2 Profesional Técnico)' },
      { name: 'core_competencies', type: 'string', value: 'Full-Cycle Engineering: Figma UI/UX → Frontend Reactivo → APIs REST/Microservicios → Postgres ACID → Deploy & Monitoreo' },
      { name: 'engineering_philosophy', type: 'text', wide: true, value: 'Desarrollo con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. No me posiciono solo como programador ni solo como diseñador; trabajo la costura donde la arquitectura técnica se encuentra con la experiencia de usuario.' },
      { name: 'professional_goal', type: 'text', wide: true, value: 'Consolidarme como desarrollador en un equipo con proyectos reales de mayor escala. A mediano plazo, liderazgo técnico: coordinar, organizar, comunicar y conectar perfiles de distintas áreas (diseño, producto, frontend y backend).' },
    ],
  },
  contact: {
    key: 'contact',
    title: 'contact',
    updatedAt: new Date().toISOString(),
    fields: [
      { name: 'email', type: 'url', value: 'mateogabus@gmail.com' },
      { name: 'github', type: 'url', value: 'https://github.com/MateoGs013' },
      { name: 'linkedin', type: 'url', value: 'https://www.linkedin.com/in/mateo-sonzogni' },
      { name: 'availability', type: 'string', value: 'Inmediata · Contratación directa, contractor o freelance' },
      { name: 'location', type: 'string', value: 'Río Negro, AR (Disponible para relocalización o remoto)' },
      { name: 'timezone', type: 'string', value: 'UTC-3' },
      { name: 'preferred_contact', type: 'string', value: 'Email directo, LinkedIn o mensaje vía GitHub' },
    ],
  },
}

/** GET /api/docs/:key → { key, title, fields: [{ name, type, value, wide?, worlds? }] } */
docs.get('/docs/:key', async (req, res) => {
  try {
    const data = await db.doc.findUnique({ where: { key: req.params.key } })
    if (!data) {
      if (fallbackDocs[req.params.key]) {
        const fb = fallbackDocs[req.params.key]!
        res.json(envelope(fb, { count: fb.fields.length }))
        return
      }
      res.status(404).json({ error: 'not found' })
      return
    }
    const count = Array.isArray(data.fields) ? data.fields.length : 0
    res.json(envelope(data, { count }))
  }
  catch {
    if (fallbackDocs[req.params.key]) {
      const fb = fallbackDocs[req.params.key]!
      res.json(envelope(fb, { count: fb.fields.length }))
      return
    }
    res.status(500).json({ error: 'internal error' })
  }
})
