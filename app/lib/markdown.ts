/**
 * Markdown de los artículos (Article.content, desde la base) en nodos que dibujan ArticleMarkdown y
 * ArticleInline con elementos de Vue, nunca con innerHTML: el texto no puede inyectar marcado.
 *
 * - Bloques: encabezados, párrafos, listas, citas, código cercado y separadores. El `#` inicial repite
 *   el título de la página (su h1) y se omite; un `#` posterior pasa a h2, así la jerarquía no salta.
 * - En línea: negrita, cursiva, código y enlaces. Un enlace solo se conserva si apunta a una ruta del
 *   sitio, a un ancla o a http(s)/mailto; si no, queda su texto.
 */

export type Block =
  | { type: 'heading', level: 2 | 3 | 4, text: string }
  | { type: 'paragraph', text: string }
  | { type: 'quote', text: string }
  | { type: 'list', ordered: boolean, items: string[] }
  | { type: 'code', lang: string | null, text: string }
  | { type: 'rule' }

export type Inline =
  | { type: 'text', text: string }
  | { type: 'code', text: string }
  | { type: 'strong', children: Inline[] }
  | { type: 'em', children: Inline[] }
  | { type: 'link', href: string, children: Inline[] }

const FENCE = /^(`{3,}|~{3,})\s*([\w+#.-]*)/
const HEADING = /^(#{1,6})\s+(.+?)\s*#*$/
const BULLET = /^[-*+]\s+/
const ORDERED = /^\d+[.)]\s+/
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/

/** Una línea que abre otro bloque y corta el párrafo en curso. */
const opensBlock = (line: string) => line === '' || line.startsWith('>') || [FENCE, HEADING, BULLET, ORDERED, RULE].some(re => re.test(line))

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  const at = () => lines[i]?.trim() ?? ''

  while (i < lines.length) {
    const line = at()
    const fence = line.match(FENCE)
    const heading = line.match(HEADING)
    if (line === '') {
      i++
    }
    else if (fence) {
      const close = fence[1]!
      const code: string[] = []
      for (i++; i < lines.length && !at().startsWith(close); i++) code.push(lines[i]!)
      i++
      blocks.push({ type: 'code', lang: fence[2] || null, text: code.join('\n') })
    }
    else if (heading) {
      const depth = heading[1]!.length
      i++
      if (depth === 1 && blocks.length === 0) continue
      blocks.push({ type: 'heading', level: Math.min(Math.max(depth, 2), 4) as 2 | 3 | 4, text: plainText(parseInline(heading[2]!)) })
    }
    else if (RULE.test(line)) {
      i++
      blocks.push({ type: 'rule' })
    }
    else if (line.startsWith('>')) {
      const quote: string[] = []
      for (; i < lines.length && at().startsWith('>'); i++) quote.push(at().replace(/^>\s?/, ''))
      blocks.push({ type: 'quote', text: quote.join(' ').trim() })
    }
    else if (BULLET.test(line) || ORDERED.test(line)) {
      const marker = BULLET.test(line) ? BULLET : ORDERED
      const items: string[] = []
      for (; i < lines.length && marker.test(at()); i++) items.push(at().replace(marker, ''))
      blocks.push({ type: 'list', ordered: marker === ORDERED, items })
    }
    else {
      const text = [line]
      for (i++; i < lines.length && !opensBlock(at()); i++) text.push(at())
      blocks.push({ type: 'paragraph', text: text.join(' ') })
    }
  }
  return blocks
}

// `código` · **negrita** · __negrita__ · [texto](url) · *cursiva* · _cursiva_ (no dentro de una palabra).
const INLINE = /`([^`\n]+)`|\*\*(.+?)\*\*|__(.+?)__|\[([^\]\n]+)\]\(([^)\s]+)\)|\*(?!\s)([^*\n]+?)\*|(?<!\w)_(?!\s)([^_\n]+?)_(?!\w)/g

export function parseInline(source: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const match of source.matchAll(INLINE)) {
    const at = match.index
    if (at > last) out.push({ type: 'text', text: source.slice(last, at) })
    const [, code, strong, strongAlt, label, href, em, emAlt] = match
    if (code !== undefined) out.push({ type: 'code', text: code })
    else if (strong !== undefined || strongAlt !== undefined) out.push({ type: 'strong', children: parseInline(strong ?? strongAlt ?? '') })
    else if (label !== undefined && href !== undefined) out.push({ type: 'link', href, children: parseInline(label) })
    else out.push({ type: 'em', children: parseInline(em ?? emAlt ?? '') })
    last = at + match[0].length
  }
  if (last < source.length) out.push({ type: 'text', text: source.slice(last) })
  return out
}

/** El texto sin marcas: los encabezados se revelan por líneas y no llevan formato. */
export function plainText(nodes: Inline[]): string {
  return nodes.map(node => ('text' in node ? node.text : plainText(node.children))).join('')
}

/** Adónde lleva un enlace del cuerpo: una ruta del sitio, una URL segura o nada. */
export function linkTarget(href: string): { path: string } | { url: string } | null {
  const url = href.trim()
  if (url.startsWith('/') && !url.startsWith('//')) return { path: url }
  return /^(?:#|https?:\/\/|mailto:)/i.test(url) ? { url } : null
}
