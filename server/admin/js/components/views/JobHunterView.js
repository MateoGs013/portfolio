// Vista: JobHunterView (Consola Job Hunter & Eros AI Suite)
// Visualización y adaptación de vacantes de ingeniería con trazas Bencho UI
// Cero emojis · Precisión Linear 2026

import { store } from '../../store.js'
import { AdmAiTrace } from '../AdmAiTrace.js'

const { computed } = window.Vue

export const JobHunterView = {
  name: 'JobHunterView',
  components: {
    AdmAiTrace,
  },
  props: {
    generating: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    job: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const isAiActive = computed(() => {
      return (
        props.generating ||
        props.loading ||
        store.hunter.isScanning ||
        store.hunter.isEvaluating ||
        store.hunter.isEvaluatingSingle ||
        store.hunter.isPitching ||
        store.hunter.isGeneratingCV ||
        store.hunter.isApplying
      )
    })

    const hunterSteps = computed(() => {
      if (store.hunter.isGeneratingCV) {
        return [
          'Analizando requisitos técnicos y seniority de la vacante',
          'Seleccionando proyectos de máxima afinidad en PostgreSQL 17',
          'Adaptando métricas e impacto con formato Harvard ATS',
          'Optimizando tipografía y maquetación de 1 página A4',
        ]
      }
      if (store.hunter.isPitching) {
        return [
          'Extrayendo pain-points y rol del hiring manager',
          'Cruzando logros técnicos comprobables del candidato',
          'Estructurando propuesta directa con tono de ingeniería',
          'Sintetizando cover letter ejecutiva con Gemini 2.5',
        ]
      }
      if (store.hunter.isEvaluating || store.hunter.isEvaluatingSingle) {
        return [
          'Scrapeando descripción completa de la oportunidad',
          'Extrayendo tech stack, rango salarial y modalidad',
          'Calculando score heurístico de match con el perfil',
          'Estructurando bullet points y recomendación de postulación',
        ]
      }
      return [
        'Extrayendo requisitos y stack clave de la vacante',
        'Cruzando contexto relacional de proyectos en PostgreSQL',
        'Optimizando keywords técnicas para parsers ATS',
        'Sintetizando propuesta de valor con Gemini 2.5',
      ]
    })

    const traceTitle = computed(() => {
      if (store.hunter.isGeneratingCV) return 'EROS // GENERACIÓN CV HARVARD ATS'
      if (store.hunter.isPitching) return 'EROS // SÍNTESIS DE PITCH EJECUTIVO'
      if (store.hunter.isEvaluating || store.hunter.isEvaluatingSingle) return 'EROS // EVALUACIÓN DE VACANTE CON GEMINI'
      if (store.hunter.isScanning) return 'EROS // ESCANEO DE PORTALES TÉCNICOS'
      return 'EROS // PIPELINE DE RAZONAMIENTO'
    })

    return {
      store,
      isAiActive,
      hunterSteps,
      traceTitle,
    }
  },
  template: `
    <div class="job-hunter-view flex flex-col h-full overflow-hidden">
      <!-- Traza de Razonamiento IA (Bencho UI) -->
      <adm-ai-trace
        :active="isAiActive"
        :steps="hunterSteps"
        :title="traceTitle"
      />

      <slot></slot>
    </div>
  `,
}
