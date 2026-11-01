/**
 * Textos de Artículos: la lista, las secciones del editor, la publicación y la vista previa. Los
 * rótulos de los estados guardados (Borrador, Publicado, Archivado) llegan de /meta; acá solo los que
 * dependen de la fecha («Programado») y la herramienta.
 */
const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** «12 mar 2026», la fecha corta de una fila. */
export function shortDate(at: Date): string {
  return `${at.getDate()} ${months[at.getMonth()]} ${at.getFullYear()}`
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export const articles = {
  lead: (published: number, drafts: number) => `${plural(published, 'publicado', 'publicados')} en el sitio · ${plural(drafts, 'borrador', 'borradores')}`,
  filters: {
    all: 'Todos',
    published: 'Publicados',
    drafts: 'Borradores',
    noEnglish: 'Falta inglés',
  },
  status: {
    scheduled: 'Programado',
    undated: 'Publicado sin fecha',
  },
  row: {
    since: (date: string) => `desde el ${date}`,
    minutes: (n: number) => `${n} min`,
    noEnglish: 'Falta inglés',
  },
  sections: {
    essentials: 'Lo esencial',
    text: 'Texto',
  },
  fields: {
    summaryHint: 'Una o dos líneas: se leen en la lista de Artículos y en la descripción para buscadores.',
    project: 'Obra de la que habla',
    projectHint: 'El artículo aparece en el caso de esa obra.',
    noProject: 'Ninguna',
    hiddenProject: (title: string) => `${title} (oculta en el sitio)`,
    techs: 'Tecnologías',
    techsHint: 'Las que trata el artículo. Si falta una, se crea acá mismo.',
    minutes: 'Minutos de lectura',
    minutesHint: (words: number) => `Se muestra junto a la fecha. El texto tiene ${plural(words, 'palabra', 'palabras')}.`,
    calculate: 'Calcular',
    calculated: (n: number) => `${plural(n, 'minuto', 'minutos')} de lectura, calculado con 200 palabras por minuto.`,
    canonical: 'Publicación original',
    canonicalHint: 'Solo si salió primero en otro sitio (Dev.to, Medium): los buscadores la toman como la original.',
    featured: 'Destacado',
    featuredHint: 'Marca el artículo como destacado: el sitio lo puede filtrar con ?featured.',
    order: 'Orden',
    orderHint: 'Posición en la lista de Artículos del sitio: más bajo, más arriba. Con el mismo número, primero el más reciente.',
  },
  text: {
    label: 'Texto',
    hint: 'Markdown: ## para los títulos, - para las listas, > para las citas y tres comillas invertidas (```) para el código. El sitio no dibuja tablas: quedan como texto.',
    es: 'Español',
    en: 'Inglés',
    write: 'Escribir',
    preview: 'Vista previa',
    modes: (label: string) => `${label}: escribir o vista previa`,
    words: (n: number) => plural(n, 'palabra', 'palabras'),
    empty: 'Todavía no hay texto para mostrar.',
    previewOf: (label: string) => `Vista previa de ${label}, como se lee en el sitio`,
    code: 'Bloque de código',
    codeLang: (lang: string) => `Bloque de código en ${lang}`,
  },
  checklist: {
    summary: 'Bajada',
    content: 'Texto',
    titleEn: 'Título en inglés',
    summaryEn: 'Bajada en inglés',
    contentEn: 'Texto en inglés',
    techs: 'Al menos una tecnología',
  },
  actions: {
    archive: 'Archivar',
    unarchive: 'Sacar del archivo',
    archiveTitle: 'Archivar este artículo',
    archiveText: 'Deja de verse en el sitio y queda en la lista como Archivado. Se puede volver a publicar cuando quieras.',
    archiveDirty: 'También se guardan los cambios que todavía no guardaste.',
    archived: 'Artículo archivado',
    unarchived: 'Artículo de vuelta en borrador',
  },
  review: {
    title: 'Llegó desde Publicaciones: revisalo antes de publicar',
    text: 'Eros armó este borrador con el texto de la publicación. Revisá el título, la bajada, la obra y las tecnologías, y escribí el inglés: el sitio no lo muestra hasta que lo publiques.',
    dismiss: 'Entendido',
  },
} as const
