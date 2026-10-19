// Vista: RadarView (Consola TrendRadar & Eros IA)
// Monitoreo y detección de tendencias técnicas con trazas Bencho UI
// Cero emojis · Precisión Linear 2026

import { store } from '../../store.js'
import { AdmAiTrace } from '../AdmAiTrace.js'

const { computed } = window.Vue

export const RadarView = {
  name: 'RadarView',
  components: {
    AdmAiTrace,
  },
  props: {
    scanning: {
      type: Boolean,
      default: false,
    },
    generating: {
      type: Boolean,
      default: false,
    },
    trend: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const isScanningActive = computed(() => {
      return props.scanning || store.radar.isScanning
    })

    const isGeneratingActive = computed(() => {
      return props.generating || store.radar.isGenerating
    })

    const isAiActive = computed(() => {
      return isScanningActive.value || isGeneratingActive.value
    })

    const radarSteps = computed(() => {
      if (isScanningActive.value) {
        return [
          'Consultando feeds técnicos RSS y Hacker News API',
          'Filtrando señales de alto impacto y relevancia para el stack',
          'Calculando score heurístico de novedad técnica',
          'Indexando nuevas tendencias en base de datos PostgreSQL 17',
        ]
      }
      return [
        'Extrayendo tesis técnica y fuentes del radar',
        'Cruzando con proyectos y experiencia del portfolio',
        'Redactando post de ingeniería y carrusel social',
        'Persistiendo borrador editorial en base de datos',
      ]
    })

    const radarTitle = computed(() => {
      return isScanningActive.value
        ? 'EROS // ESCANEO RADAR DE TENDENCIAS'
        : 'EROS // GENERACIÓN OMNICANAL & BLOG'
    })

    return {
      store,
      isAiActive,
      radarSteps,
      radarTitle,
    }
  },
  template: `
    <div class="radar-view flex flex-col h-full overflow-hidden">
      <!-- Traza de Razonamiento IA (Bencho UI) -->
      <adm-ai-trace
        :active="isAiActive"
        :steps="radarSteps"
        :title="radarTitle"
      />

      <slot></slot>
    </div>
  `,
}
