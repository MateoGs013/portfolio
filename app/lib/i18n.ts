// Diccionario y utilidades de internacionalización para el Portafolio Técnico Mateo Sonzogni
// Soporta alternancia completa (100% Español / 100% English) en todos los mundos y vistas.

export interface LocaleContent {
  nav: {
    db: string
    projects: string
    experience: string
    stack: string
    about: string
    contact: string
    shortDb: string
    shortProjects: string
    shortExperience: string
    shortStack: string
    shortAbout: string
    shortContact: string
    explorer: string
    available: string
    engine: string
    admin: string
    searchPlaceholder: string
    searchTitle: string
    clockTitle: string
    telemetryTitle: string
    themeDark: string
    themeLight: string
    focusEnable: string
    focusDisable: string
    langSwitch: string
    back: string
    forward: string
    up: string
    recordsCount: (n: number) => string
    keyAdjacent: string
    keyNavigate: string
    keyOpen: string
    keyBack: string
    keySections: string
    keyGoto: string
    keyHyperfocus: string
  }
  home: {
    roleTop: string
    availTop: string
    headline: [string, string, string]
    aboutTag: string
    aboutText: string
    globePill: string
    btnCv: string
    btnProjects: string
    btnContact: string
    profileRole: string
    profileStatus: string
    ticker: string[]
    swRibbon: string
    swTitle: string
    swViewAll: string
    openDossier: string
    servicesTag: string
    services: { n: string, t: string }[]
    manifestoTag: string
    manifestoQuote: string
    manifestoLead: string
    manifestoNoTrends: string
    manifestoOnlySolutions: string
    stackTag: string
    footerRibbon: string
    footerTitle: string
    footerSub: string
    footerContact: string
    stampText: string
  }
  collection: {
    grid: string
    table: string
    openDossier: string
    technicalDetails: string
    filterRecords: string
    tableIndex: string
    tableName: string
    tableSlug: string
    tableMeta: string
    removeFilter: string
  }
  detail: {
    dossierTab: string
    fieldsTab: string
    jsonTab: string
    copyJson: string
    copied: string
    prev: string
    next: string
    back: string
    liveDemo: string
    sourceCode: string
    visitOfficial: string
    statusLive: string
    statusWip: string
    copyEmail: string
    copyPhone: string
    sendEmail: string
    directMessage: string
    fieldLabels: Record<string, string>
  }
  goto: {
    placeholder: string
    empty: string
    whereDb: string
    whereProjects: string
    whereExperience: string
    whereStack: string
  }
}

