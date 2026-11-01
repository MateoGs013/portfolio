/**
 * Rótulos para los modelos. Los de los datos (estados, tipos, categorías) vienen de /meta: nunca se
 * muestra el valor de un enum. Las frases de cada colección se arman con su nombre y su género, así
 * «Nueva empresa», «Artículo guardado» y «Eliminar esta obra» salen de un solo lugar.
 */
import type { EnumName } from '@shared/labels'
import { label } from '../stores/meta'
import type { ModelNoun } from './types'

/** El rótulo de un valor de enum según /meta; vacío mientras /meta no llegó. */
export function enumLabel(name: EnumName, value: string | null | undefined): string {
  return label(name, value)
}

const capital = (text: string) => text.charAt(0).toLocaleUpperCase('es') + text.slice(1)

/** Frases completas de una colección, en español claro. */
export function phrases(noun: ModelNoun) {
  const f = noun.gender === 'f'
  const one = noun.one
  return {
    /** «Nueva empresa». */
    create: `${f ? 'Nueva' : 'Nuevo'} ${one}`,
    /** «Empresa guardada». */
    saved: `${capital(one)} ${f ? 'guardada' : 'guardado'}`,
    /** «Empresa creada». */
    created: `${capital(one)} ${f ? 'creada' : 'creado'}`,
    /** «Empresa eliminada». */
    deleted: `${capital(one)} ${f ? 'eliminada' : 'eliminado'}`,
    /** «Eliminar empresa…». */
    remove: `Eliminar ${one}…`,
    /** «Eliminar esta empresa». */
    removeTitle: `Eliminar ${f ? 'esta' : 'este'} ${one}`,
    /** «No se pudo guardar la empresa». */
    saveFailed: `No se pudo guardar ${f ? 'la' : 'el'} ${one}`,
    /** «No encontramos esa empresa». */
    missing: `No encontramos ${f ? 'esa' : 'ese'} ${one}. Puede que se haya borrado.`,
    /** «Todavía no hay empresas». */
    empty: `Todavía no hay ${noun.many}`,
    /** «Ninguna empresa coincide». */
    noMatch: `${f ? 'Ninguna' : 'Ningún'} ${one} coincide`,
    /** «Buscar empresas». */
    search: `Buscar ${noun.many}`,
    /** «Otra empresa con esa dirección». */
    another: `${f ? 'otra' : 'otro'} ${one}`,
    /** «Todas». */
    all: f ? 'Todas' : 'Todos',
    count: (n: number) => `${n} ${n === 1 ? one : noun.many}`,
  }
}

export type ModelPhrases = ReturnType<typeof phrases>
