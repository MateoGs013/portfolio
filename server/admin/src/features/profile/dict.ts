/**
 * Textos de Perfil (Sobre mí y Contacto). Los rótulos y las ayudas de cada bloque fijo vienen del
 * esquema que manda la API (GET /docs/:key → schema); acá va solo lo de la herramienta: los grupos del
 * formulario, el retrato, el CV por idioma y los bloques libres.
 */
import type { DocKey } from '@shared/docSchema'

/** La dirección de cada documento en el admin (#/perfil/sobre-mi) y su clave en la API. */
export const DOC_ROUTES = { 'sobre-mi': 'about', 'contacto': 'contact' } as const satisfies Record<string, DocKey>
export type DocRoute = keyof typeof DOC_ROUTES

export interface FormGroup {
  id: string
  title: string
  /** Los bloques fijos del grupo, por nombre y en orden. */
  blocks: readonly string[]
}

export const profile = {
  area: 'Perfil',
  tabs: 'Documentos del perfil',
  docs: {
    about: {
      title: 'Sobre mí',
      lead: 'Lo que el inicio, Sobre mí, el CV y las propuestas dicen de vos.',
      saved: 'Sobre mí guardado',
      groups: [
        { id: 'presentacion', title: 'Presentación', blocks: ['name', 'display_name', 'role', 'headline'] },
        { id: 'retrato', title: 'Foto', blocks: ['portrait', 'portrait_alt'] },
        { id: 'trayecto', title: 'Formación y trabajo', blocks: ['technical_degree', 'higher_education', 'freelance_experience', 'work_modalities', 'languages', 'core_competencies'] },
        { id: 'relato', title: 'Cómo trabajás', blocks: ['engineering_philosophy', 'professional_goal'] },
      ],
    },
    contact: {
      title: 'Contacto',
      lead: 'Cómo te encuentran: el pie del sitio, la cabecera del CV y la firma de las propuestas.',
      saved: 'Contacto guardado',
      groups: [
        { id: 'canales', title: 'Dónde escribirte', blocks: ['email', 'github', 'linkedin', 'website'] },
        { id: 'cv', title: 'CV en PDF', blocks: ['cv'] },
        { id: 'disponibilidad', title: 'Disponibilidad y ubicación', blocks: ['availability', 'response_time', 'location', 'time_zone', 'preferred_contact'] },
      ],
    },
  } satisfies Record<DocKey, { title: string, lead: string, saved: string, groups: readonly FormGroup[] }>,
  /** Bloques fijos que el esquema sume y ningún grupo nombre todavía. */
  otherGroup: 'Otros datos',
  saveFailed: (title: string) => `No se pudo guardar ${title}`,
  missing: 'Falta completar',
  missingHint: 'El sitio todavía no tiene este dato: se crea al guardarlo.',
  same: 'Igual en los dos idiomas',
  english: 'inglés',
  portrait: {
    change: 'Cambiar retrato',
    first: 'Subir retrato',
    uploading: 'Subiendo el retrato',
    none: 'Todavía no hay retrato',
    broken: 'No se encuentra el archivo de este retrato. Subilo de nuevo.',
    hint: 'PNG, JPG o WebP de hasta 10 MB. Se cambia apenas lo elegís, sin esperar a Guardar.',
    drop: 'Soltá la imagen para cambiar el retrato',
    done: 'Retrato cambiado: el sitio ya lo muestra en los dos idiomas.',
    failed: 'No se pudo cambiar el retrato',
    wrongType: 'Ese archivo no es una imagen PNG, JPG o WebP.',
    tooBig: 'La imagen pesa más de 10 MB: exportala más liviana.',
    preview: 'Retrato actual',
    alt: 'Descripción del retrato',
  },
  cv: {
    es: 'PDF en español',
    en: 'PDF en inglés',
    regenerate: 'El PDF se regenera con',
    regenerateAfter: 'y se commitea: acá elegís qué archivo enlaza el sitio en cada idioma.',
    command: 'pnpm cv:pdf',
    required: (lang: string) => `Completá el PDF ${lang}.`,
    invalid: (lang: string, example: string) => `El PDF ${lang} tiene que ser un archivo de /cv/, como ${example}.`,
    inSpanish: 'en español',
    inEnglish: 'en inglés',
    placeholderEs: '/cv/CV-ES-Mateo-Sonzogni-ATS.pdf',
    placeholderEn: '/cv/CV-EN-Mateo-Sonzogni-ATS.pdf',
  },
  free: {
    title: 'Bloques libres',
    lead: 'Datos de más que querés sumar al registro de esta página. Los bloques de arriba los usa el sitio: no se quitan ni se renombran.',
    empty: 'Todavía no hay bloques libres.',
    add: 'Agregar bloque',
    name: 'Nombre',
    nameHint: 'Así lo lee el registro del sitio: minúsculas sin acentos y guiones bajos, como horario_de_atencion.',
    type: 'Tipo',
    untitled: 'Bloque nuevo',
    remove: (name: string) => `Quitar ${name}`,
    removed: (name: string) => `${name} se quita al guardar. Descartar lo devuelve.`,
    added: 'Bloque agregado: ponele un nombre y su texto.',
    types: { string: 'Texto corto', text: 'Texto largo', list: 'Lista, uno por renglón' },
    nameInvalid: 'El nombre va en minúsculas, sin espacios ni acentos, como horario_de_atencion.',
    nameTaken: 'Ya hay un bloque con ese nombre: elegí otro.',
    nameRequired: 'Ponele un nombre al bloque.',
  },
  limits: {
    text: (label: string, max: number, length: number) => `«${label}» admite hasta ${max} caracteres (tiene ${length}).`,
    list: (label: string, items: number, chars: number) => `«${label}» admite hasta ${items} elementos de ${chars} caracteres.`,
    email: (label: string) => `«${label}» tiene que ser un correo, como nombre@ejemplo.com.`,
  },
} as const
