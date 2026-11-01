/**
 * Modelo de prueba del marco de colecciones sobre /api/admin/orgs (solo en el Muestrario): las
 * empresas reales de la base, con dirección fija, borrado con reasignación y una checklist simulada.
 */
import type { Model } from '../../../models/types'
import { sample } from './dict'

export interface SampleOrg {
  id: number
  slug: string
  name: string
  url: string | null
  city: string | null
  _count: { projects: number, experiences: number }
}

/** El formulario con la forma del payload: un error en `city` cae en su campo. */
export interface SampleOrgForm {
  name: string
  slug: string
  url: string
  city: string
}

const ROUTE = 'muestrario-coleccion'

const host = (url: string | null) => {
  if (!url) return ''
  try {
    return new URL(url).host.replace(/^www\./, '')
  }
  catch {
    return url
  }
}

export const sampleModel: Model<SampleOrg, SampleOrgForm> = {
  key: 'muestra-empresas',
  path: '/orgs',
  schema: 'Org',
  noun: { one: 'empresa', many: 'empresas', gender: 'f' },
  routes: {
    list: { name: ROUTE },
    record: id => ({ name: ROUTE, params: { id: String(id) } }),
    create: { name: ROUTE, params: { id: 'nueva' } },
  },
  blank: () => ({ name: '', slug: '', url: '', city: '' }),
  toForm: org => ({ name: org.name, slug: org.slug, url: org.url ?? '', city: org.city ?? '' }),
  toPayload: (form, org) => ({
    name: form.name,
    url: form.url.trim() || null,
    city: form.city.trim() || null,
    // La dirección viaja solo al crear: después cambia con «Cambiar dirección».
    ...(org ? {} : { slug: form.slug }),
  }),
  title: org => org.name,
  formTitle: form => form.name,
  metaLine: org => [org.city, host(org.url)].filter(Boolean).join(' · '),
  aside: org => sample.aside(org._count.projects),
  status: org => (org._count.projects + org._count.experiences
    ? { tone: 'ok', label: sample.status.used }
    : { tone: 'neutral', label: sample.status.unused }),
  publicUrl: org => (org._count.projects ? `/projects?org=${org.slug}` : null),
  sections: [
    { id: 'esencial', label: sample.sections.essentials, fields: ['name', 'slug'] },
    { id: 'ubicacion', label: sample.sections.place, fields: ['url', 'city'] },
    { id: 'componentes', label: sample.sections.parts, fields: [] },
  ],
  filters: [
    { id: 'todas', label: sample.filters.all, test: () => true },
    { id: 'en-uso', label: sample.filters.used, test: org => org._count.projects + org._count.experiences > 0 },
    { id: 'sin-ciudad', label: sample.filters.noCity, test: org => !org.city },
  ],
  keywords: org => [org.slug, org.url ?? ''].join(' '),
  slugEndpoint: id => `/orgs/${id}/slug`,
  slugPreview: slug => `/projects?org=${slug}`,
  impact: true,
  checklist: form => [
    { id: 'name', label: sample.checklist.name, done: !!form.name.trim(), field: 'name' },
    { id: 'city', label: sample.checklist.city, done: !!form.city.trim(), field: 'city' },
    { id: 'url', label: sample.checklist.url, done: !!form.url.trim(), field: 'url' },
  ],
}
