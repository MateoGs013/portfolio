/**
 * El markdown de los artículos vive en server/src/shared/markdown.ts: el admin parte el texto con el
 * mismo código para su vista previa. El sitio lo sigue importando desde acá.
 */
export { linkTarget, parseInline, parseMarkdown, plainText, readingMinutes, WORDS_PER_MINUTE } from '../../server/src/shared/markdown.js'
export type { Block, Inline } from '../../server/src/shared/markdown.js'
