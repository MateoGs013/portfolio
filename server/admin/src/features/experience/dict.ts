/** Textos de Trayectoria (#/trayectoria, el editor de cada entrada y la vista CV). */

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const

/** «mar 2026», desde una fecha ISO (YYYY-MM-DD…) sin pasar por la zona horaria. */
export function monthYear(iso: string): string {
  const [year, month] = iso.slice(0, 7).split('-')
  return `${MONTHS[Number(month) - 1] ?? ''} ${year}`.trim()
}

/** «2024 – actual», «2017 – 2023» o «mar – jul 2026» si empieza y termina el mismo año. */
export function periodText(startedAt: string, endedAt: string | null): string {
  const from = startedAt.slice(0, 4)
  if (!endedAt) return `${from} – ${experience.current.toLowerCase()}`
  const to = endedAt.slice(0, 4)
  if (from !== to) return `${from} – ${to}`
  const [start, end] = [monthYear(startedAt), monthYear(endedAt)]
  return start === end ? start : `${start.split(' ')[0]} – ${end}`
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export const experience = {
  noun: { one: 'experiencia', many: 'trayectoria' },
  current: 'Actual',
  lead: (cv: number, education: number) => `${plural(cv, 'entrada', 'entradas')} en la experiencia del CV y ${education} de formación, que entra sola.`,
  cvView: 'Vista CV',
  sections: {
    essentials: 'Lo esencial',
    story: 'Relato',
    cv: 'CV',
  },
  filters: {
    all: 'Todas',
    education: 'Formación',
    work: 'Trabajo',
    inCv: 'En el CV',
    missingEn: 'Falta inglés',
  },
  status: {
    inCv: 'En el CV',
    education: 'En el CV',
    outside: 'Fuera del CV',
  },
  missingEn: 'Falta inglés',
  fields: {
    kind: 'Tipo',
    role: 'Cargo',
    org: 'Empresa o institución',
    orgHint: 'Buscá una que exista o escribí el nombre para crearla. Vacía si fue un proyecto propio.',
    startedAt: 'Desde',
    endedAt: 'Hasta',
    current: 'Actual',
    currentHint: 'Sigue en curso: el CV dice «actual».',
    location: 'Ubicación',
    locationHint: 'Vacía: la ciudad de la empresa; sin empresa, remoto.',
    summary: 'Síntesis',
    summaryHint: 'Responsabilidades y logros, en Sobre mí.',
    story: 'Relato',
    storyHint: 'La versión larga: lo técnico y lo aprendido. Va en Sobre mí, debajo de la síntesis.',
    techs: 'Tecnologías',
    techsHint: 'Las que usaste en esa etapa. Buscá una o escribí una nueva para crearla.',
    projects: 'Obras ligadas',
    projectsHint: 'Las obras hechas en esa etapa: se enlazan desde Sobre mí y el caso.',
    projectsNone: 'Todavía no hay obras cargadas.',
    hidden: 'oculta',
  },
  validate: {
    endBeforeStart: '«Hasta» no puede ser antes de «Desde».',
    bullet: (n: number, max: number, has: number) => `La viñeta ${n} pasa los ${max} caracteres (tiene ${has}): el CV tiene que entrar en una página.`,
    bulletEn: (n: number, max: number, has: number) => `La viñeta ${n} en inglés pasa los ${max} caracteres (tiene ${has}).`,
    bulletOrphan: 'Escribí primero la viñeta en español: la de inglés va en la misma posición.',
  },
  bullets: {
    label: 'Viñetas del CV',
    hint: (max: number, chars: number) => `Hasta ${max}, de ${chars} caracteres como máximo: es la cota de una página A4. Cada una lleva su inglés al lado, en la misma posición.`,
    item: (n: number) => `Viñeta ${n}`,
    add: 'Sumar una viñeta',
    full: (max: number) => `Ya están las ${max} viñetas que admite el CV.`,
    remove: (n: number) => `Quitar la viñeta ${n}`,
    removed: (n: number) => `Viñeta ${n} quitada, con su inglés.`,
    none: 'Sin viñetas: la entrada sale en el CV solo con su cargo y su período.',
  },
  place: {
    inCv: (n: number) => `Entra al CV en el puesto ${n}`,
    education: 'Entra al CV en Formación, ordenada por fecha',
    outside: 'No entra al CV',
    add: 'Sumar',
    see: 'Ver CV',
    adding: 'Sumando al CV',
    added: (n: number) => `Sumada al CV en el puesto ${n}.`,
    afterSave: 'Se puede sumar al CV después de guardarla.',
    loading: 'Buscando su puesto en el CV',
  },
  cv: {
    lead: 'La hoja real, armada con la base. Lo que cambiás acá se ve en vivo.',
    language: 'Idioma de la hoja',
    es: 'Español',
    en: 'Inglés',
    order: 'Orden en el CV',
    orderHelp: 'Arrastrá una entrada o, con el foco en su asa, usá ↑ y ↓, o Inicio y Fin. Se guarda solo y la hoja se actualiza.',
    handle: (title: string, n: number, total: number) => `Mover ${title}, puesto ${n} de ${total}`,
    moved: (title: string, n: number, total: number) => `${title} pasó al puesto ${n} de ${total}.`,
    remove: (title: string) => `Sacar ${title} del CV`,
    removed: (title: string) => `${title} salió del CV.`,
    emptyOrder: 'Ninguna entrada de trabajo entra al CV todavía.',
    outside: 'Fuera del CV',
    add: 'Sumar al CV',
    addNamed: (title: string) => `Sumar al CV: ${title}`,
    added: (title: string, n: number) => `${title} entró al CV en el puesto ${n}.`,
    education: 'Formación',
    educationHelp: 'Entra sola, de la más reciente a la más antigua.',
    saving: 'Guardando el orden…',
    saved: 'Orden guardado',
    saveFailed: 'No se pudo guardar el orden del CV',
    sheet: 'Hoja del CV',
    sheetFailed: 'No se pudo armar la hoja del CV',
    measuring: 'Midiendo la hoja…',
    fits: (mm: number) => `Una página A4 · ${mm} mm de contenido`,
    short: (mm: number) => `Una página, pero corta: ${mm} mm de contenido (lo ideal es 248 a 265)`,
    long: 'El CV pasa de una página: acortá una viñeta o sacá una entrada',
    longDetail: (mm: number, pages: number) => `${mm} mm de contenido, ${plural(pages, 'página', 'páginas')}: el tope es 265 mm en una sola.`,
    print: 'Imprimir o guardar como PDF',
    printing: 'Abriendo la hoja para imprimir',
    printBlocked: 'El navegador no dejó abrir la hoja en otra pestaña.',
    openSheet: 'Abrir para imprimir',
    pdf: 'El PDF descargable del sitio se regenera con',
    pdfCommand: 'pnpm cv:pdf',
  },
} as const