export const translations: Record<'es' | 'en', LocaleContent> = {
  es: {
    nav: {
      db: '00 · base de datos',
      projects: '01 · proyectos',
      experience: '02 · experiencia',
      stack: '03 · stack técnico',
      about: '04 · sobre mí & cv',
      contact: '05 · contacto directo',
      shortDb: 'Inicio',
      shortProjects: 'Proyectos',
      shortExperience: 'Exp',
      shortStack: 'Stack',
      shortAbout: 'Sobre mí',
      shortContact: 'Contacto',
      explorer: 'EXPLORADOR',
      available: 'DISPONIBLE // 2026',
      engine: 'MOTOR: POSTGRESQL 17',
      admin: 'CONSOLA ADMIN ↗',
      searchPlaceholder: 'ir a proyecto, tecnología, sección...',
      searchTitle: 'Buscar [ / o Cmd+K ]',
      clockTitle: 'Hora local Patagonia, Argentina (UTC-3)',
      telemetryTitle: 'Conexión activa a base de datos PostgreSQL 17',
      themeDark: 'Cambiar a modo claro (papel técnico)',
      themeLight: 'Cambiar a modo oscuro (obsidiana)',
      focusEnable: 'Activar Modo Hiperfoco (H)',
      focusDisable: 'Desactivar Modo Hiperfoco (H)',
      langSwitch: 'Switch interface to English',
      back: 'retroceder en el historial',
      forward: 'avanzar en el historial',
      up: 'subir al directorio padre',
      recordsCount: (n: number) => `${n} ${n === 1 ? 'registro' : 'registros'}`,
      keyAdjacent: 'vecino',
      keyNavigate: 'navegar',
      keyOpen: 'abrir',
      keyBack: 'volver',
      keySections: 'secciones',
      keyGoto: 'ir a',
      keyHyperfocus: 'hiperfoco',
    },
    home: {
      roleTop: 'SOFTWARE ENGINEER // CREATIVE DEVELOPER',
      availTop: '● DISPONIBLE // 2026',
      headline: ['CONSTRUIR', 'CON', 'PROPÓSITO.'],
      aboutTag: 'SOBRE MÍ —',
      aboutText: 'Construyo productos digitales y arquitecturas de software que unen precisión relacional en PostgreSQL 17, APIs tipadas (TypeScript / Python) e interfaces reactivas contemporáneas con micro-interacciones espaciales. Mínimo ruido. Máximo impacto.',
      globePill: 'DISPONIBLE GLOBALMENTE · COLABORACIONES REMOTAS Y FREELANCE',
      btnCv: 'ABRIR CV COMPLETO (HARVARD / MODERNO)',
      btnProjects: 'VER TODOS LOS PROYECTOS (06)',
      btnContact: 'CONTACTAR',
      profileRole: 'DESARROLLADOR FULL STACK Y CREATIVO',
      profileStatus: '● DISPONIBLE // 2026',
      ticker: [
        '// POSTGRESQL 17 ACID RELACIONAL',
        'FASTAPI Y PYTHON IA ON-PREM',
        'VUE 3 Y NUXT 4 FULL-STACK',
        'LATENCIA LOCAL SUB-100MS',
        'DOSSIER HARVARD ATS Y MODERNO',
        'CONSTRUIR CON PROPÓSITO',
        'PATAGONIA AR · 2026',
      ],
      swRibbon: 'TRABAJOS SELECCIONADOS | PRODUCCIÓN REAL',
      swTitle: 'PRODUCCIÓN DESTACADA // CLIENTES REALES & TESIS',
      swViewAll: 'VER TODOS LOS PROYECTOS (06)',
      openDossier: 'ABRIR FICHA TÉCNICA',
      servicesTag: 'SERVICIOS —',
      services: [
        { n: '01', t: 'DESARROLLO FRONTEND REACTIVO' },
        { n: '02', t: 'ARQUITECTURA DE APIS & BACKEND' },
        { n: '03', t: 'MODELADO RELACIONAL POSTGRESQL 17 ACID' },
        { n: '04', t: 'DISEÑO UI/UX DE ALTA FIDELIDAD' },
        { n: '05', t: 'ANIMACIÓN ESPACIAL GSAP & SHADERS' },
        { n: '06', t: 'IA ON-PREM & BASES VECTORIALES' },
      ],
      manifestoTag: 'MANIFIESTO DE DISEÑO —',
      manifestoQuote: "EL BUEN CÓDIGO NO ES SOLO CÓMO SE VE.<br>ES CÓMO CORRE, A QUIÉN SIRVE Y QUÉ REPRESENTA.",
      manifestoLead: 'DISEÑO CON PROPÓSITO.<br>CONSTRUYO CON PRECISIÓN.<br>ENTREGO CON ORGULLO.',
      manifestoNoTrends: 'SIN MODAS.',
      manifestoOnlySolutions: 'SOLO SOLUCIONES.',
      stackTag: 'ARSENAL TÉCNICO —',
      footerRibbon: 'CONSTRUYAMOS ALGO GRANDE. ■',
      footerTitle: '¿LISTO PARA POTENCIAR TU PRESENCIA DIGITAL?',
      footerSub: 'DISPONIBLE PARA EQUIPOS DE INGENIERÍA, FREELANCE INTERNACIONAL Y PROYECTOS DE ALTO IMPACTO.',
      footerContact: 'CONTACTO —',
      stampText: 'ESTRATEGIA · CÓDIGO · ARQUITECTURA · OFICIO ·',
    },
    collection: {
      grid: 'GRILLA',
      table: 'TABLA',
      openDossier: 'ABRIR DOSSIER TÉCNICO',
      technicalDetails: 'DETALLES TÉCNICOS',
      filterRecords: 'FILTRAR REGISTROS',
      tableIndex: '#',
      tableName: 'REGISTRO / NOMBRE',
      tableSlug: 'SLUG',
      tableMeta: 'METADATO',
      removeFilter: 'quitar el filtro',
    },
    detail: {
      dossierTab: 'FICHA TÉCNICA',
      fieldsTab: 'CAMPOS CRUDOS',
      jsonTab: 'JSON CRUDO',
      copyJson: 'COPIAR JSON',
      copied: 'COPIADO',
      prev: 'ANTERIOR',
      next: 'SIGUIENTE',
      back: 'VOLVER',
      liveDemo: 'DEMO EN VIVO',
      sourceCode: 'CÓDIGO FUENTE',
      visitOfficial: 'VISITAR SITIO OFICIAL',
      statusLive: '● EN PRODUCCIÓN',
      statusWip: '● EN DESARROLLO',
      copyEmail: 'COPIAR EMAIL',
      copyPhone: 'COPIAR TELÉFONO',
      sendEmail: 'ENVIAR MENSAJE',
      directMessage: 'MENSAJE DIRECTO',
      fieldLabels: {
        summary: 'síntesis ejecutiva',
        media: 'capturas & piezas multimedia',
        brief: 'encargo / brief',
        outcome: 'resultado en producción',
        steps: 'proceso de ingeniería (taller)',
        metrics: 'telemetría & métricas lighthouse',
        techs: 'arsenal tecnológico',
        links: 'enlaces directos',
        url: 'sitio en vivo',
        repo: 'código en github',
        year: 'año de entrega',
        role: 'rol desempeñado',
        status: 'estado de producción',
        org: 'cliente / organización',
        featured: 'proyecto destacado',
        publishedAt: 'publicado en',
        updatedAt: 'última actualización',
        slug: 'identificador',
        startedAt: 'fecha de inicio',
        endedAt: 'fecha de culminación',
        story: 'relato de aprendizajes e impacto',
        name: 'tecnología',
        category: 'categoría',
        since: 'año de adopción',
        note: 'criterio técnico de uso',
        projects: 'proyectos en que se usó',
        experiences: 'etapas en que se usó',
        color: 'color distintivo',
      },
    },
    goto: {
      placeholder: 'Escribe para buscar proyectos, tecnologías, experiencia...',
      empty: 'Sin resultados para',
      whereDb: 'db',
      whereProjects: 'proyectos',
      whereExperience: 'experiencia',
      whereStack: 'stack',
    },
  },
  en: {
    nav: {
      db: '00 · database root',
      projects: '01 · projects',
      experience: '02 · experience',
      stack: '03 · tech stack',
      about: '04 · about & resume',
      contact: '05 · direct contact',
      shortDb: 'Home',
      shortProjects: 'Projects',
      shortExperience: 'Exp',
      shortStack: 'Stack',
      shortAbout: 'About',
      shortContact: 'Contact',
      explorer: 'EXPLORER',
      available: 'AVAILABLE // 2026',
      engine: 'ENGINE: POSTGRESQL 17',
      admin: 'ADMIN CONSOLE ↗',
      searchPlaceholder: 'go to project, tech, section...',
      searchTitle: 'Search [ / or Cmd+K ]',
      clockTitle: 'Local time Patagonia, Argentina (UTC-3)',
      telemetryTitle: 'Active connection to PostgreSQL 17 database',
      themeDark: 'Switch to light mode (technical paper)',
      themeLight: 'Switch to dark mode (obsidian)',
      focusEnable: 'Enable Hyperfocus Mode (H)',
      focusDisable: 'Disable Hyperfocus Mode (H)',
      langSwitch: 'Cambiar interfaz a Español',
      back: 'go back in history',
      forward: 'go forward in history',
      up: 'navigate up to parent folder',
      recordsCount: (n: number) => `${n} ${n === 1 ? 'record' : 'records'}`,
      keyAdjacent: 'adjacent',
      keyNavigate: 'navigate',
      keyOpen: 'open',
      keyBack: 'back',
      keySections: 'sections',
      keyGoto: 'goto',
      keyHyperfocus: 'hyperfocus',
    },
    home: {
      roleTop: 'SOFTWARE ENGINEER // CREATIVE DEVELOPER',
      availTop: '● AVAILABLE // 2026',
      headline: ['ENGINEER', 'WITH', 'INTENT.'],
      aboutTag: 'ABOUT ME —',
      aboutText: 'I build digital products and software architectures combining relational precision in PostgreSQL 17, typed APIs (TypeScript / Python), and contemporary reactive interfaces with spatial micro-interactions. Minimal noise. Maximum impact.',
      globePill: 'AVAILABLE WORLDWIDE · REMOTE & FREELANCE COLLABS',
      btnCv: 'OPEN FULL RESUME (HARVARD / MODERN)',
      btnProjects: 'VIEW ALL PROJECTS (06)',
      btnContact: 'CONTACT',
      profileRole: 'FULL STACK & CREATIVE DEVELOPER',
      profileStatus: '● AVAILABLE // 2026',
      ticker: [
        '// POSTGRESQL 17 ACID RELATIONAL',
        'FASTAPI & PYTHON ON-PREM AI',
        'VUE 3 & NUXT 4 FULL-STACK',
        'SUB-100MS LOCAL LATENCY',
        'HARVARD ATS & MODERN DOSSIER',
        'ENGINEER WITH INTENT',
        'PATAGONIA AR · 2026',
      ],
      swRibbon: 'SELECTED WORK | REAL PRODUCTION',
      swTitle: 'FEATURED PRODUCTION // REAL CLIENTS & THESIS',
      swViewAll: 'VIEW ALL PROJECTS (06)',
      openDossier: 'VIEW TECHNICAL DOSSIER',
      servicesTag: 'SERVICES —',
      services: [
        { n: '01', t: 'REACTIVE FRONTEND DEVELOPMENT' },
        { n: '02', t: 'API ARCHITECTURE & BACKEND' },
        { n: '03', t: 'POSTGRESQL 17 ACID RELATIONAL MODELING' },
        { n: '04', t: 'HIGH-FIDELITY UI/UX DESIGN' },
        { n: '05', t: 'GSAP SPATIAL ANIMATION & SHADERS' },
        { n: '06', t: 'ON-PREM AI & VECTOR DATABASES' },
      ],
      manifestoTag: 'DESIGN MANIFESTO —',
      manifestoQuote: "GOOD CODE ISN'T JUST ABOUT HOW IT LOOKS.<br>IT'S ABOUT HOW IT RUNS, WHO IT SERVES, AND WHAT IT STANDS FOR.",
      manifestoLead: 'I DESIGN WITH PURPOSE.<br>I BUILD WITH PRECISION.<br>I DELIVER WITH PRIDE.',
      manifestoNoTrends: 'NO TRENDS.',
      manifestoOnlySolutions: 'ONLY SOLUTIONS.',
      stackTag: 'TECH STACK —',
      footerRibbon: "LET'S BUILD SOMETHING BOLD. ■",
      footerTitle: 'READY TO ELEVATE YOUR DIGITAL PRESENCE?',
      footerSub: 'AVAILABLE FOR ENGINEERING TEAMS, INTERNATIONAL FREELANCE & HIGH-IMPACT PROJECTS.',
      footerContact: 'CONTACT —',
      stampText: 'STRATEGY · CODE · ARCHITECTURE · CRAFT ·',
    },
    collection: {
      grid: 'GRID',
      table: 'TABLE',
      openDossier: 'OPEN TECHNICAL DOSSIER',
      technicalDetails: 'TECHNICAL DETAILS',
      filterRecords: 'FILTER RECORDS',
      tableIndex: '#',
      tableName: 'RECORD / NAME',
      tableSlug: 'SLUG',
      tableMeta: 'METADATA',
      removeFilter: 'remove filter',
    },
    detail: {
      dossierTab: 'TECHNICAL DOSSIER',
      fieldsTab: 'RAW FIELDS',
      jsonTab: 'RAW JSON',
      copyJson: 'COPY JSON',
      copied: 'COPIED',
      prev: 'PREVIOUS',
      next: 'NEXT',
      back: 'BACK',
      liveDemo: 'LIVE DEMO',
      sourceCode: 'SOURCE CODE',
      visitOfficial: 'VISIT OFFICIAL SITE',
      statusLive: '● LIVE PRODUCTION',
      statusWip: '● IN DEVELOPMENT',
      copyEmail: 'COPY EMAIL',
      copyPhone: 'COPY PHONE',
      sendEmail: 'SEND MESSAGE',
      directMessage: 'DIRECT MESSAGE',
      fieldLabels: {
        summary: 'executive summary',
        media: 'screenshots & media assets',
        brief: 'project brief / challenge',
        outcome: 'production outcome',
        steps: 'engineering process (workshop)',
        metrics: 'telemetry & lighthouse metrics',
        techs: 'technological stack',
        links: 'direct links',
        url: 'live website',
        repo: 'github repository',
        year: 'delivery year',
        role: 'role performed',
        status: 'production status',
        org: 'client / organization',
        featured: 'featured project',
        publishedAt: 'published at',
        updatedAt: 'last updated',
        slug: 'identifier',
        startedAt: 'start date',
        endedAt: 'completion date',
        story: 'learnings and impact narrative',
        name: 'technology',
        category: 'category',
        since: 'adoption year',
        note: 'technical selection criteria',
        projects: 'projects applied in',
        experiences: 'career stages applied in',
        color: 'distinctive color',
      },
    },
    goto: {
      placeholder: 'Type to search projects, tech, experience...',
      empty: 'No results for',
      whereDb: 'db',
      whereProjects: 'projects',
      whereExperience: 'experience',
      whereStack: 'stack',
    },
  },
}

