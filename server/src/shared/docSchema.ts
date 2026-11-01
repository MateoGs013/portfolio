/**
 * Esquema fijo de los documentos `about` y `contact`: los bloques que el sitio, el CV y el Job Hunter
 * leen por nombre (docText, docValue y docList en app/ y en server/src), cada uno con su tipo, su
 * rótulo, su ayuda y su ancho. Lo comparten el servidor (PUT /api/admin/docs/:key valida contra esto y
 * la API pública normaliza los bloques guardados) y el admin (el formulario de Perfil se arma con esto).
 *
 * Un bloque requerido no se renombra, no cambia de tipo ni se quita. Los bloques libres que se sumen
 * desde el admin son solo texto corto, texto largo o lista.
 *
 * El inglés depende del tipo:
 * - string, text y list se traducen (`en` opcional: sin él se sirve el español);
 * - email, url e image son iguales en los dos idiomas (`en` se descarta);
 * - localizedPath lleva un valor propio por idioma (`value` en español y `en` en inglés, los dos obligatorios).
 */

export type DocKey = 'about' | 'contact'

export type DocBlockType = 'string' | 'text' | 'list' | 'email' | 'url' | 'image' | 'localizedPath'

/** Qué hace un bloque con su inglés: se traduce, no tiene, o tiene un valor propio obligatorio. */
export type DocEnglish = 'translate' | 'none' | 'own'

export interface DocBlock {
  name: string
  type: DocBlockType
  label: string
  help: string
  /** Ancho completo en el registro (R) y en el formulario. */
  wide: boolean
}

export interface DocSchema {
  key: DocKey
  /** Cómo se nombra el documento en el admin. */
  label: string
  /** Doc.title cuando el documento todavía no existe en la base (el formulario no lo pide). */
  title: string
  blocks: readonly DocBlock[]
}

/** Tipos que puede tener un bloque libre. */
export const FREE_BLOCK_TYPES = ['string', 'text', 'list'] as const satisfies readonly DocBlockType[]

/** Nombre de un bloque: minúsculas, números y guiones bajos, como `display_name`. */
export const DOC_BLOCK_NAME = /^[a-z][a-z0-9_]{0,47}$/

/** Ruta de un PDF del CV: `/cv/<archivo>.pdf`. */
export const CV_PATH = /^\/cv\/[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/

/** Ruta de una imagen servida por la API: `/media/…` con extensión de imagen y sin `..`. */
export const IMAGE_PATH = /^\/media\/(?!.*\.\.)[A-Za-z0-9/_.-]+\.(?:png|jpe?g|webp)$/

const block = (name: string, type: DocBlockType, label: string, help: string, wide = false): DocBlock => ({ name, type, label, help, wide })

export const docSchemas: Readonly<Record<DocKey, DocSchema>> = {
  about: {
    key: 'about',
    label: 'Sobre mí',
    title: 'about',
    blocks: [
      block('name', 'string', 'Nombre completo', 'Encabeza el CV y firma los artículos y los datos para buscadores.'),
      block('display_name', 'string', 'Nombre visible', 'El nombre corto de la cabecera, del inicio y de las propuestas.'),
      block('role', 'string', 'Rol', 'Debajo del nombre en el inicio y en la cabecera del CV.'),
      block('headline', 'string', 'Bajada', 'La frase del inicio y la descripción para buscadores.'),
      block('portrait', 'image', 'Retrato', 'La foto de Sobre mí: se sube desde acá y es la misma en los dos idiomas.'),
      block('portrait_alt', 'string', 'Descripción del retrato', 'Lo que lee un lector de pantalla en lugar de la foto.'),
      block('technical_degree', 'string', 'Título técnico', 'Uno de los datos de Sobre mí.'),
      block('higher_education', 'string', 'Formación superior', 'Uno de los datos de Sobre mí.'),
      block('freelance_experience', 'string', 'Experiencia freelance', 'Se lee en el registro de Sobre mí (R).'),
      block('work_modalities', 'string', 'Modalidades de trabajo', 'Remoto, híbrido o presencial: en Sobre mí y en la cabecera del CV.'),
      block('languages', 'list', 'Idiomas', 'Uno por renglón: en Sobre mí, en el CV y en los datos para buscadores.'),
      block('core_competencies', 'string', 'Competencias', 'La línea de metodologías del CV.'),
      block('engineering_philosophy', 'text', 'Filosofía de trabajo', 'El párrafo de Sobre mí y del inicio, y el resumen del CV.', true),
      block('professional_goal', 'text', 'Objetivo profesional', 'Hacia dónde vas: cierra Sobre mí y es su descripción para buscadores.', true),
    ],
  },
  contact: {
    key: 'contact',
    label: 'Contacto',
    title: 'contact',
    blocks: [
      block('email', 'email', 'Email', 'El correo del pie, del CV y de los datos para buscadores. Es el mismo en los dos idiomas.'),
      block('github', 'url', 'GitHub', 'Tu perfil: en el pie, en el CV y en la firma de las propuestas.'),
      block('linkedin', 'url', 'LinkedIn', 'Tu perfil: en el pie y en el CV.'),
      block('website', 'url', 'Sitio', 'Tu sitio: en la cabecera del CV y en la firma de las propuestas.'),
      block('cv', 'localizedPath', 'PDF del CV', 'Un archivo por idioma, como /cv/CV-ES-Mateo-Sonzogni-ATS.pdf: el enlace «CV» del pie.'),
      block('availability', 'string', 'Disponibilidad', 'En el inicio, en el pie y en la cabecera del CV.'),
      block('response_time', 'string', 'Tiempo de respuesta', 'La promesa del pie, junto al email.'),
      block('location', 'string', 'Ubicación', 'En el pie y en la cabecera del CV.'),
      block('time_zone', 'string', 'Zona horaria', 'En el pie, junto a la ubicación.'),
      block('preferred_contact', 'string', 'Contacto preferido', 'Cómo preferís que te escriban: se lee en el registro de Contacto (R).'),
    ],
  },
}

export const docKeys = Object.keys(docSchemas) as DocKey[]

export function isDocKey(key: string): key is DocKey {
  return Object.hasOwn(docSchemas, key)
}

/** El bloque requerido `name` de `key`, o null si es un bloque libre. */
export function docBlock(key: DocKey, name: string): DocBlock | null {
  return docSchemas[key].blocks.find(b => b.name === name) ?? null
}

/** Qué hace el tipo con el inglés. Cualquier otro tipo (fechas, números) es igual en los dos idiomas. */
export function englishOf(type: string): DocEnglish {
  if (type === 'localizedPath') return 'own'
  return (FREE_BLOCK_TYPES as readonly string[]).includes(type) ? 'translate' : 'none'
}

/** Bloques de prosa: su `en` es una traducción y, si falta, el bloque queda «sin traducir». */
export function isTranslatableType(type: string): boolean {
  return englishOf(type) === 'translate'
}
