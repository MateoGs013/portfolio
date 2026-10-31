/**
 * Piezas del descriptor de campos del admin (ver ../adminSchema.ts): el tipo de cada campo y los
 * atajos para declararlo en una línea.
 */
import type { EnumName } from '../labels.js'

/** Cómo se edita el valor. `system` lo pone la base (ids, fechas de alta, claves de traducción). */
export type FieldKind =
  | 'text' | 'prose' | 'markdown' | 'slug' | 'url' | 'path' | 'email' | 'color'
  | 'int' | 'decimal' | 'bool' | 'date' | 'datetime' | 'enum' | 'list'
  | 'relation' | 'json' | 'system'

/** Dónde se lee el campo fuera del admin: la ayuda lo dice con palabras, esto lo dice para el código. */
export type Surface = 'home' | 'work' | 'case' | 'about' | 'cv' | 'articles' | 'record' | 'seo' | 'hunter'

export interface FieldDescriptor {
  /** Rótulo del campo en el formulario y en los mensajes de error. */
  label: string
  /** Una línea: dónde aparece o para qué sirve. */
  help: string
  required: boolean
  /** Tope de caracteres de un texto, o de elementos de una lista. */
  max: number | null
  kind: FieldKind
  /** Tiene par en inglés (en su tabla *Translation o en el `en` del documento). */
  translatable: boolean
  surfaces: readonly Surface[]
  /** false: lo calcula o lo asigna el servidor, el formulario no lo pide. */
  editable: boolean
  /** Enum de la base cuyas opciones se eligen (kind 'enum' y listas de enum). */
  options?: EnumName
  /** Modelo al que apunta una relación (kind 'relation'). */
  target?: string
}

interface Extra {
  required?: boolean
  max?: number
  translatable?: boolean
  surfaces?: readonly Surface[]
  editable?: boolean
  options?: EnumName
  target?: string
}

/** Un campo que se edita. */
export function field(kind: FieldKind, label: string, help: string, extra: Extra = {}): FieldDescriptor {
  return {
    label,
    help,
    required: extra.required ?? false,
    max: extra.max ?? null,
    kind,
    translatable: extra.translatable ?? false,
    surfaces: extra.surfaces ?? [],
    editable: extra.editable ?? true,
    ...(extra.options ? { options: extra.options } : {}),
    ...(extra.target ? { target: extra.target } : {}),
  }
}

/** Lo que pone la base: id, alta, última edición. No se pide en ningún formulario. */
export function system(label: string, help: string): FieldDescriptor {
  return field('system', label, help, { editable: false })
}

/** Relación con otro modelo: `editable` si el formulario la elige (empresa, tecnologías). */
export function relation(target: string, label: string, help: string, extra: Extra = {}): FieldDescriptor {
  return field('relation', label, help, { ...extra, target })
}

/** Clave foránea: se edita a través de su relación, nunca a mano. */
export function foreignKey(label: string): FieldDescriptor {
  return system(label, 'Lo completa la relación elegida.')
}

export type ModelFields = Readonly<Record<string, FieldDescriptor>>

/**
 * Tabla de inglés de un modelo: cada texto traducible del original con el mismo tope, más la
 * relación, su clave y el idioma (que no se editan: el admin solo escribe `translations.en`).
 */
export function translationOf(base: ModelFields, link: { owner: string, relation: string, key: string }, fields: readonly string[]): ModelFields {
  const { owner, relation: relationName, key } = link
  const texts = Object.fromEntries(fields.map((name) => {
    const original = base[name]
    if (!original) throw new Error(`translationOf: ${owner}.${name} no está descrito`)
    return [name, { ...original, label: `${original.label} en inglés`, required: false, translatable: false }]
  }))
  return {
    [relationName]: relation(owner, 'Registro', 'El registro en español que traduce.', { editable: false }),
    [key]: foreignKey('Registro'),
    locale: system('Idioma', 'Siempre inglés: el español vive en el registro.'),
    ...texts,
  }
}