// Traducciones especializadas de Proyectos para bilingüismo integral
export const projectTranslations: Record<string, { summary: { es: string, en: string }, orgDesc?: { es: string, en: string }, brief?: { es: string, en: string }, outcome?: { es: string, en: string } }> = {
  'la-rucula': {
    summary: {
      es: 'Sitio editorial menu-first para un restaurante frente al mar en Chiclana. Cliente real, en producción.',
      en: 'Editorial menu-first website for a beachfront restaurant in Chiclana. Real client, in live production.',
    },
    orgDesc: {
      es: 'Restauración & Gastronomía · Chiclana de la Frontera, ES',
      en: 'Hospitality & Dining · Chiclana de la Frontera, Spain',
    },
    brief: {
      es: 'El restaurante operaba con un PDF escaneado difícil de leer en pantallas móviles. El objetivo fue diseñar una experiencia web menu-first optimizada para escaneo QR en mesa, con navegación por categorías y tiempos de carga instantáneos.',
      en: 'The restaurant operated with a scanned PDF that was cumbersome to read on mobile screens. The objective was to engineer a menu-first web experience optimized for in-table QR scanning, featuring instant category navigation and sub-second load times.',
    },
    outcome: {
      es: 'En producción con más de 1.200 visitas mensuales por QR. Lighthouse 99 en Performance y 100 en SEO. Integración con panel de gestión propio y sincronización local para funcionamiento offline si la red se interrumpe.',
      en: 'In production with over 1,200 monthly QR visits. Lighthouse 99 Performance and 100 SEO. Integrated with custom CMS dashboard and local offline sync if mobile connectivity drops.',
    },
  },
  'argpiscinas': {
    summary: {
      es: 'Web corporativa multi-idioma (ES/EN/DE) con panel admin y blog para una constructora de piscinas en Andalucía. Cliente real, en producción.',
      en: 'Multi-lingual corporate website (ES/EN/DE) with admin dashboard and blog for a swimming pool builder in Andalusia. Real client, in live production.',
    },
    orgDesc: {
      es: 'Arquitectura & Construcción · Andalucía, ES',
      en: 'Architecture & Construction · Andalusia, Spain',
    },
    brief: {
      es: 'La empresa necesitaba presencia digital internacional para captar clientes en España, Reino Unido y Alemania, junto a un catálogo de obras autoadministrable que no dependiera de desarrolladores para actualizarse.',
      en: 'The company required an international digital presence to attract clients across Spain, the UK, and Germany, alongside an autonomous project portfolio manageable without technical intervention.',
    },
    outcome: {
      es: 'Plataforma en producción con catálogo de más de 40 proyectos filtrables por tipología de vaso y revestimiento. Panel autónomo con autenticación segura y persistencia PostgreSQL vía Prisma.',
      en: 'Live production platform featuring a portfolio of over 40 projects filterable by pool structure and finishes. Autonomous dashboard with secure auth and PostgreSQL persistence via Prisma.',
    },
  },
  'ynara': {
    summary: {
      es: 'Asistente de IA adaptativo on-premise en rioplatense, con memoria cifrada vectorial sobre Postgres y pgvector. Tesis preaprobada.',
      en: 'Adaptive on-premise AI assistant in Argentine Spanish, featuring encrypted vector memory over Postgres and pgvector. Pre-approved thesis.',
    },
    orgDesc: {
      es: 'Tesis Da Vinci (Preaprobada 2026) · 382 commits',
      en: 'Da Vinci Thesis (Pre-approved 2026) · 382 commits',
    },
    brief: {
      es: 'La mayoría de los asistentes de IA dependen de APIs centralizadas y almacenamiento en la nube, comprometiendo la privacidad de los datos personales. Ynara se propuso demostrar la viabilidad de un asistente conversacional 100% privado con inferencia local y memoria adaptativa.',
      en: 'Most AI assistants depend on centralized cloud APIs, compromising user privacy. Ynara aims to prove the viability of a 100% private conversational assistant with local inference and adaptive contextual memory.',
    },
    outcome: {
      es: '382 commits en seis semanas liderando la arquitectura del sistema. Inferencia local mediante modelos cuantizados, pipelines RAG con embeddings en PostgreSQL (pgvector) y frontend reactivo con streaming en tiempo real.',
      en: '382 commits in six weeks leading system architecture. Local inference via quantized models, RAG embedding pipelines in PostgreSQL (pgvector), and a reactive frontend with real-time response streaming.',
    },
  },
  'barberpole': {
    summary: {
      es: 'SaaS de gestión para peluquerías y barberías: turnos, servicios, clientes y caja en un solo lugar.',
      en: 'Management SaaS for barbershops and salons: bookings, services, clients, and revenue tracking in one place.',
    },
    orgDesc: {
      es: 'Producto propio · Diseño y desarrollo MERN',
      en: 'Proprietary product · MERN design and development',
    },
  },
  'ynara-web': {
    summary: {
      es: 'Landing inmersiva WebGL para Ynara: una forma de luz que muta y reacciona al scroll. Puerta de entrada pública a la tesis.',
      en: 'Immersive WebGL landing page for Ynara: a lightform that mutates and reacts to scroll velocity. Public entry to the thesis.',
    },
  },
  'ergio': {
    summary: {
      es: 'Estudio de arquitectura y diseño interior: catálogo de obras monolítico, tipografía brutalista y fichas de proyecto editoriales.',
      en: 'Architecture and interior design studio: monolithic work catalogue, brutalist typography, and editorial project records.',
    },
  },
  'eros': {
    summary: {
      es: 'Director creativo autónomo asistido por IA con su base de conocimiento en un vault de Obsidian.',
      en: 'Autonomous AI creative director with its knowledge base rooted in an Obsidian vault.',
    },
  },
}

