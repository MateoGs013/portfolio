// Fuente única de los proyectos del portfolio.
// Los componentes leen de acá; nada de contenido duplicado en markup.

export interface Proyecto {
  slug: string;
  titulo: string;
  descripcion: string;
  stack: string[];
  anio: number;
  estado: 'produccion' | 'producto' | 'tesis';
  estadoLabel: string;
  url?: string;
  urlLabel?: string;
}

export const proyectos: Proyecto[] = [
  {
    slug: 'la-rucula',
    titulo: 'La Rúcula Gastrobar',
    descripcion:
      'Sitio editorial menu-first para un restaurante frente al mar en Chiclana, España. Cliente real.',
    stack: ['Vue 3', 'GSAP', 'Lenis'],
    anio: 2026,
    estado: 'produccion',
    estadoLabel: 'En producción',
    url: 'https://laruculagastrobar.es/',
    urlLabel: 'laruculagastrobar.es',
  },
  {
    slug: 'argpiscinas',
    titulo: 'ARG Piscinas',
    descripcion: 'Catálogo y gestión para una empresa de piscinas en Andalucía. Cliente real.',
    stack: ['Vue 3', 'Node', 'Prisma'],
    anio: 2025,
    estado: 'produccion',
    estadoLabel: 'En producción',
    url: 'https://www.argpiscinas.es/',
    urlLabel: 'argpiscinas.es',
  },
  {
    slug: 'barberpole',
    titulo: 'barberpole',
    descripcion: 'SaaS de gestión para peluquerías: turnos, clientes y caja en un solo lugar.',
    stack: ['React', 'Express', 'MongoDB'],
    anio: 2024,
    estado: 'producto',
    estadoLabel: 'Producto propio',
    url: 'https://github.com/MateoGs013/barberpole',
    urlLabel: 'ver repositorio',
  },
  {
    slug: 'ynara',
    titulo: 'Ynara',
    descripcion:
      'Experiencia WebGL inmersiva como proyecto de tesis: shaders a mano y narrativa que se recorre.',
    stack: ['Vue', 'TresJS', 'GLSL'],
    anio: 2026,
    estado: 'tesis',
    estadoLabel: 'Tesis 2026',
    url: 'https://github.com/MateoGs013/Ynara-Web',
    urlLabel: 'ver proyecto',
  },
];
