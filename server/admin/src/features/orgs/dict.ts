/**
 * Textos de los catálogos: Empresas y lo que comparte con Tecnologías (el alta desde la lista y
 * «Dónde se usa»). Las frases que nombran el registro («Nueva empresa», «Empresa guardada») salen de
 * models/labels.ts con el género de cada modelo; los rótulos de los campos, del esquema de /meta.
 */
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** «argpiscinas.es» de «https://www.argpiscinas.es/»: el sitio como se lee en una fila. */
export function hostOf(url: string | null): string {
  if (!url) return ''
  try {
    return new URL(url).host.replace(/^www\./, '')
  }
  catch {
    return url
  }
}

/** Igual que withProtocol del servidor: «acme.com» se guarda como «https://acme.com». */
export function withHttps(url: string): string {
  const text = url.trim()
  if (!text || /^[a-z][a-z0-9+.-]*:/i.test(text)) return text
  const bare = text.replace(/^\/\//, '')
  return /^[^\s/@]+\.[^\s/@]{2,}(?:[/?#]\S*)?$/.test(bare) ? `https://${bare}` : text
}

export const catalog = {
  projects: (n: number) => plural(n, 'obra', 'obras'),
  experiences: (n: number) => plural(n, 'experiencia', 'experiencias'),
  articles: (n: number) => plural(n, 'artículo', 'artículos'),
  unused: 'Sin uso',
  palette: { org: 'Nueva empresa', tech: 'Nueva tecnología' },
  create: {
    submit: 'Crear y abrir',
    creating: 'Creando…',
    rest: 'Después de crearla se completa el resto en su ficha.',
    taken: (another: string) => `Ya hay ${another} con ese nombre: la dirección que sale de él está ocupada. Probá con otro.`,
  },
  usage: {
    title: 'Dónde se usa',
    none: 'Todavía no la usa ningún registro. Se elige desde cada obra, experiencia o artículo.',
    projects: 'Obras',
    experiences: 'Trayectoria',
    articles: 'Artículos',
    failed: 'No se pudo ver dónde se usa.',
  },
} as const

export const orgs = {
  noun: { one: 'empresa', many: 'empresas', gender: 'f' },
  lead: (total: number, withProjects: number, inCv: number) =>
    total
      ? `${plural(withProjects, 'tiene obras', 'tienen obras')} y ${plural(inCv, 'aparece', 'aparecen')} en la trayectoria. El caso, Sobre mí y el CV las nombran tal como se escriben acá.`
      : 'El caso, Sobre mí y el CV nombran las empresas tal como se escriben acá.',
  filters: {
    all: 'Todas',
    used: 'En uso',
    unused: 'Sin uso',
    noCity: 'Sin ciudad',
  },
  section: 'Lo esencial',
  createText: 'Con el nombre alcanza: la dirección sale de él.',
  fields: {
    urlHint: 'Sin protocolo se completa con https:// al salir del campo.',
    cityHint: 'El CV la usa como lugar de la experiencia cuando la entrada no dice otro.',
  },
} as const