// Traducciones para Etapas de Experiencia Profesional
export const experienceTranslations: Record<string, { role: { es: string, en: string }, summary: { es: string, en: string } }> = {
  freelance: {
    role: {
      es: 'Freelance · diseño y desarrollo web',
      en: 'Freelance · Web Design & Development',
    },
    summary: {
      es: 'Alrededor de diez proyectos reales para clientes desde 2023. El primero: la web de un estudio de arquitectura.',
      en: 'Approximately ten real client projects delivered since 2023. First project: an architecture studio website.',
    },
  },
  'arg-piscinas': {
    role: {
      es: 'Freelance · front y back a medida',
      en: 'Freelance · Custom Full Stack & Admin Panel',
    },
    summary: {
      es: 'Web corporativa multi-idioma (ES/EN/DE) con panel admin y blog para una constructora de piscinas en Andalucía.',
      en: 'Multilingual corporate platform (ES/EN/DE) with custom admin panel and blog for a pool builder in Andalusia.',
    },
  },
  'la-rucula': {
    role: {
      es: 'Freelance · diseño y desarrollo',
      en: 'Freelance · Web Design & Engineering',
    },
    summary: {
      es: 'Sitio editorial menu-first para un restaurante frente al mar en Chiclana. Cliente real, en producción.',
      en: 'Editorial menu-first website for a beachfront restaurant in Chiclana. Real client, in live production.',
    },
  },
  'ynara': {
    role: {
      es: 'Tesis en equipo · Contribuidor Principal (382 commits)',
      en: 'Team Degree Thesis · Lead Contributor (382 commits)',
    },
    summary: {
      es: '382 commits liderando la arquitectura técnica y el frontend del asistente de IA adaptativo.',
      en: '382 commits leading technical architecture and frontend for the adaptive AI assistant.',
    },
  },
}

