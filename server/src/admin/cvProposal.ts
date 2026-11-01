/**
 * El resumen que propone Eros es texto libre: antes de dejarlo entrar al CV se mira que no corra la
 * hoja fuera de la cota dual (248-265 mm en una página A4, medida con el resumen de la base) y que
 * esté en el idioma del CV. El largo se compara con el resumen que llevaría la hoja sin la propuesta:
 * entre un 25 % menos y un 20 % más, que a 9,3 pt es a lo sumo una línea de más o de menos.
 */
import type { Lang } from '../content/lang.js'
import type { ProposalVerdict } from '../shared/hunterContracts.js'

export const PROPOSAL_RATIO = { min: 0.75, max: 1.2 } as const

const STOPWORDS: Record<Lang, ReadonlySet<string>> = {
  es: new Set(['de', 'la', 'que', 'el', 'en', 'y', 'los', 'las', 'del', 'con', 'para', 'por', 'una', 'un', 'como', 'se', 'su', 'más', 'sin', 'es']),
  en: new Set(['the', 'and', 'of', 'to', 'with', 'for', 'in', 'a', 'an', 'on', 'is', 'as', 'by', 'from', 'that', 'it', 'at', 'my', 'i', 'or']),
}

/** El idioma que más palabras vacías aporta; null si el texto no alcanza para decirlo. */
export function guessLang(text: string): Lang | null {
  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? []
  const count = (lang: Lang) => words.filter(w => STOPWORDS[lang].has(w)).length
  const es = count('es')
  const en = count('en')
  if (es + en < 3 || es === en) return null
  return es > en ? 'es' : 'en'
}

export function judgeProposal(proposal: string, own: string | null, lang: Lang): ProposalVerdict {
  const other = guessLang(proposal)
  if (other && other !== lang) return 'other_lang'
  const reference = own?.length ?? 0
  if (!reference) return 'ok'
  const ratio = proposal.length / reference
  if (ratio > PROPOSAL_RATIO.max) return 'too_long'
  if (ratio < PROPOSAL_RATIO.min) return 'too_short'
  return 'ok'
}
