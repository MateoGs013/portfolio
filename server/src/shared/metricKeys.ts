/**
 * Catálogo de claves de Metric: el rótulo y qué mide cada una, en español y en inglés. Es la única
 * fuente: el sitio lo lee desde el diccionario de interfaz (app/lib/dict/common.ts lo reexporta como
 * `metric.<clave>.label` y `metric.<clave>.desc`) y el admin lo recibe en GET /api/admin/meta.
 *
 * Una métrica con una clave fuera del catálogo usa su rótulo propio (Metric.label y su inglés en
 * MetricTranslation). Vive en server/ porque el API lo usa en ejecución y Dockerfile.api no copia app/.
 */
import type { Label } from './labels.js'

export interface MetricKeyText {
  readonly label: Label
  readonly desc: Label
}

export const metricKeys = {
  lcp: {
    label: { es: 'LCP', en: 'LCP' },
    desc: { es: 'Cuánto tarda en pintarse el elemento más grande de la primera pantalla.', en: 'How long the largest element of the first screen takes to paint.' },
  },
  performanceScore: {
    label: { es: 'Performance', en: 'Performance' },
    desc: { es: 'Puntaje de rendimiento de carga, de 0 a 100.', en: 'Load performance score, from 0 to 100.' },
  },
  accessibilityScore: {
    label: { es: 'Accesibilidad', en: 'Accessibility' },
    desc: { es: 'Puntaje de accesibilidad automática, de 0 a 100.', en: 'Automated accessibility score, from 0 to 100.' },
  },
  bestPracticesScore: {
    label: { es: 'Buenas prácticas', en: 'Best practices' },
    desc: { es: 'Puntaje de seguridad y buenas prácticas web, de 0 a 100.', en: 'Security and web best-practice score, from 0 to 100.' },
  },
  seoScore: {
    label: { es: 'SEO', en: 'SEO' },
    desc: { es: 'Puntaje de indexación y metadatos para buscadores, de 0 a 100.', en: 'Search indexing and metadata score, from 0 to 100.' },
  },
  bundleSizeKb: {
    label: { es: 'Bundle', en: 'Bundle' },
    desc: { es: 'Peso del JavaScript inicial comprimido que descarga el navegador.', en: 'Compressed size of the initial JavaScript the browser downloads.' },
  },
  localeCount: {
    label: { es: 'Idiomas', en: 'Languages' },
    desc: { es: 'Idiomas en los que se publica el sitio.', en: 'Languages the site is published in.' },
  },
  languages: {
    label: { es: 'Idiomas', en: 'Languages' },
    desc: { es: 'Idiomas en los que se publica el sitio.', en: 'Languages the site is published in.' },
  },
  commits: {
    label: { es: 'Commits', en: 'Commits' },
    desc: { es: 'Cambios registrados en el repositorio durante el desarrollo.', en: 'Changes recorded in the repository during development.' },
  },
  averageLatencyMs: {
    label: { es: 'Latencia', en: 'Latency' },
    desc: { es: 'Tiempo medio de respuesta de una consulta.', en: 'Average response time of a query.' },
  },
  responseLatencyMs: {
    label: { es: 'Latencia', en: 'Latency' },
    desc: { es: 'Tiempo medio que tarda el servicio en responder.', en: 'Average time the service takes to respond.' },
  },
  realtimeLatencyMs: {
    label: { es: 'Latencia en vivo', en: 'Live latency' },
    desc: { es: 'Demora entre enviar un mensaje y que llegue al otro extremo.', en: 'Delay between sending a message and it reaching the other end.' },
  },
  encryptionLayers: {
    label: { es: 'Capas de cifrado', en: 'Encryption layers' },
    desc: { es: 'Capas de cifrado que protegen los datos guardados.', en: 'Encryption layers that protect the stored data.' },
  },
  vectorDimensions: {
    label: { es: 'Dimensiones', en: 'Dimensions' },
    desc: { es: 'Dimensiones de cada vector de la memoria semántica.', en: 'Dimensions of each vector in the semantic memory.' },
  },
  localModels: {
    label: { es: 'Modelos locales', en: 'Local models' },
    desc: { es: 'Modelos de lenguaje que corren en la máquina, sin servicios externos.', en: 'Language models that run on the machine, without external services.' },
  },
  drawCalls: {
    label: { es: 'Draw calls', en: 'Draw calls' },
    desc: { es: 'Llamadas de dibujo a la GPU por cuadro.', en: 'GPU draw calls per frame.' },
  },
  fpsTarget: {
    label: { es: 'FPS objetivo', en: 'Target FPS' },
    desc: { es: 'Cuadros por segundo que la animación sostiene.', en: 'Frames per second the animation holds.' },
  },
  graphNodes: {
    label: { es: 'Nodos', en: 'Nodes' },
    desc: { es: 'Nodos del grafo de conocimiento.', en: 'Nodes in the knowledge graph.' },
  },
  vaultNotesParsed: {
    label: { es: 'Notas', en: 'Notes' },
    desc: { es: 'Notas procesadas desde la bóveda.', en: 'Notes processed from the vault.' },
  },
  freeTierQuota: {
    label: { es: 'Cuota gratuita', en: 'Free quota' },
    desc: { es: 'Consultas diarias que entran en el plan gratuito del proveedor.', en: 'Daily requests covered by the provider free plan.' },
  },
  operatingCost: {
    label: { es: 'Costo de operación', en: 'Running cost' },
    desc: { es: 'Lo que cuesta mantenerlo en marcha cada mes.', en: 'What it costs to keep it running each month.' },
  },
  platformsCount: {
    label: { es: 'Plataformas', en: 'Platforms' },
    desc: { es: 'Plataformas de empleo que revisa.', en: 'Job platforms it checks.' },
  },
  ephemeralTTL: {
    label: { es: 'Vida de los datos', en: 'Data lifetime' },
    desc: { es: 'Tiempo que un dato vive antes de borrarse solo.', en: 'How long a piece of data lives before it deletes itself.' },
  },
  maskCount: {
    label: { es: 'Máscaras', en: 'Masks' },
    desc: { es: 'Identidades del catálogo, cada una modelada con Eloquent y su distrito.', en: 'Identities in the catalog, each modeled with Eloquent and its district.' },
  },
  districtCount: {
    label: { es: 'Distritos', en: 'Districts' },
    desc: { es: 'Territorios del circuito: una máscara opera en cada uno.', en: 'Territories of the circuit: one mask operates in each.' },
  },
  transmissionCount: {
    label: { es: 'Transmisiones', en: 'Transmissions' },
    desc: { es: 'Notas editoriales del blog, cargadas con seeders.', en: 'Editorial blog posts, loaded with seeders.' },
  },
  duendeCount: {
    label: { es: 'Duendes', en: 'Sprites' },
    desc: { es: 'Criaturas del catálogo, cada una con su rareza y accesorios.', en: 'Creatures in the catalog, each with its rarity and accessories.' },
  },
  rarezaCount: {
    label: { es: 'Rarezas', en: 'Rarities' },
    desc: { es: 'Niveles de rareza del catálogo, de común a legendario.', en: 'Catalog rarity tiers, from common to legendary.' },
  },
  accesorioCount: {
    label: { es: 'Accesorios', en: 'Accessories' },
    desc: { es: 'Accesorios que equipan a los duendes, sobre tablas propias.', en: 'Accessories that equip the sprites, on their own tables.' },
  },
  tableCount: {
    label: { es: 'Tablas', en: 'Tables' },
    desc: { es: 'Tablas del modelo relacional en MariaDB, accedidas con PDO.', en: 'Tables in the MariaDB relational model, accessed with PDO.' },
  },
} as const satisfies Readonly<Record<string, MetricKeyText>>

export type MetricKey = keyof typeof metricKeys

export function isMetricKey(key: string): key is MetricKey {
  return Object.hasOwn(metricKeys, key)
}

type MetricDictKey = `metric.${MetricKey}.label` | `metric.${MetricKey}.desc`

/** El catálogo como claves del diccionario de interfaz: `metric.lcp.label`, `metric.lcp.desc`… */
export function metricDictEntries(): Record<MetricDictKey, Label> {
  return Object.fromEntries((Object.entries(metricKeys) as [MetricKey, MetricKeyText][]).flatMap(([key, text]) => [
    [`metric.${key}.label`, text.label],
    [`metric.${key}.desc`, text.desc],
  ])) as Record<MetricDictKey, Label>
}
