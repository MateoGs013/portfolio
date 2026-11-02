/**
 * Lo que InlineCreate necesita de cada catálogo que se puede crear sin salir del formulario: de dónde
 * salen las opciones (/meta) y cómo se crea uno nuevo (POST /orgs con el nombre, POST /techs con
 * nombre, categoría y año). El registro creado vuelve con su id para quedar elegido.
 */
import type { OrgOption, TechOption } from '@shared/adminContracts'
import { api } from '../../api/client'
import { enumLabel } from '../../models/labels'
import { options } from '../../stores/meta'

export type InlineKind = 'org' | 'tech'

export interface InlineOption {
  id: number
  name: string
  /** Al margen: la categoría de una tecnología. */
  hint?: string
}

/** Lo que pide crear una tecnología además del nombre (las empresas solo piden el nombre). */
export interface TechExtra {
  category: string
  since: number
}

interface Created {
  id: number
  name: string
  category?: string
}

export function optionsFor(kind: InlineKind): InlineOption[] {
  if (kind === 'org') return (options.value?.orgs ?? []).map((o: OrgOption) => ({ id: o.id, name: o.name }))
  return (options.value?.techs ?? []).map((t: TechOption) => ({ id: t.id, name: t.name, hint: enumLabel('TechCategory', t.category) }))
}

/** Crea el registro y devuelve la opción lista para elegir. El cliente dispara 'write' solo. */
export async function createInline(kind: InlineKind, name: string, extra?: TechExtra): Promise<InlineOption> {
  if (kind === 'org') {
    const org = await api.post<Created>('/orgs', { name })
    return { id: org.id, name: org.name }
  }
  const tech = await api.post<Created>('/techs', { name, category: extra?.category, since: extra?.since })
  return { id: tech.id, name: tech.name, hint: enumLabel('TechCategory', tech.category ?? extra?.category) }
}

export const normalizeName = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
