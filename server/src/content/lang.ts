import type { Request } from 'express'
import { Locale } from '../../generated/prisma/client.js'

/** Idioma de la respuesta. El español vive en cada registro; el inglés, en las tablas *Translation. */
export type Lang = Locale

export const defaultLang: Lang = Locale.es

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (Object.values(Locale) as string[]).includes(value)
}

/** `?lang=en` → 'en'. Cualquier otro valor, o ninguno, da el español. */
export function parseLang(req: Request): Lang {
  const raw = req.query['lang']
  const value = Array.isArray(raw) ? raw[0] : raw
  return isLang(value) ? value : defaultLang
}
