// Fuente única de los proyectos del portfolio.
// Los componentes leen de acá; nada de contenido duplicado en markup.

export interface Lectura {
  /** Cuerpo de la lectura: cómo cuenta el proyecto ESTA edición. */
  texto: string;
  /** Línea corta de mobiliario: cita en Afiche, comando en Terminal, cota en Plano. */
  dato: string;
}

export interface Proyecto {
  slug: string;
  titulo: string;
  descripcion: string;
  rol: string;
  stack: string[];
  anio: number;
  estado: 'produccion' | 'producto' | 'tesis';
  estadoLabel: string;
  url?: string;
  urlLabel?: string;
  /** Reencuadre por edición (DESIGN.md: la edición se gana su existencia):
      Afiche = lo visual/emocional · Terminal = specs · Plano = proceso. */
  lecturas: {
    afiche: Lectura;
    terminal: Lectura;
    plano: Lectura;
  };
}

export const proyectos: Proyecto[] = [
  {
    slug: 'la-rucula',
    titulo: 'La Rúcula Gastrobar',
    descripcion:
      'Sitio editorial menu-first para un restaurante frente al mar en Chiclana, España. Cliente real.',
    rol: 'Diseño y desarrollo completo',
    stack: ['Vue 3', 'GSAP', 'Lenis'],
    anio: 2026,
    estado: 'produccion',
    estadoLabel: 'En producción',
    url: 'https://laruculagastrobar.es/',
    urlLabel: 'laruculagastrobar.es',
    lecturas: {
      afiche: {
        texto:
          'Un restaurante frente al mar merecía una carta que se leyera como un paseo por la costa. Editorial, calmo, con la brisa metida en el scroll.',
        dato: '«Entre dos orillas nace nuestra cocina»',
      },
      terminal: {
        texto:
          'SPA menu-first: /, /menu y /menu/:slug. Shell hidratado desde CMS multi-tenant con fallback local. Review UX automatizada en 3 viewports + baseline axe antes de cada deploy.',
        dato: '$ npm run ux && npm run a11y → verde',
      },
      plano: {
        texto:
          'Decisión de planta: el tráfico entra por QR desde la mesa, así que el menú es el edificio y la home es la fachada. Motion con significado: reveals de línea y acentos SVG de trazo manual.',
        dato: 'detalle 01 · ia menu-first · esc 1:1',
      },
    },
  },
  {
    slug: 'argpiscinas',
    titulo: 'ARG Piscinas',
    descripcion: 'Catálogo y gestión para una empresa de piscinas en Andalucía. Cliente real.',
    rol: 'Front-end y back-end a medida',
    stack: ['Vue 3', 'Node', 'Prisma'],
    anio: 2025,
    estado: 'produccion',
    estadoLabel: 'En producción',
    url: 'https://www.argpiscinas.es/',
    urlLabel: 'argpiscinas.es',
    lecturas: {
      afiche: {
        texto:
          'Una empresa que construye piscinas en Andalucía tenía que mostrar obra, no promesas. Catálogo directo, presupuesto sin vueltas, agua a la vista.',
        dato: '«Piscinas a medida, obra real»',
      },
      terminal: {
        texto:
          'Front Vue 3 + API Node con Prisma: catálogo tipado y panel de gestión que el cliente opera solo. Datos consistentes, cargas rápidas.',
        dato: '$ curl argpiscinas.es → 200 OK · en producción',
      },
      plano: {
        texto:
          'Estructura en dos cuerpos sobre la misma API: catálogo público y panel de gestión. El cliente carga la obra; el sitio la muestra sin intermediarios.',
        dato: 'detalle 02 · corte a-a · público / panel',
      },
    },
  },
  {
    slug: 'barberpole',
    titulo: 'barberpole',
    descripcion: 'SaaS de gestión para peluquerías: turnos, clientes y caja en un solo lugar.',
    rol: 'Producto propio — diseño y desarrollo',
    stack: ['React', 'Express', 'MongoDB'],
    anio: 2024,
    estado: 'producto',
    estadoLabel: 'Producto propio',
    url: 'https://github.com/MateoGs013/barberpole',
    urlLabel: 'ver repositorio',
    lecturas: {
      afiche: {
        texto:
          'El sistema de reservas con identidad de barbería de barrio: neo-brutalista, directo, sin llamadas ni cuadernos. El mostrador respira.',
        dato: '«Una silla. Tu turno.»',
      },
      terminal: {
        texto:
          'MERN completo: turnos, servicios, clientes y caja en un solo lugar. Auth por roles, agenda del día, precios y duraciones reales.',
        dato: '$ stack → React · Express · MongoDB · Node',
      },
      plano: {
        texto:
          'Planta del negocio: el mostrador era el cuello de botella. El sistema saca las reservas del teléfono y las pone en la agenda, del turno a la caja.',
        dato: 'detalle 03 · flujo turno → caja',
      },
    },
  },
  {
    slug: 'ynara',
    titulo: 'Ynara',
    descripcion:
      'Experiencia WebGL inmersiva como proyecto de tesis: shaders a mano y narrativa que se recorre.',
    rol: 'Tesis — dirección creativa y desarrollo',
    stack: ['Vue', 'TresJS', 'GLSL'],
    anio: 2026,
    estado: 'tesis',
    estadoLabel: 'Tesis 2026',
    url: 'https://github.com/MateoGs013/Ynara-Web',
    urlLabel: 'ver proyecto',
    lecturas: {
      afiche: {
        texto:
          'Una experiencia que no se navega: se recorre. Shaders escritos a mano, materia que reacciona al paso, atmósfera de otro plano.',
        dato: '«estreno 2026»',
      },
      terminal: {
        texto:
          'Vue + TresJS + GLSL: shaders custom y narrativa interactiva en el navegador. En desarrollo activo como proyecto de tesis.',
        dato: '$ git log → tesis 2026 · en desarrollo',
      },
      plano: {
        texto:
          'Memoria de proyecto: la obra está en cálculo. La narrativa espacial se dibuja primero; la tecnología entra al servicio de la atmósfera, nunca al revés.',
        dato: 'lámina 04 · en preparación',
      },
    },
  },
];
