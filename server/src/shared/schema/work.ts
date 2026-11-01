/** Descriptores de la obra y de lo que cuelga de ella: métricas, pasos, imágenes y enlaces. */
import { field, foreignKey, relation, system, type ModelFields } from './field.js'

export const Project = {
  id: system('Identificador', 'Lo asigna la base.'),
  slug: field('slug', 'Dirección', 'La parte final de /projects/…: se fija al crear y cambia solo con «Cambiar dirección».', { required: true, max: 80, surfaces: ['work', 'case', 'seo'] }),
  title: field('text', 'Título', 'Nombre de la obra en el inicio, en Obra y en la cabecera del caso.', { required: true, max: 120, translatable: true, surfaces: ['home', 'work', 'case', 'seo'] }),
  year: field('int', 'Año', 'Año de la obra: ordena Obra y aparece junto al título.', { required: true, surfaces: ['work', 'case'] }),
  role: field('text', 'Rol', 'Qué hiciste en la obra, debajo del título del caso.', { required: true, max: 120, translatable: true, surfaces: ['work', 'case'] }),
  status: field('enum', 'Estado', 'En producción, en desarrollo o archivada: se ve en la fila y filtra Obra.', { required: true, options: 'ProjectStatus', surfaces: ['work', 'case'] }),
  featured: field('bool', 'Destacada', 'Las destacadas encabezan el inicio.', { surfaces: ['home'] }),
  summary: field('text', 'Resumen', 'Una línea: la fila de Obra, la vista previa del inicio y la descripción para buscadores.', { required: true, max: 300, translatable: true, surfaces: ['home', 'work', 'case', 'seo'] }),
  brief: field('prose', 'Encargo', 'El problema y el pedido, al abrir el caso.', { max: 4000, translatable: true, surfaces: ['case'] }),
  outcome: field('prose', 'Resultado', 'Qué cambió después de la obra, al cierre del caso.', { max: 4000, translatable: true, surfaces: ['case'] }),
  url: field('url', 'Sitio', 'Dirección de la obra en vivo: el enlace «Visitar» del caso.', { max: 2048, surfaces: ['case'] }),
  repo: field('url', 'Repositorio', 'Código fuente público, si lo hay.', { max: 2048, surfaces: ['case'] }),
  legacyMetrics: system('Métricas anteriores', 'Columna vieja convertida en filas Metric: no se lee ni se escribe.'),
  sortOrder: field('int', 'Orden', 'Posición en Obra entre las del mismo año.', { surfaces: ['work'] }),
  publishedAt: field('datetime', 'Visible desde', 'Vacío: la obra no se muestra. Con fecha pasada se ve; con fecha futura, se programa.', { surfaces: ['home', 'work', 'case'] }),
  createdAt: system('Alta', 'Fecha en que se cargó.'),
  updatedAt: system('Última edición', 'La pone la base en cada guardado.'),
  org: relation('Org', 'Empresa', 'Para quién se hizo: aparece en el caso y en la trayectoria.', { surfaces: ['case', 'about'] }),
  orgId: foreignKey('Empresa'),
  techs: relation('Tech', 'Tecnologías', 'Las del caso y los filtros de Obra.', { surfaces: ['work', 'case'] }),
  media: relation('Media', 'Imágenes y videos', 'Portada y galería del caso.', { surfaces: ['home', 'work', 'case'] }),
  steps: relation('ProcessStep', 'Pasos', 'El proceso del caso, en orden.', { surfaces: ['case'] }),
  links: relation('Link', 'Enlaces', 'Enlaces extra al pie del caso.', { surfaces: ['case'] }),
  articles: relation('Article', 'Artículos', 'Artículos que hablan de la obra: se eligen desde cada artículo.', { editable: false, surfaces: ['case', 'articles'] }),
  metrics: relation('Metric', 'Métricas', 'Cifras medidas de la obra, en el caso.', { surfaces: ['case'] }),
  experiences: relation('Experience', 'Trayectoria', 'Entradas de la trayectoria ligadas: se eligen desde cada experiencia.', { editable: false, surfaces: ['about', 'cv'] }),
  translations: relation('ProjectTranslation', 'Inglés', 'Los textos de la obra en inglés.', { editable: false }),
} satisfies ModelFields

