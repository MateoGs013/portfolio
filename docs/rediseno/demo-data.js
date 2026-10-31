// Contenido real exportado de https://mateogs.tech/api el 30-oct-2026. Generado, no editar a mano (salvo el registro de Eros, reescrito como propuesta el 30-oct-2026). Los tintes de portada (cover.tint) salen de la imagen.
window.DATA = {
 "projects": [
  {
   "slug": "la-rucula",
   "title": "La Rúcula Gastrobar",
   "year": 2026,
   "role": "Freelance · diseño y desarrollo",
   "status": "LIVE",
   "featured": true,
   "summary": "Sitio editorial menu-first para un restaurante frente al mar en Chiclana. Cliente real, en producción.",
   "brief": "La Rúcula necesitaba dejar de ser un PDF escaneado colgado de un QR. El brief real: que la carta se sienta tan cuidada como el plato, y que el dueño pueda editarla sin llamar a nadie.",
   "outcome": "En producción en laruculagastrobar.es. Modo QR optimizado para llegada directa desde la mesa. Multi-locale con preservación del idioma entre rutas. Review UX y accesibilidad automatizadas antes de cada deploy.",
   "url": "https://laruculagastrobar.es/",
   "repo": "https://github.com/MateoGs013/LaRucula",
   "org": "La Rúcula Gastrobar",
   "techs": [
    "GSAP",
    "Lenis",
    "Tailwind CSS",
    "Vite",
    "Vue 3"
   ],
   "cover": {
    "src": "https://mateogs.tech/media/projects/la-rucula.jpg",
    "w": 2880,
    "h": 1800,
    "bytes": 218308,
    "alt": "Home de La Rúcula Gastrobar: titular editorial sobre fotografía de la costa",
    "tint": "#b97e46"
   },
   "metrics": {
    "lcp": "0.8s",
    "seoScore": 100,
    "localeCount": 2,
    "bundleSizeKb": 42,
    "performanceScore": 99,
    "accessibilityScore": 100,
    "bestPracticesScore": 100
   },
   "steps": [
    {
     "title": "01 · encargo",
     "body": "De un encargo de \"página de restaurante\" a una experiencia menu-first pensada para el QR en la mesa. La carta tenía que sentirse tan cuidada como el plato."
    },
    {
     "title": "02 · taller",
     "body": "Arquitectura menu-first: el sitio se reduce a /, /menu y /menu/:slug. La mayoría del tráfico entra por QR, así que el menú es el producto. El contenido del shell vive en un CMS propio con fallback local: si la API duerme, el sitio no. Antes de cerrar una sección, review visual con Playwright en tres viewports y baseline de accesibilidad con axe."
    },
    {
     "title": "03 · pieza",
     "body": "Home inmersiva de dirección de arte mediterránea: editorial, calma, lejos del layout genérico de restaurante. Motion con significado: reveals de línea, stagger tipográfico y acentos SVG de trazo manual. La regla del proyecto: cohesión sobre novedad."
    }
   ],
   "updatedAt": "2026-10-05T12:29:50.139Z"
  },
  {
   "slug": "argpiscinas",
   "title": "ARG Piscinas",
   "year": 2026,
   "role": "Freelance · front y back a medida",
   "status": "LIVE",
   "featured": true,
   "summary": "Web corporativa multi-idioma (ES/EN/DE) con panel admin y blog para una constructora de piscinas en Andalucía. Cliente real, en producción.",
   "brief": "ARG venía de mostrar su trabajo por WhatsApp, foto por foto. El brief: un catálogo serio que muestre obra real, presupuesto en línea, y un panel que el propio cliente pueda operar sin depender de nadie.",
   "outcome": "En producción en argpiscinas.es. Panel autoadministrable: el cliente carga obra sin tocar código. Catálogo tipado de punta a punta con Prisma. Tres idiomas.",
   "url": "https://www.argpiscinas.es/",
   "repo": "https://github.com/MateoGs013/argpiscinas",
   "org": "ARG Piscinas",
   "techs": [
    "GSAP",
    "Node.js",
    "Prisma",
    "Tailwind CSS",
    "Vite",
    "Vue 3"
   ],
   "cover": {
    "src": "https://mateogs.tech/media/projects/argpiscinas.jpg",
    "w": 2880,
    "h": 1800,
    "bytes": 540079,
    "alt": "Catálogo de ARG Piscinas con fotografías de obra terminada",
    "tint": "#508daf"
   },
   "metrics": {
    "lcp": "0.9s",
    "seoScore": 100,
    "languages": [
     "ES",
     "EN",
     "DE"
    ],
    "bundleSizeKb": 58,
    "performanceScore": 98,
    "accessibilityScore": 98,
    "bestPracticesScore": 100
   },
   "steps": [
    {
     "title": "01 · encargo",
     "body": "Una constructora de piscinas que necesitaba mostrar obra terminada y cotizar sin fricción, en tres idiomas."
    },
    {
     "title": "02 · taller",
     "body": "Dos cuerpos sobre una misma API: catálogo público y panel de gestión. Node y Prisma con datos tipados de punta a punta. La obra que carga el cliente es exactamente la que muestra el sitio, sin intermediarios ni deploys de por medio."
    },
    {
     "title": "03 · pieza",
     "body": "Front Vue 3 directo y rápido: la obra primero, el argumento después. Catálogo, presupuesto y contacto en el camino más corto posible. El sitio trabaja como la empresa: sin vueltas."
    }
   ],
   "updatedAt": "2026-10-05T12:29:50.159Z"
  },
  {
   "slug": "ynara",
   "title": "Ynara",
   "year": 2026,
   "role": "Tesis Da Vinci 2026 · contribuidor principal, 382 commits",
   "status": "WIP",
   "featured": true,
   "summary": "Tesis en equipo, preaprobada. Asistente personal de IA adaptativo y on-prem, con memoria cifrada semántica, episódica y procedural sobre Postgres y pgvector.",
   "brief": "Un asistente que corre en tu máquina, habla como vos y se acuerda. Dual LLM (Gemma y Qwen vía Ollama), memoria propia cifrada en tres capas, monorepo FastAPI, Next.js y Expo.",
   "outcome": "Tesis preaprobada con felicitaciones en Da Vinci. 382 commits liderando la arquitectura backend, base de datos vectorial y motor de inferencia local.",
   "url": null,
   "repo": "https://github.com/BriarDevv/Ynara",
   "org": "Escuela Da Vinci",
   "techs": [
    "FastAPI",
    "Next.js",
    "PostgreSQL",
    "Python",
    "React",
    "TypeScript"
   ],
   "cover": {
    "src": "https://mateogs.tech/media/projects/ynara-mtucqc2j.png",
    "w": 1280,
    "h": 720,
    "bytes": 394847,
    "alt": "Ynara asistente de IA adaptativo on-premise",
    "tint": "#426dbd"
   },
   "metrics": {
    "commits": 382,
    "localModels": [
     "Gemma 2B",
     "Qwen 2.5"
    ],
    "averageLatencyMs": 48,
    "encryptionLayers": 3,
    "vectorDimensions": 1536
   },
   "steps": [
    {
     "title": "01 · hipótesis",
     "body": "Los asistentes en la nube sacrifican privacidad y contexto local. La hipótesis: un modelo on-prem con memoria vectorial puede ser más rápido, privado y natural."
    },
    {
     "title": "02 · arquitectura",
     "body": "Monorepo con FastAPI para orquestación de embeddings y llamadas a Ollama; PostgreSQL 17 con pgvector para búsqueda por similitud coseno; Next.js 14 en frontend web y Expo para móvil."
    },
    {
     "title": "03 · resultado",
     "body": "Respuestas contextualizadas con menos de 50ms de latencia de consulta interna y almacenamiento local 100% cifrado."
    }
   ],
   "updatedAt": "2026-10-05T12:29:50.167Z"
  },
  {
   "slug": "barberpole",
   "title": "Barberpole",
   "year": 2026,
   "role": "Producto propio · diseño y desarrollo",
   "status": "LIVE",
   "featured": false,
   "summary": "SaaS de gestión para peluquerías y barberías: turnos, servicios, clientes y caja en un solo lugar.",
   "brief": "El mostrador era el cuello de botella: reservas por teléfono y cuaderno. El sistema saca los turnos del teléfono y los pone en la agenda, del turno a la caja.",
   "outcome": "En producción y validado. MERN completo con auth por roles, agenda del día, precios y duraciones reales de servicio.",
   "url": "https://parcial-2-peluqueria.vercel.app/",
   "repo": "https://github.com/MateoGs013/barberpole",
   "org": null,
   "techs": [
    "Express",
    "MongoDB",
    "Node.js",
    "React"
   ],
   "cover": {
    "src": "https://mateogs.tech/media/projects/barberpole.png",
    "w": 2880,
    "h": 1800,
    "bytes": 144234,
    "alt": "Agenda del día de barberpole con turnos y servicios",
    "tint": "#ca354d"
   },
   "metrics": {
    "lcp": "1.1s",
    "seoScore": 95,
    "bundleSizeKb": 64,
    "performanceScore": 95,
    "accessibilityScore": 96,
    "bestPracticesScore": 100
   },
   "steps": [
    {
     "title": "01 · problema",
     "body": "El mostrador era el cuello de botella. Reservas por teléfono, cuaderno y memoria."
    },
    {
     "title": "02 · sistema",
     "body": "MERN completo: turnos, servicios, clientes y caja en un solo lugar. Auth por roles, agenda del día, precios y duraciones reales."
    },
    {
     "title": "03 · identidad",
     "body": "Identidad de barbería de barrio inspirada en el barber pole: neo-brutalista, directa, sin adornos. El mostrador respira."
    }
   ],
   "updatedAt": "2026-10-05T12:29:50.176Z"
  },
  {
   "slug": "ynara-web",
   "title": "Ynara Web",
   "year": 2026,
   "role": "Landing inmersiva · diseño y desarrollo",
   "status": "WIP",
   "featured": false,
   "summary": "Landing inmersiva WebGL para Ynara: una forma de luz que muta y reacciona al scroll. Puerta de entrada pública a la tesis.",
   "brief": "Una experiencia espacial que no se navega: se recorre. La narrativa visual se dibuja primero; los shaders entran al servicio de la atmósfera.",
   "outcome": "Shader procedural reactivo a la velocidad de scroll con fallback elegante para dispositivos de baja potencia.",
   "url": null,
   "repo": "https://github.com/MateoGs013/Ynara-Web",
   "org": null,
   "techs": [
    "GSAP",
    "Lenis",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Three.js",
    "TypeScript"
   ],
   "cover": null,
   "metrics": {
    "drawCalls": 4,
    "fpsTarget": 60,
    "bundleSizeKb": 78
   },
   "steps": [
    {
     "title": "01 · concepto",
     "body": "Traducir la inteligencia artificial adaptativa a una entidad lumínica tridimensional."
    },
    {
     "title": "02 · shaders",
     "body": "Vertex y fragment shaders personalizados en GLSL sobre Three.js orquestados con GSAP ScrollTrigger."
    }
   ],
   "updatedAt": "2026-10-05T12:29:50.185Z"
  },
  {
   "slug": "eros",
   "title": "Eros",
   "year": 2026,
   "role": "Producto propio · diseño y desarrollo",
   "status": "WIP",
   "featured": false,
   "summary": "Asistente de carrera autónomo: rastrea vacantes, las evalúa con IA, adapta el CV Harvard ATS a cada una y genera contenido técnico para LinkedIn, X y Dev.to.",
   "brief": "Automatizar la búsqueda laboral de punta a punta: encontrar vacantes en varios portales, decidir cuáles valen la pena, adaptar el CV a cada una y sostener una presencia técnica en redes sin dedicarle horas todos los días.",
   "outcome": "En producción en eros.mateogs.tech e integrado a la consola del portafolio como Eros AI Suite: Job Hunter, Contenido omnicanal y TrendRadar.",
   "url": null,
   "repo": "https://github.com/MateoGs013/eros",
   "org": null,
   "techs": [
    "GSAP",
    "Lenis",
    "Python",
    "Vue 3"
   ],
   "cover": null,
   "metrics": null,
   "steps": [
    {
     "title": "01 · fuentes",
     "body": "Rastreo de vacantes en LinkedIn, Get on Board y RemoteOK, con filtros de stack, modalidad y salario."
    },
    {
     "title": "02 · evaluación",
     "body": "Cada vacante pasa por Gemini: porcentaje de match, fortalezas, objeciones probables, skills que faltan y qué proyectos del portafolio conviene citar."
    },
    {
     "title": "03 · postulación",
     "body": "CV Harvard ATS adaptado a la vacante en una página A4, email de postulación y nota de conexión para el hiring lead detectado en LinkedIn."
    },
    {
     "title": "04 · contenido",
     "body": "TrendRadar detecta temas técnicos afines al stack en Hacker News, Dev.to y GitHub, y el módulo omnicanal los convierte en post de LinkedIn, hilo de X, artículo de Dev.to y carrusel PDF."
    }
   ],
   "updatedAt": "2026-10-05T12:29:50.198Z"
  }
 ],
 "experience": [
  {
   "slug": "ynara",
   "role": "Tesis en equipo · contribuidor principal",
   "startedAt": "2026-05-18",
   "endedAt": "2026-06-28",
   "summary": "382 commits en seis semanas sobre Ynara, la tesis: asistente de IA on-prem con FastAPI, Next.js, Expo y Postgres con pgvector. Preaprobada; falta la defensa.",
   "org": "Escuela Da Vinci",
   "techs": [
    "FastAPI",
    "Next.js",
    "PostgreSQL",
    "Python",
    "TypeScript"
   ]
  },
  {
   "slug": "la-rucula",
   "role": "Freelance · diseño y desarrollo",
   "startedAt": "2026-03-17",
   "endedAt": "2026-07-20",
   "summary": "Sitio editorial menu-first con panel de gestión propio. En producción.",
   "org": "La Rúcula Gastrobar",
   "techs": [
    "GSAP",
    "Lenis",
    "Tailwind CSS",
    "Vue 3"
   ]
  },
  {
   "slug": "arg-piscinas",
   "role": "Freelance · front y back a medida",
   "startedAt": "2026-01-28",
   "endedAt": "2026-07-20",
   "summary": "Web corporativa en tres idiomas con panel de gestión y blog. En producción.",
   "org": "ARG Piscinas",
   "techs": [
    "GSAP",
    "Node.js",
    "Prisma",
    "Tailwind CSS",
    "Vue 3"
   ]
  },
  {
   "slug": "escuela-da-vinci",
   "role": "Estudiante · Diseño y Desarrollo Web",
   "startedAt": "2024-03-01",
   "endedAt": null,
   "summary": "Carrera en curso, promoción 2026. UI/UX, dirección visual, front moderno, back, bases de datos y arquitectura. Tesis preaprobada: Ynara.",
   "org": "Escuela Da Vinci",
   "techs": [
    "FastAPI",
    "Laravel",
    "MongoDB",
    "PHP",
    "PostgreSQL",
    "React",
    "Vue 3"
   ]
  },
  {
   "slug": "freelance",
   "role": "Freelance · diseño y desarrollo web",
   "startedAt": "2023-01-01",
   "endedAt": null,
   "summary": "Alrededor de diez proyectos reales para clientes desde 2023. El primero: la web de un estudio de arquitectura.",
   "org": null,
   "techs": [
    "JavaScript",
    "Laravel",
    "Node.js",
    "React",
    "TypeScript",
    "Vue 3"
   ]
  },
  {
   "slug": "cet-30",
   "role": "Técnico en Programación",
   "startedAt": "2017-03-01",
   "endedAt": "2023-12-01",
   "summary": "Programación en el CET N.º 30, Río Negro. Título de Técnico en Programación en 2023.",
   "org": "CET N.º 30",
   "techs": [
    "JavaScript",
    "PHP"
   ]
  }
 ],
 "stack": [
  {
   "slug": "angular",
   "name": "Angular",
   "category": "FRAMEWORK",
   "since": 2022,
   "note": "Arquitectura corporativa basada en RxJS y Dependency Injection.",
   "projects": []
  },
  {
   "slug": "javascript",
   "name": "JavaScript",
   "category": "LANGUAGE",
   "since": 2022,
   "note": "Fundamento del desarrollo web moderno, estándares ECMAScript y manipulación del DOM nativo.",
   "projects": []
  },
  {
   "slug": "typescript",
   "name": "TypeScript",
   "category": "LANGUAGE",
   "since": 2023,
   "note": "Estándar obligatorio en cliente y servidor: si no está tipado en compilación, no llega a producción.",
   "projects": [
    "ynara",
    "ynara-web"
   ]
  },
  {
   "slug": "express",
   "name": "Express",
   "category": "BACKEND",
   "since": 2024,
   "note": "Minimalismo y control total sobre el ciclo de vida HTTP, routing y autenticación.",
   "projects": [
    "barberpole"
   ]
  },
  {
   "slug": "firebase",
   "name": "Firebase",
   "category": "DATA",
   "since": 2024,
   "note": "Plataforma BaaS para base de datos NoSQL reactiva y autenticación social rápida.",
   "projects": []
  },
  {
   "slug": "node",
   "name": "Node.js",
   "category": "BACKEND",
   "since": 2024,
   "note": "Runtime de alto rendimiento para APIs REST livianas, pipelines de middleware y servidores de eventos.",
   "projects": [
    "argpiscinas",
    "barberpole"
   ]
  },
  {
   "slug": "php",
   "name": "PHP",
   "category": "LANGUAGE",
   "since": 2025,
   "note": "Lenguaje backend tradicional utilizado en integraciones y módulos transaccionales de clientes.",
   "projects": []
  },
  {
   "slug": "vite",
   "name": "Vite",
   "category": "TOOLING",
   "since": 2025,
   "note": "Tooling ultra veloz basado en Rollup y esbuild para HMR instantáneo en desarrollo.",
   "projects": [
    "la-rucula",
    "argpiscinas"
   ]
  },
  {
   "slug": "vue",
   "name": "Vue 3",
   "category": "FRAMEWORK",
   "since": 2025,
   "note": "Elegido por reactividad quirúrgica, Composition API limpia y tipado estricto sin sobrecarga de boilerplate.",
   "projects": [
    "la-rucula",
    "argpiscinas",
    "eros"
   ]
  },
  {
   "slug": "fastapi",
   "name": "FastAPI",
   "category": "BACKEND",
   "since": 2026,
   "note": "Core de inferencia y procesamiento de IA/NLP con tipado Pydantic y latencia mínima.",
   "projects": [
    "ynara"
   ]
  },
  {
   "slug": "gsap",
   "name": "GSAP",
   "category": "MOTION",
   "since": 2026,
   "note": "Orquestación temporal determinista para interfaces de alta precisión y micro-interacciones espaciales.",
   "projects": [
    "la-rucula",
    "argpiscinas",
    "ynara-web",
    "eros"
   ]
  },
  {
   "slug": "laravel",
   "name": "Laravel",
   "category": "BACKEND",
   "since": 2026,
   "note": "Monolito robusto con Eloquent ORM, autenticación por sesión y colas de trabajo para plataformas transaccionales.",
   "projects": []
  },
  {
   "slug": "lenis",
   "name": "Lenis",
   "category": "MOTION",
   "since": 2026,
   "note": "Scroll inercial normalizado multiplataforma sin romper el comportamiento nativo del navegador.",
   "projects": [
    "la-rucula",
    "ynara-web",
    "eros"
   ]
  },
  {
   "slug": "mongodb",
   "name": "MongoDB",
   "category": "DATA",
   "since": 2026,
   "note": "Base NoSQL orientada a documentos para prototipado ágil y esquemas dinámicos en Barberpole.",
   "projects": [
    "barberpole"
   ]
  },
  {
   "slug": "next",
   "name": "Next.js",
   "category": "FRAMEWORK",
   "since": 2026,
   "note": "Framework full-stack de React con optimización de assets, routing por sistema de archivos y SSR.",
   "projects": [
    "ynara",
    "ynara-web"
   ]
  },
  {
   "slug": "postgresql",
   "name": "PostgreSQL",
   "category": "DATA",
   "since": 2026,
   "note": "Persistencia relacional ACID, esquemas declarativos e índices vectoriales con pgvector.",
   "projects": [
    "ynara"
   ]
  },
  {
   "slug": "prisma",
   "name": "Prisma",
   "category": "DATA",
   "since": 2026,
   "note": "ORM tipado de punta a punta: genera tipos TypeScript exactos directamente desde el esquema SQL.",
   "projects": [
    "argpiscinas"
   ]
  },
  {
   "slug": "python",
   "name": "Python",
   "category": "LANGUAGE",
   "since": 2026,
   "note": "Lenguaje predilecto para ingeniería de datos, embeddings vectoriales y orquestación de LLMs.",
   "projects": [
    "ynara",
    "eros"
   ]
  },
  {
   "slug": "react",
   "name": "React",
   "category": "FRAMEWORK",
   "since": 2026,
   "note": "Ecosistema masivo, React Server Components y rendering híbrido adoptado en la tesis Ynara.",
   "projects": [
    "ynara",
    "barberpole",
    "ynara-web"
   ]
  },
  {
   "slug": "supabase",
   "name": "Supabase",
   "category": "DATA",
   "since": 2026,
   "note": "Backend-as-a-Service con Postgres en tiempo real, Row Level Security y storage S3.",
   "projects": []
  },
  {
   "slug": "tailwind",
   "name": "Tailwind CSS",
   "category": "TOOLING",
   "since": 2026,
   "note": "Sistema de diseño componible y utilitario con purga agresiva para bundles ultra ligeros.",
   "projects": [
    "la-rucula",
    "argpiscinas",
    "ynara-web"
   ]
  },
  {
   "slug": "three",
   "name": "Three.js",
   "category": "GRAPHICS",
   "since": 2026,
   "note": "WebGL y shaders GLSL para experiencias inmersivas 3D cuando el DOM no alcanza.",
   "projects": [
    "ynara-web"
   ]
  }
 ],
 "about": {
  "name": "Mateo Gabriel Sonzogni",
  "role": "Diseñador & Desarrollador Full Stack · Creative Developer",
  "location": "Río Negro, Patagonia Argentina",
  "technical_degree": "Técnico en Programación · CET N.º 30 (2017–2023)",
  "higher_education": "Diseño y Desarrollo Web · Escuela Da Vinci (2024–2026) · Tesis Preaprobada",
  "freelance_experience": "Activo desde 2023 · ",
  "availability_status": "DISPONIBLE // Búsqueda de equipo o proyectos de alto impacto",
  "work_modalities": "Remoto · Híbrido · Presencial",
  "timezone": "UTC-3 (Argentina / Compatible con US & EU)",
  "languages": "Español (Nativo) · Inglés (B2 Profesional Técnico)",
  "core_competencies": "Full-Cycle Engineering: Figma UI/UX → Frontend Reactivo → APIs REST/Microservicios → Postgres ACID → Deploy & Monitoreo",
  "engineering_philosophy": "Desarrollo con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. No me posiciono solo como programador ni solo como diseñador; trabajo la costura donde la arquitectura técnica se encuentra con la experiencia de usuario.",
  "professional_goal": "Consolidarme como desarrollador en un equipo con proyectos reales de mayor escala. A mediano plazo, liderazgo técnico: coordinar, organizar, comunicar y conectar perfiles de distintas áreas (diseño, producto, frontend y backend)."
 },
 "contact": {
  "email": "mateogabus@gmail.com",
  "github": "https://github.com/MateoGs013",
  "linkedin": "https://www.linkedin.com/in/mateo-sonzogni",
  "availability": "Inmediata · Contratación directa, contractor o freelance",
  "location": "Río Negro, AR (Disponible para relocalización o remoto)",
  "timezone": "UTC-3",
  "preferred_contact": "Email directo, LinkedIn o mensaje vía GitHub"
 },
 "headline": "Diseño y construyo productos web enteros, de la idea al deploy"
};
