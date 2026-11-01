/**
 * Los enlaces extra del caso: rótulo con su inglés y dirección. La dirección sin protocolo se
 * completa con https:// al salir del campo (withHttps, igual que el servidor); la que no parece una
 * dirección web se nombra antes de mandar.
 */
import type { FieldIssue } from '@shared/adminContracts'
import { withHttps } from '../../orgs/dict'
import type { LinkForm } from '../types'
import { dataText } from './dict'

const LABEL_MAX = 80

export function blankLink(): LinkForm {
  return { id: null, label: '', url: '', translations: { en: { label: '' } } }
}

function isWebAddress(value: string): boolean {
  try {
    const url = new URL(withHttps(value))
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
  }
  catch {
    return false
  }
}

export function linkIssues(list: readonly LinkForm[]): FieldIssue[] {
  const t = dataText.links.issues
  return list.flatMap((l, i) => {
    const issues: FieldIssue[] = []
    if (!l.label.trim()) issues.push({ path: `links[${i}].label`, message: t.label(i + 1) })
    if (l.label.length > LABEL_MAX || l.translations.en.label.length > LABEL_MAX) issues.push({ path: `links[${i}].label`, message: t.long(i + 1, LABEL_MAX) })
    if (!l.url.trim()) issues.push({ path: `links[${i}].url`, message: t.url(i + 1) })
    else if (!isWebAddress(l.url.trim())) issues.push({ path: `links[${i}].url`, message: t.format(i + 1) })
    return issues
  })
}
