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
    title: 'Lo escribió Eros y ya está publicado',
    text: 'Eros lo escribió en español y en inglés, y se publicó solo: ya se lee en el sitio. Si cambiás algo, se publica al guardar.',
    dismiss: 'Entendido',
  },
} as const

const two = (n: number) => String(n).padStart(2, '0')

/** «Pedir un artículo a Eros»: el diálogo, lo que tarda, lo que pasó y la línea del horario semanal. */
export const asked = {
  action: 'Pedir un artículo a Eros',
  title: 'Pedir un artículo a Eros',
  description: 'Eros lo escribe en español y en inglés y se publica solo en el sitio. Todo es opcional: sin tema, elige uno que no repita lo publicado.',
  trendTitle: 'Escribir artículo desde esta tendencia',
  trendDescription: (title: string) => `Eros escribe un artículo a partir de «${title}», en español y en inglés, y se publica solo en el sitio.`,
  topic: 'Tema',
  topicHint: 'De qué querés que hable. Si lo dejás vacío, Eros elige uno.',
  project: 'Obra',
  projectHint: 'Si querés que cuente una obra tuya.',
  projectNone: 'Ninguna en particular',
  optional: 'opcional',
  submit: 'Pedir el artículo',
  submitTrend: 'Escribir el artículo',
  sending: 'Pidiendo…',
  cancel: 'Cancelar',
  writing: 'Eros está escribiendo…',
  writingHint: 'Suele tardar uno o dos minutos. Podés cerrar esto: cuando lo publique, te avisa.',
  elapsed: (seconds: number) => `Lleva ${Math.floor(seconds / 60)}:${two(seconds % 60)}`,
  background: 'Seguir en segundo plano',
  failedTitle: 'Eros no publicó el artículo',
  failedFallback: 'No se sabe por qué: probá de nuevo en un momento.',
  failedToast: (why: string) => `Eros no publicó el artículo. ${why}`,
  failedRequest: 'No se pidió el artículo.',
  retry: 'Probar de nuevo',
  close: 'Cerrar',
  published: (title: string) => `Eros publicó «${title}»: ya está en el sitio.`,
  open: 'Abrir',
  weekly: {
    on: (next: string) => `Eros publica uno cada lunes a las 9:00 · próximo: ${next}`,
    off: 'La publicación semanal está apagada',
  },
  last: {
    running: 'Eros está escribiendo uno ahora.',
    done: (when: string) => `El último, del ${when}:`,
    gone: (when: string) => `El último, del ${when}, ya no está en Artículos.`,
    failed: (when: string, why: string) => `El último pedido, del ${when}, falló. ${why}`,
  },
} as const
