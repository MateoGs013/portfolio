/**
 * Empresas (/api/admin/orgs): nombre, dirección fija, sitio y ciudad. Se crean con el nombre desde su
 * lista o en línea desde una obra o una experiencia; se borran con el impacto a la vista y la opción
 * de pasarle a otra lo que la nombra.
 */
import type { Model } from '../../models/types'
import { catalog, hostOf, orgs, withHttps } from './dict'

export interface AdminOrg {
  id: number
  slug: string
  name: string
  url: string | null
  city: string | null
  _count: { projects: number, experiences: number }
}

/** Con la forma del payload: un error en `city` cae en su campo. */
export interface OrgForm {
  name: string
  slug: string
  url: string
  city: string
}

const used = (org: AdminOrg) => org._count.projects + org._count.experiences > 0

/** «1 obra · 1 experiencia», o «Sin uso». */
export function orgUsage(org: AdminOrg): string {
  const { projects, experiences } = org._count
  const parts = [projects ? catalog.projects(projects) : '', experiences ? catalog.experiences(experiences) : ''].filter(Boolean)
  return parts.join(' · ') || catalog.unused
}

export const orgModel: Model<AdminOrg, OrgForm> = {
  key: 'empresas',
  path: '/orgs',
  schema: 'Org',
  noun: orgs.noun,
  routes: {
    list: { name: 'empresas' },
    record: id => ({ name: 'empresa', params: { id: String(id) } }),
  },
  blank: () => ({ name: '', slug: '', url: '', city: '' }),
  toForm: org => ({ name: org.name, slug: org.slug, url: org.url ?? '', city: org.city ?? '' }),
  toPayload: (form, org) => ({
    name: form.name.trim(),
    url: withHttps(form.url) || null,
    city: form.city.trim() || null,
    // La dirección viaja solo al crear: después cambia con «Cambiar dirección».
    ...(org ? {} : { slug: form.slug }),
  }),
  title: org => org.name,
  formTitle: form => form.name,
  metaLine: org => [org.city, hostOf(org.url)].filter(Boolean).join(' · '),
  aside: orgUsage,
  publicUrl: org => (org._count.projects ? `/projects?org=${org.slug}` : null),
  sections: [
    { id: 'esencial', label: orgs.section, fields: ['name', 'slug', 'url', 'city'] },
  ],
  filters: [
    { id: 'todas', label: orgs.filters.all, test: () => true },
    { id: 'en-uso', label: orgs.filters.used, test: used },
    { id: 'sin-uso', label: orgs.filters.unused, test: org => !used(org) },
    { id: 'sin-ciudad', label: orgs.filters.noCity, test: org => !org.city },
  ],
  keywords: org => [org.slug, org.url ?? ''].join(' '),
  slugEndpoint: id => `/orgs/${id}/slug`,
  slugPreview: slug => `/projects?org=${slug}`,
  impact: true,
}
