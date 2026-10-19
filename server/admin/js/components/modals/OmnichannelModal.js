// Modal Especializado: OmnichannelModal (Generador de Contenido Eros IA)
// Integración de trazas de razonamiento Bencho UI para generación editorial
// Cero emojis · Precisión Linear 2026

import { store } from '../../store.js'
import { AdmAiTrace } from '../AdmAiTrace.js'

const { ref, computed } = window.Vue

export const OmnichannelModal = {
  name: 'OmnichannelModal',
  components: {
    AdmAiTrace,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    generating: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['close', 'submit', 'update:modelValue'],
  setup(props, { emit }) {
    const topic = ref('')
    const pillar = ref('TECHNICAL_BREAKDOWN')
    const keyTakeaways = ref('')

    const isAiGenerating = computed(() => {
      return props.generating || props.loading || store.content.isGenerating
    })

    const generationSteps = [
      'Extrayendo tesis técnica y pilar editorial',
      'Consultando contexto relacional en PostgreSQL 17',
      'Estructurando desglose para LinkedIn, X y Blog',
      'Optimizando diagramas técnicos y síntesis final con Gemini',
    ]

    function handleClose() {
      emit('close')
      emit('update:modelValue', false)
    }

    async function handleSubmit() {
      if (!topic.value.trim() || isAiGenerating.value) return

      emit('submit', {
        topic: topic.value.trim(),
        pillar: pillar.value,
        keyTakeaways: keyTakeaways.value.trim(),
      })

      try {
        await store.generateContentPost({
          topic: topic.value.trim(),
          pillar: pillar.value,
          keyTakeaways: keyTakeaways.value.trim(),
        })
        handleClose()
      } catch (err) {
        console.error('Error al generar contenido omnicanal:', err)
      }
    }

    return {
      store,
      topic,
      pillar,
      keyTakeaways,
      isAiGenerating,
      generationSteps,
      handleClose,
      handleSubmit,
    }
  },
  template: `
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
      @click.self="handleClose"
    >
      <div class="bg-[#121318] border border-white/15 rounded-xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in duration-150">
        <!-- Cabecera -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-purple-400"></span>
            <h3 class="text-sm font-bold font-mono-code text-white uppercase tracking-wider">
              Generador Omnicanal Eros IA
            </h3>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="text-zinc-400 hover:text-white text-xs font-mono-code cursor-pointer"
          >
            [X] Cerrar
          </button>
        </div>

        <!-- Traza de Razonamiento IA (Bencho UI) -->
        <adm-ai-trace
          :active="isAiGenerating"
          :steps="generationSteps"
          title="EROS // GENERACIÓN OMNICANAL"
        />

        <!-- Formulario -->
        <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
          <div>
            <label class="block text-[11px] font-mono-code text-zinc-400 uppercase mb-1">
              Tema / Concepto Central *
            </label>
            <input
              v-model="topic"
              type="text"
              required
              :disabled="isAiGenerating"
              placeholder="Ej: Cómo implementé RAG con Gemini y PostgreSQL en el portfolio"
              class="w-full bg-[#181924] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 font-sans disabled:opacity-50"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-mono-code text-zinc-400 uppercase mb-1">
                Pilar Editorial
              </label>
              <select
                v-model="pillar"
                :disabled="isAiGenerating"
                class="w-full bg-[#181924] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono-code disabled:opacity-50"
              >
                <option value="TECHNICAL_BREAKDOWN">Desglose Técnico</option>
                <option value="METRICS_DRIVEN">Impacto & Métricas</option>
                <option value="CONTROVERSIAL_TAKE">Debate / Punto Crítico</option>
                <option value="LEARNING_FAIL">Aprendizaje & Fail</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-mono-code text-zinc-400 uppercase mb-1">
                Audiencia Objetivo
              </label>
              <div class="w-full bg-[#181924] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-400 font-mono-code">
                Tech Leads & Founders
              </div>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-mono-code text-zinc-400 uppercase mb-1">
              Puntos Clave / Takeaways (Opcional)
            </label>
            <textarea
              v-model="keyTakeaways"
              rows="3"
              :disabled="isAiGenerating"
              placeholder="• PostgreSQL 17 con pgvector&#10;• Búsqueda híbrida con scoring&#10;• Despliegue en VPS Coolify"
              class="w-full bg-[#181924] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 font-mono-code disabled:opacity-50"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              @click="handleClose"
              :disabled="isAiGenerating"
              class="btn-secondary !h-[32px] !text-xs font-mono-code disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isAiGenerating"
              class="btn-primary !h-[32px] !px-4 !text-xs font-mono-code cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <span v-if="isAiGenerating" class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              <span>{{ isAiGenerating ? 'Generando con Eros IA...' : 'Generar Contenido IA' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
}
