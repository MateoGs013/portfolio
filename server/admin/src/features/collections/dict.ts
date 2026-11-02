/**
 * Textos del marco de colecciones (lista, editor, publicación, dirección, borrado y creación en
 * línea). Las frases que nombran el registro salen de models/labels.ts con el género de cada modelo.
 */
const two = (n: number) => String(n).padStart(2, '0')

/** «05/11 14:02», la fecha corta de un borrador. */
export function shortStamp(at: Date): string {
  return `${two(at.getDate())}/${two(at.getMonth() + 1)} ${two(at.getHours())}:${two(at.getMinutes())}`
}

/** «Ciudad y Sitio», «Nombre, Ciudad y Sitio». */
function joined(items: readonly string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items.at(-1)}` : (items[0] ?? '')
}

export const collections = {
  list: {
    search: 'Buscar',
    clearSearch: 'Borrar la búsqueda',
    filters: 'Filtros',
    results: (n: number) => (n === 1 ? '1 resultado' : `${n} resultados`),
    noMatchText: 'Probá con otra palabra o mirá todos los registros.',
    showAll: 'Ver todos',
  },
  editor: {
    back: 'Volver a la lista',
    viewSite: 'Ver en el sitio',
    form: (title: string) => `Edición de ${title}`,
    sections: 'Secciones del registro',
    section: 'Sección',
    untitled: 'Sin título todavía',
  },
  save: {
    clean: 'Sin cambios',
    dirty: 'Cambios sin guardar',
    saving: 'Guardando…',
    saved: (ago: string) => `Guardado ${ago}`,
    failed: 'No se pudo guardar',
    nothing: 'No hay cambios para guardar.',
    now: 'recién',
    seconds: (n: number) => `hace ${n} s`,
    minutes: (n: number) => `hace ${n} min`,
    at: (time: string) => `a las ${time}`,
    savingLabel: 'Guardando los cambios',
  },
  errors: {
    title: (n: number) => (n === 1 ? 'Hay un campo para revisar' : `Hay ${n} campos para revisar`),
    summary: (labels: readonly string[]) => (labels.length === 1
      ? `Hay un campo para revisar: ${labels[0]}.`
      : `Hay ${labels.length} campos para revisar: ${joined(labels)}.`),
    goTo: 'Ir al campo',
  },
  draft: {
    title: 'Quedaron cambios sin guardar',
    text: 'Los escribiste en esta pestaña y no llegaron a guardarse.',
    recover: (stamp: string) => `Recuperar cambios del ${stamp}`,
    dismiss: 'Descartarlos',
    recovered: 'Cambios recuperados: revisalos y guardá.',
    dismissed: 'Se descartaron los cambios sin guardar.',
  },
  bilingual: {
    es: 'Español',
    en: 'Inglés',
    copy: 'Copiar del español',
    copied: 'Copiado del español: ajustalo antes de guardar.',
    missing: 'Falta el inglés',
  },
  publish: {
    show: 'Mostrar en el sitio',
    showHint: 'Apagado, no aparece en ningún lado del sitio.',
    schedule: 'Publicar desde',
    scheduleHint: 'Vacío: se ve apenas guardás. Con una fecha futura, espera hasta ese día.',
    ready: 'Lista para publicar',
    /** Ya publicada: no se ofrece publicar, se dice si está completa. */
    whole: 'Completa',
    missing: (n: number) => (n === 1 ? 'Falta 1' : `Faltan ${n}`),
    checklist: 'Antes de publicar',
    complete: 'Completar',
    done: 'Listo',
    pending: 'Falta',
    confirmTitle: (n: number) => (n === 1 ? 'Falta una cosa para publicar' : `Faltan ${n} cosas para publicar`),
    confirmText: 'Se puede publicar igual, pero se va a ver incompleto en el sitio.',
    confirm: 'Publicar igual',
    cancel: 'Completar antes',
    panel: 'Publicación',
  },
  slug: {
    label: 'Dirección',
    preview: 'Así se ve en la URL:',
    auto: 'Sale del nombre mientras el registro es nuevo. Después queda fija.',
    fixed: 'Fija: los enlaces que ya circulan llevan a esta dirección.',
    edit: 'Escribirla a mano',
    reset: 'Volver a la automática',
    change: 'Cambiar dirección',
    dialogText: 'Los enlaces que ya se compartieron con la dirección actual van a dejar de andar. No hay redirección de la vieja a la nueva.',
    current: 'Dirección actual',
    next: 'Dirección nueva',
    nextHint: 'Minúsculas sin acentos, números y guiones, como mi-empresa.',
    invalid: 'Usá solo minúsculas sin acentos, números y guiones, como mi-empresa.',
    same: 'Es la misma dirección que ya tiene.',
    confirm: 'Cambiar dirección',
    changed: (slug: string) => `Dirección cambiada a ${slug}.`,
  },
  remove: {
    loading: 'Revisando qué depende de este registro…',
    nothing: 'Nada del sitio lo usa: se puede eliminar sin afectar a otros registros.',
    uses: (n: number) => (n === 1 ? 'Lo usa 1 registro:' : `Lo usan ${n} registros:`),
    projects: 'Obras',
    experiences: 'Trayectoria',
    articles: 'Artículos',
    reassign: 'Qué pasa con lo que lo usa',
    reassignNone: 'Queda sin este dato',
    reassignHint: 'Elegí otro registro para pasarle todo lo de arriba, o dejalo sin este dato.',
    irreversible: 'No se puede deshacer.',
    moved: (n: number) => (n === 1 ? '1 registro pasó al elegido.' : `${n} registros pasaron al elegido.`),
  },
  inline: {
    placeholder: 'Buscar o crear…',
    create: (name: string) => `Crear «${name}»`,
    empty: 'Nada coincide todavía.',
    none: 'Sin elegir',
    clear: 'Quitar la elección',
    remove: (name: string) => `Quitar ${name}`,
    creating: 'Creando…',
    category: 'Categoría',
    since: 'Desde',
    sinceHint: 'El año en que empezaste a usarla.',
    categoryMissing: 'Elegí la categoría.',
    sinceRange: (from: number, to: number) => `Escribí un año entre ${from} y ${to}.`,
    confirmCreate: 'Crear',
    cancel: 'Cancelar',
    created: (name: string) => `«${name}» creada y elegida.`,
    options: (n: number) => (n === 1 ? '1 opción' : `${n} opciones`),
  },
} as const
