/**
 * Inglés en el admin. Cada registro trae sus filas *Translation y las guarda por upsert sobre la
 * clave compuesta (id, locale): editar el español nunca las toca y un campo vacío queda en NULL,
 * así la API pública cae al español y lo lista en `untranslated`.
 *
 * Forma del body: `translations: { en: { campo: texto | null } }` en el registro y en cada paso
 * o enlace. Sin la clave `translations` (o sin `en`) no se toca nada. Un inglés todo vacío no crea
 * una fila nueva: solo vacía la que ya existía.
 */
import { Locale, type Prisma } from '../../generated/prisma/client.js'
import { HttpError, optStr } from './input.js'

type Body = Record<string, unknown>
type Tx = Prisma.TransactionClient

/** El único idioma que se edita como traducción: el español vive en el registro. */
export const EN = Locale.en

/** Include de Prisma para leer el inglés junto al registro. */
export const withTranslations = { translations: { where: { locale: EN } } } as const

/** `translations.en` del body, o null si no llegó (se conserva lo guardado). */
export function enBody(b: Body): Body | null {
  const translations = b['translations']
  if (translations === undefined || translations === null) return null
  if (typeof translations !== 'object' || Array.isArray(translations)) {
    throw new HttpError(400, 'campo "translations": se esperaba { en: { … } }')
  }
  const en = (translations as Body)['en']
  if (en === undefined || en === null) return null
  if (typeof en !== 'object' || Array.isArray(en)) throw new HttpError(400, 'campo "translations.en": se esperaba un objeto')
  return en as Body
}

/** Textos en inglés con el mismo tope que su par en español; vacío → null. */
export function enTexts<K extends string>(en: Body, limits: Record<K, number>): Record<K, string | null> {
  const out = {} as Record<K, string | null>
  for (const [k, max] of Object.entries(limits) as [K, number][]) {
    try {
      out[k] = optStr(en, k, max)
    }
    catch (err) {
      if (err instanceof HttpError) throw new HttpError(err.status, `${err.message} (inglés)`)
      throw err
    }
  }
  return out
}

/** Sin ningún texto ni viñeta: no vale la pena crear una fila para eso. */
export function isBlank(data: Record<string, string | string[] | null>): boolean {
  return Object.values(data).every(v => v === null || (Array.isArray(v) && v.length === 0))
}

const PROJECT_LIMITS = { title: 4000, role: 4000, summary: 4000, brief: 4000, outcome: 4000 }
const STEP_LIMITS = { title: 200, body: 4000 }
const LINK_LIMITS = { label: 4000 }
const MEDIA_LIMITS = { alt: 300, caption: 300 }
const TECH_LIMITS = { note: 4000 }

export async function saveProjectEn(tx: Tx, projectId: number, en: Body): Promise<void> {
  const data = enTexts(en, PROJECT_LIMITS)
  if (isBlank(data)) {
    await tx.projectTranslation.updateMany({ where: { projectId, locale: EN }, data })
    return
  }
  await tx.projectTranslation.upsert({
    where: { projectId_locale: { projectId, locale: EN } },
    create: { projectId, locale: EN, ...data },
    update: data,
  })
}

export async function saveStepEn(tx: Tx, stepId: number, en: Body): Promise<void> {
  const data = enTexts(en, STEP_LIMITS)
  if (isBlank(data)) {
    await tx.processStepTranslation.updateMany({ where: { stepId, locale: EN }, data })
    return
  }
  await tx.processStepTranslation.upsert({
    where: { stepId_locale: { stepId, locale: EN } },
    create: { stepId, locale: EN, ...data },
    update: data,
  })
}

export async function saveLinkEn(tx: Tx, linkId: number, en: Body): Promise<void> {
  const data = enTexts(en, LINK_LIMITS)
  if (isBlank(data)) {
    await tx.linkTranslation.updateMany({ where: { linkId, locale: EN }, data })
    return
  }
  await tx.linkTranslation.upsert({
    where: { linkId_locale: { linkId, locale: EN } },
    create: { linkId, locale: EN, ...data },
    update: data,
  })
}

/** Media se edita por PATCH: solo las claves que llegan (alt o caption) cambian. */
export async function saveMediaEn(tx: Tx, mediaId: number, en: Body): Promise<void> {
  const keys = (Object.keys(MEDIA_LIMITS) as (keyof typeof MEDIA_LIMITS)[]).filter(k => k in en)
  if (keys.length === 0) return
  const all = enTexts(en, MEDIA_LIMITS)
  const data = Object.fromEntries(keys.map(k => [k, all[k]]))
  if (isBlank(data)) {
    await tx.mediaTranslation.updateMany({ where: { mediaId, locale: EN }, data })
    return
  }
  await tx.mediaTranslation.upsert({
    where: { mediaId_locale: { mediaId, locale: EN } },
    create: { mediaId, locale: EN, ...data },
    update: data,
  })
}

export async function saveTechEn(tx: Tx, techId: number, en: Body): Promise<void> {
  const data = enTexts(en, TECH_LIMITS)
  if (isBlank(data)) {
    await tx.techTranslation.updateMany({ where: { techId, locale: EN }, data })
    return
  }
  await tx.techTranslation.upsert({
    where: { techId_locale: { techId, locale: EN } },
    create: { techId, locale: EN, ...data },
    update: data,
  })
}