export const Metric = {
  id: system('Identificador', 'Lo asigna la base.'),
  key: field('text', 'Qué se mide', 'La clave de la métrica (por ejemplo lcp): da el rótulo y la explicación del caso.', { required: true, max: 48, surfaces: ['case'] }),
  value: field('decimal', 'Valor', 'Un número, con hasta cuatro decimales. Va un número o una lista, no los dos.', { surfaces: ['case'] }),
  items: field('list', 'Lista', 'Elementos de texto (hasta 20). Va una lista o un número, no los dos.', { max: 20, surfaces: ['case'] }),
  unit: field('enum', 'Unidad', 'Vacía: un conteo o un puntaje.', { options: 'MetricUnit', surfaces: ['case'] }),
  label: field('text', 'Rótulo propio', 'Solo si la clave no está en el catálogo: el nombre de la cifra en el caso.', { max: 80, translatable: true, surfaces: ['case'] }),
  source: field('text', 'Fuente', 'Con qué se midió (por ejemplo PageSpeed Insights).', { max: 200, surfaces: ['case'] }),
  measuredAt: field('date', 'Medida el', 'Día de la medición.', { surfaces: ['case'] }),
  order: field('int', 'Orden', 'Lo da la posición en la lista.', { editable: false }),
  project: relation('Project', 'Obra', 'La obra medida.', { editable: false }),
  projectId: foreignKey('Obra'),
  translations: relation('MetricTranslation', 'Inglés', 'El rótulo propio en inglés.', { editable: false }),
} satisfies ModelFields

export const ProcessStep = {
  id: system('Identificador', 'Lo asigna la base.'),
  order: field('int', 'Orden', 'Lo da la posición en la lista.', { editable: false }),
  title: field('text', 'Título del paso', 'Encabezado del paso en el proceso del caso.', { required: true, max: 200, translatable: true, surfaces: ['case'] }),
  body: field('prose', 'Texto del paso', 'Lo que se decidió en ese paso.', { required: true, max: 4000, translatable: true, surfaces: ['case'] }),
  project: relation('Project', 'Obra', 'La obra a la que pertenece.', { editable: false }),
  projectId: foreignKey('Obra'),
  media: relation('Media', 'Imagen del paso', 'Una imagen de la misma obra que acompaña al paso.', { surfaces: ['case'] }),
  mediaId: foreignKey('Imagen del paso'),
  translations: relation('ProcessStepTranslation', 'Inglés', 'El paso en inglés.', { editable: false }),
} satisfies ModelFields

export const Media = {
  id: system('Identificador', 'Lo asigna la base.'),
  kind: field('enum', 'Tipo', 'Imagen o video: sale del archivo subido.', { options: 'MediaKind', editable: false }),
  role: field('enum', 'Uso', 'Portada (fila y cabecera del caso) o galería.', { options: 'MediaRole', surfaces: ['home', 'work', 'case'] }),
  src: field('path', 'Archivo', 'Se sube desde el admin: queda en /media/projects/…', { required: true, editable: false, surfaces: ['case'] }),
  srcWebm: field('path', 'Versión WebM', 'Variante WebM de un video.', { editable: false, surfaces: ['case'] }),
  poster: field('path', 'Póster', 'Primer cuadro de un video: lo que se ve con movimiento reducido.', { surfaces: ['case'] }),
  alt: field('text', 'Texto alternativo', 'Lo que lee un lector de pantalla en lugar de la imagen.', { required: true, max: 300, translatable: true, surfaces: ['case'] }),
  caption: field('text', 'Pie', 'Texto debajo de la imagen en la galería del caso.', { max: 300, translatable: true, surfaces: ['case'] }),
  tint: field('color', 'Color', 'Color característico de la imagen, como #b97e46.', { surfaces: ['case'] }),
  viewport: field('enum', 'Pantalla', 'Dónde se capturó: escritorio o celular.', { options: 'MediaViewport', surfaces: ['case'] }),
  width: field('int', 'Ancho', 'Se lee del archivo.', { editable: false }),
  height: field('int', 'Alto', 'Se lee del archivo.', { editable: false }),
  order: field('int', 'Orden', 'Posición en la galería.', { surfaces: ['case'] }),
  bytes: field('int', 'Peso', 'Se lee del archivo.', { editable: false }),
  project: relation('Project', 'Obra', 'La obra a la que pertenece.', { editable: false }),
  projectId: foreignKey('Obra'),
  steps: relation('ProcessStep', 'Pasos', 'Pasos que muestran esta imagen.', { editable: false }),
  translations: relation('MediaTranslation', 'Inglés', 'Texto alternativo y pie en inglés.', { editable: false }),
} satisfies ModelFields

export const Link = {
  id: system('Identificador', 'Lo asigna la base.'),
  label: field('text', 'Texto del enlace', 'Lo que se lee en el enlace, por ejemplo «Documentación».', { required: true, max: 80, translatable: true, surfaces: ['case'] }),
  url: field('url', 'Dirección del enlace', 'Adónde lleva. Sin protocolo se completa con https://.', { required: true, max: 2048, surfaces: ['case'] }),
  project: relation('Project', 'Obra', 'La obra a la que pertenece.', { editable: false }),
  projectId: foreignKey('Obra'),
  translations: relation('LinkTranslation', 'Inglés', 'El texto del enlace en inglés.', { editable: false }),
} satisfies ModelFields
