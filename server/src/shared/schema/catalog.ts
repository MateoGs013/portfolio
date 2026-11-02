/** Descriptores de la trayectoria, los catálogos (tecnologías y empresas), los documentos y los artículos. */
import { field, foreignKey, relation, system, type ModelFields } from './field.js'

export const Experience = {
  id: system('Identificador', 'Lo asigna la base.'),
  slug: field('slug', 'Dirección', 'Identifica la entrada en /api/experience/…: se fija al crear y cambia solo con «Cambiar dirección».', { required: true, max: 80, surfaces: ['about'] }),
  kind: field('enum', 'Tipo', 'Formación, tesis, cliente, freelance o proyecto propio: la formación va a su sección del CV.', { options: 'ExperienceKind', surfaces: ['about', 'cv'] }),
  role: field('text', 'Cargo', 'El puesto o el título: encabeza la entrada en Sobre mí y en el CV.', { required: true, max: 120, translatable: true, surfaces: ['about', 'cv', 'hunter'] }),
  startedAt: field('date', 'Desde', 'Primer día: ordena la trayectoria y arma el período del CV.', { required: true, surfaces: ['about', 'cv'] }),
  endedAt: field('date', 'Hasta', 'Vacío: sigue en curso («Presente»).', { surfaces: ['about', 'cv'] }),
  summary: field('prose', 'Síntesis', 'Responsabilidades y logros, en Sobre mí.', { required: true, max: 600, translatable: true, surfaces: ['about'] }),
  story: field('prose', 'Relato', 'La versión larga: lo técnico y lo aprendido.', { max: 4000, translatable: true, surfaces: ['about'] }),
  highlights: field('list', 'Viñetas del CV', 'Hasta 3, de 160 caracteres como máximo: la cota de una página A4.', { max: 3, translatable: true, surfaces: ['cv', 'hunter'] }),
  location: field('text', 'Lugar', 'Vacío: la ciudad de la empresa; sin empresa, remoto.', { max: 120, translatable: true, surfaces: ['about', 'cv'] }),
  cvOrder: field('int', 'Posición en el CV', 'Vacío: no entra en la experiencia del CV. Se ordena arrastrando en la vista CV.', { surfaces: ['cv', 'hunter'] }),
  org: relation('Org', 'Empresa', 'Dónde fue: nombre y ciudad en Sobre mí y en el CV.', { surfaces: ['about', 'cv'] }),
  orgId: foreignKey('Empresa'),
  techs: relation('Tech', 'Tecnologías', 'Las que usaste en esa etapa.', { surfaces: ['about'] }),
  projects: relation('Project', 'Obras ligadas', 'Obras hechas en esa etapa, elegidas una por una.', { surfaces: ['about', 'case'] }),
  translations: relation('ExperienceTranslation', 'Inglés', 'La entrada en inglés, viñeta por viñeta.', { editable: false }),
} satisfies ModelFields

export const Tech = {
  id: system('Identificador', 'Lo asigna la base.'),
  slug: field('slug', 'Dirección', 'Filtra Obra con ?stack=…: se fija al crear y cambia solo con «Cambiar dirección».', { required: true, max: 80, surfaces: ['work'] }),
  name: field('text', 'Nombre', 'Como se escribe la tecnología en el caso, en Obra y en el CV.', { required: true, max: 60, surfaces: ['work', 'case', 'cv'] }),
  category: field('enum', 'Categoría', 'Agrupa las tecnologías en los filtros y en las habilidades del CV.', { required: true, options: 'TechCategory', surfaces: ['work', 'cv'] }),
  since: field('int', 'Desde', 'Año en que empezaste a usarla, entre 1990 y el actual: los años de uso se calculan solos.', { required: true, surfaces: ['case'] }),
  note: field('text', 'Criterio', 'Una línea: cuándo la elegís. Aparece al asomar la tecnología en el caso.', { max: 300, translatable: true, surfaces: ['case'] }),
  color: field('color', 'Color', 'Hex como #b97e46, solo para sus marcas.', { surfaces: ['case'] }),
  projects: relation('Project', 'Obras', 'Obras que la usan: se eligen desde cada obra.', { editable: false }),
  experiences: relation('Experience', 'Trayectoria', 'Entradas que la usan: se eligen desde cada experiencia.', { editable: false }),
  articles: relation('Article', 'Artículos', 'Artículos que la tratan: se eligen desde cada artículo.', { editable: false }),
  translations: relation('TechTranslation', 'Inglés', 'El criterio en inglés.', { editable: false }),
} satisfies ModelFields

