/**
 * Textos de Tecnologías. Las categorías llegan rotuladas de /meta (nunca el valor del enum); los
 * rótulos de los campos, del esquema; lo que comparte con Empresas, de orgs/dict.ts.
 */
export const FIRST_YEAR = 1990

export const stack = {
  noun: { one: 'tecnología', many: 'tecnologías', gender: 'f' },
  lead: (total: number, used: number) =>
    total
      ? `${used} de ${total} están en alguna obra o experiencia. Las categorías ordenan los filtros de Obra y las habilidades del CV.`
      : 'Las categorías ordenan los filtros de Obra y las habilidades del CV.',
  filters: {
    all: 'Todas',
    used: 'En uso',
    unused: 'Sin uso',
    noEnglish: 'Falta el inglés',
  },
  groups: 'Tecnologías por categoría',
  noCategory: 'Sin categoría',
  since: (year: number) => `Desde ${year}`,
  noProjects: 'Sin obras',
  missingEnglish: 'Falta el inglés',
  section: 'Lo esencial',
  createText: 'La base pide el nombre, la categoría y desde qué año la usás. El criterio y el color se completan en su ficha.',
  fields: {
    sinceHint: (to: number) => `El año en que empezaste a usarla, entre ${FIRST_YEAR} y ${to}: los años de uso se calculan solos.`,
    sinceShort: (to: number) => `Entre ${FIRST_YEAR} y ${to}.`,
    sinceRange: (label: string, to: number) => `«${label}» tiene que ser un año entre ${FIRST_YEAR} y ${to}.`,
    noteHint: 'Una línea de criterio: cuándo la elegís. Aparece al asomar la tecnología en el caso.',
    colorHint: 'Solo se ve en el registro R, en las marcas de la tecnología.',
    colorNone: 'Sin color',
    colorClear: 'Quitar el color',
    colorCleared: 'Color quitado: se guarda sin color.',
  },
} as const
