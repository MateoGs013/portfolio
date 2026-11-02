/**
 * Lo que se hizo con cada vacante en esta sesión: el análisis, el mensaje, el CV adaptado y la vista
 * previa del correo, con de dónde salió cada uno. Vive en memoria por vacante: cambiar de etapa o
 * volver a la lista no lo pierde; recargar sí (el CV se vuelve a armar desde la base en un clic).
 */
import type { ApplyPreview, CvMeasure, HunterJob, MatchAnalysis, Pitch, TailoredCv } from '@shared/hunterContracts'
import { reactive } from 'vue'
import { originOf, type Origin } from './adapter'
import { analysisOf, pitchDraftOf } from './model'

export type PitchDraft = Omit<Pitch, 'lang'> & { lang: Pitch['lang'] | null }

export interface JobWork {
  analysis: MatchAnalysis | null
  analysisOrigin: Origin | null
  pitch: PitchDraft | null
  pitchOrigin: Origin | null
  cv: TailoredCv | null
  /** El resumen de la base, para mostrarlo al lado de la propuesta aunque la propuesta esté en uso. */
  baseSummary: string | null
  /** La hoja con ticket (measure=1) que muestra el iframe. */
  sheetUrl: string | null
  measure: Pick<CvMeasure, 'heightMm' | 'pages'> | null
  preview: ApplyPreview | null
  previewOrigin: Origin | null
  /** Destinatario, asunto y cuerpo como quedaron en Postular. */
  mail: { to: string, subject: string, body: string } | null
}

const works = reactive(new Map<string, JobWork>())

function blank(job: HunterJob): JobWork {
  const draft = pitchDraftOf(job)
  return {
    analysis: analysisOf(job),
    analysisOrigin: job.match_analysis ? originOf(job) : null,
    pitch: draft ? { ...draft, lang: null } : null,
    pitchOrigin: draft ? originOf(job) : null,
    cv: null,
    baseSummary: null,
    sheetUrl: null,
    measure: null,
    preview: null,
    previewOrigin: null,
    mail: null,
  }
}

/** El trabajo de esta vacante (se crea con lo que Eros ya dejó guardado en ella). */
export function workOf(job: HunterJob): JobWork {
  let work = works.get(job.id)
  if (!work) {
    works.set(job.id, blank(job))
    work = works.get(job.id)!
  }
  return work
}

/** Una vacante borrada se lleva lo suyo. */
export function forgetWork(id: string): void {
  works.delete(id)
}
