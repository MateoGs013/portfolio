/** Textos de la colección de prueba del Muestrario (#/muestrario/coleccion, solo con `pnpm dev:admin`). */
export const sample = {
  section: 'Muestrario',
  lead: 'Las empresas de la base, editadas con el marco común de colecciones: lista, editor, dirección, borrado con reasignación y creación en línea.',
  sections: {
    essentials: 'Lo esencial',
    place: 'Sitio y ciudad',
    parts: 'Componentes',
  },
  filters: {
    all: 'Todas',
    used: 'En uso',
    noCity: 'Sin ciudad',
  },
  status: {
    used: 'En uso',
    unused: 'Sin uso',
  },
  aside: (projects: number) => (projects === 1 ? '1 obra' : `${projects} obras`),
  checklist: {
    name: 'Tiene nombre',
    city: 'Tiene ciudad',
    url: 'Tiene sitio',
  },
  publish: {
    on: 'Publicada',
    off: 'Oculta',
    note: 'La publicación de esta muestra es simulada: las empresas no se publican. Cambia solo en esta pantalla.',
  },
  parts: {
    title: 'Componentes compartidos',
    text: 'Lo que usan las obras, la trayectoria y los artículos. Lo que se elige acá no se guarda en la empresa; lo que se crea, sí se crea en la base.',
    techs: 'Tecnologías',
    techsHint: 'Buscá una que exista o escribí una nueva para crearla.',
    note: 'Criterio de prueba',
    noteHint: 'Un texto con su inglés, para ver el campo bilingüe.',
  },
} as const
