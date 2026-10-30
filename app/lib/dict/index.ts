/**
 * Diccionario de interfaz (ES/EN): rótulos, estados, aria y etiquetas de métricas. Nunca contenido:
 * nombres propios, ubicaciones, obras y cifras salen de la API. Un archivo por área, cada uno con su
 * dueño; las claves llevan el prefijo de su área para que dos archivos no se pisen.
 */
import about from './about'
import articles from './articles'
import common from './common'
import cv from './cv'
import focus from './focus'
import home from './home'
import motion from './motion'
import record from './record'
import seo from './seo'
import shell from './shell'
import theCase from './case'
import work from './work'

export type Lang = 'es' | 'en'

export const langs: readonly Lang[] = ['es', 'en']

/** Una entrada: el mismo rótulo en los dos idiomas, juntos para que ninguno quede sin traducir. */
export type DictEntry = Readonly<Record<Lang, string>>

export const dict = {
  ...common,
  ...shell,
  ...motion,
  ...record,
  ...cv,
  ...home,
  ...work,
  ...theCase,
  ...about,
  ...articles,
  ...focus,
  ...seo,
} satisfies Record<string, DictEntry>

export type DictKey = keyof typeof dict

export type DictParams = Record<string, string | number>

export function isDictKey(key: string): key is DictKey {
  return Object.hasOwn(dict, key)
}

/** El rótulo en `lang`, con `{nombre}` reemplazado por `params`. */
export function translate(key: DictKey, lang: Lang, params?: DictParams): string {
  const text = dict[key][lang]
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}