export const Org = {
  id: system('Identificador', 'Lo asigna la base.'),
  slug: field('slug', 'Dirección', 'Filtra Obra con ?org=…: se fija al crear y cambia solo con «Cambiar dirección».', { required: true, max: 80, surfaces: ['work'] }),
  name: field('text', 'Nombre', 'Como se lee la empresa en el caso, en Sobre mí y en el CV.', { required: true, max: 120, surfaces: ['case', 'about', 'cv'] }),
  url: field('url', 'Sitio', 'Sitio de la empresa. Sin protocolo se completa con https://.', { max: 2048, surfaces: ['about'] }),
  city: field('text', 'Ciudad', 'El lugar por defecto de sus entradas en el CV.', { max: 120, surfaces: ['about', 'cv'] }),
  projects: relation('Project', 'Obras', 'Obras hechas para la empresa: se eligen desde cada obra.', { editable: false }),
  experiences: relation('Experience', 'Trayectoria', 'Entradas en la empresa: se eligen desde cada experiencia.', { editable: false }),
} satisfies ModelFields

export const Doc = {
  key: system('Documento', 'about (Sobre mí) o contact (Contacto): no se renombra.'),
  title: field('text', 'Título', 'Lo conserva el servidor: el formulario no lo pide.', { editable: false }),
  fields: field('json', 'Bloques', 'Los bloques del documento, cada uno con su inglés.', { surfaces: ['about', 'cv', 'hunter'] }),
  updatedAt: system('Última edición', 'La pone la base en cada guardado.'),
} satisfies ModelFields

export const Article = {
  id: system('Identificador', 'Lo asigna la base.'),
  slug: field('slug', 'Dirección', 'La parte final de /articles/…: sale del título al crear y cambia solo con «Cambiar dirección».', { required: true, max: 80, surfaces: ['articles', 'seo'] }),
  title: field('text', 'Título', 'Encabeza el artículo y su fila en Artículos.', { required: true, max: 160, translatable: true, surfaces: ['articles', 'seo'] }),
  summary: field('prose', 'Bajada', 'Una o dos líneas en la lista y en la descripción para buscadores.', { required: true, max: 400, translatable: true, surfaces: ['articles', 'seo'] }),
  content: field('markdown', 'Texto', 'El artículo completo en Markdown, con código y tablas.', { required: true, max: 60000, translatable: true, surfaces: ['articles'] }),
  readingTimeMin: field('int', 'Minutos de lectura', 'Se muestra junto a la fecha.', { surfaces: ['articles'] }),
  status: field('enum', 'Estado', 'Nace en borrador: solo los publicados con fecha cumplida se ven.', { required: true, options: 'ArticleStatus', surfaces: ['articles'] }),
  featured: field('bool', 'Destacado', 'Los destacados encabezan Artículos.', { surfaces: ['articles'] }),
  // El sitio no muestra la portada del artículo (plan §5): el admin no la ofrece y la conserva como está.
  coverImage: field('path', 'Portada', 'El sitio no la usa todavía: el admin no la edita y conserva la guardada.', { max: 2048, surfaces: [], editable: false }),
  canonicalUrl: field('url', 'Publicación original', 'Si salió primero en otro sitio: los buscadores la toman como original.', { max: 2048, surfaces: ['seo'] }),
  sortOrder: field('int', 'Orden', 'Posición en Artículos.', { surfaces: ['articles'] }),
  publishedAt: field('datetime', 'Publicado el', 'Fecha que se muestra; con fecha futura, el artículo espera.', { surfaces: ['articles'] }),
  createdAt: system('Alta', 'Fecha en que se cargó.'),
  updatedAt: system('Última edición', 'La pone la base en cada guardado.'),
  techs: relation('Tech', 'Tecnologías', 'Las que trata el artículo.', { surfaces: ['articles'] }),
  project: relation('Project', 'Obra', 'La obra de la que habla, si la hay.', { surfaces: ['articles', 'case'] }),
  projectId: foreignKey('Obra'),
  translations: relation('ArticleTranslation', 'Inglés', 'Título, bajada y texto en inglés.', { editable: false }),
} satisfies ModelFields
