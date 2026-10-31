/**
 * Documentos `about` y `contact`. Son la única fuente de nombre, rol, titular, ubicación y canales:
 * la cabecera, el inicio, Sobre mí, el pie, el CV y el JSON-LD los leen de acá vía la API.
 * Texto llano: sin '//' ni '●' (eso era tono de consola).
 */
import type { DocField } from '../../../app/lib/fieldMeta.js'

export const aboutFields: DocField[] = [
  { name: 'name', type: 'string', value: 'Mateo Gabriel Sonzogni' },
  { name: 'display_name', type: 'string', value: 'Mateo Sonzogni' },
  { name: 'role', type: 'string', value: 'Diseñador & Desarrollador Full Stack · Creative Developer' },
  { name: 'headline', type: 'string', value: 'Diseño y construyo productos web enteros, de la idea al deploy.' },
  { name: 'portrait', type: 'string', value: '/media/profile/mateo-front.png' },
  { name: 'portrait_alt', type: 'string', value: 'Retrato de Mateo Sonzogni' },
  { name: 'technical_degree', type: 'string', value: 'Técnico en Programación · CET N.º 30 (2017–2023)' },
  { name: 'higher_education', type: 'string', value: 'Diseño y Desarrollo Web · Escuela Da Vinci (2024–2026) · Tesis Preaprobada' },
  { name: 'freelance_experience', type: 'string', value: 'Activo desde 2023 · Soluciones web y software a medida' },
  { name: 'work_modalities', type: 'string', value: 'Remoto · Híbrido · Presencial' },
  { name: 'languages', type: 'list', value: ['Español (nativo)', 'Inglés (B2, profesional técnico)'] },
  { name: 'core_competencies', type: 'string', value: 'Full-Cycle Engineering: Figma UI/UX → Frontend Reactivo → APIs REST/Microservicios → Postgres ACID → Deploy & Monitoreo' },
  { name: 'engineering_philosophy', type: 'text', wide: true, value: 'Desarrollo con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. No me posiciono solo como programador ni solo como diseñador; trabajo la costura donde la arquitectura técnica se encuentra con la experiencia de usuario.' },
  { name: 'professional_goal', type: 'text', wide: true, value: 'Consolidarme como desarrollador en un equipo con proyectos reales de mayor escala. A mediano plazo, liderazgo técnico: coordinar, organizar, comunicar y conectar perfiles de distintas áreas (diseño, producto, frontend y backend).' },
]

export const contactFields: DocField[] = [
  { name: 'email', type: 'email', value: 'mateogabus@gmail.com' },
  { name: 'github', type: 'url', value: 'https://github.com/MateoGs013' },
  { name: 'linkedin', type: 'url', value: 'https://www.linkedin.com/in/mateo-sonzogni' },
  { name: 'website', type: 'url', value: 'https://mateogs.tech' },
  { name: 'cv', type: 'string', value: '/cv/CV-ES-Mateo-Sonzogni-ATS.pdf' },
  { name: 'availability', type: 'string', value: 'Inmediata · Contratación directa, contractor o freelance' },
  { name: 'response_time', type: 'string', value: 'Respondo en el día' },
  { name: 'location', type: 'string', value: 'Río Negro, Argentina' },
  { name: 'time_zone', type: 'string', value: 'America/Argentina/Buenos_Aires' },
  { name: 'preferred_contact', type: 'string', value: 'Email directo, LinkedIn o mensaje vía GitHub' },
]

export const docs = [
  { key: 'about', title: 'about', fields: aboutFields },
  { key: 'contact', title: 'contact', fields: contactFields },
] as const
