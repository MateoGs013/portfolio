// Componente: AdmAiTrace (Eros AI Reasoning Trace)
// Visualización estructurada y colapsable en tiempo real de trazas de razonamiento (Bencho UI)
// Cero emojis · Precisión geométrica Linear 2026

const { ref, computed, watch, onUnmounted } = window.Vue

export const AdmAiTrace = {
  name: 'AdmAiTrace',
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    steps: {
      type: Array,
      default: () => [
        'Extrayendo requisitos clave de la vacante',
        'Cruzando contexto relacional en PostgreSQL',
        'Optimizando keywords para parser Harvard ATS',
        'Sintetizando documento con Gemini 2.5',
      ],
    },
    title: {
      type: String,
      default: 'EROS // PIPELINE DE RAZONAMIENTO',
    },
  },
  setup(props) {
    const currentStep = ref(0)
    const isExpanded = ref(true)
    const elapsedMs = ref(0)
    const isDone = ref(false)

    let stepTimer = null
    let clockTimer = null
    let startTime = 0

    const effectiveSteps = computed(() => {
      return props.steps && props.steps.length
        ? props.steps
        : [
            'Extrayendo requisitos clave de la vacante',
            'Cruzando contexto relacional en PostgreSQL',
            'Optimizando keywords para parser Harvard ATS',
            'Sintetizando documento con Gemini 2.5',
          ]
    })

    const formattedElapsed = computed(() => {
      const s = (elapsedMs.value / 1000).toFixed(1)
      return `${s}s`
    })

    function startPipeline() {
      currentStep.value = 0
      elapsedMs.value = 0
      isDone.value = false
      startTime = Date.now()

      clearInterval(clockTimer)
      clearInterval(stepTimer)

      clockTimer = setInterval(() => {
        elapsedMs.value = Date.now() - startTime
      }, 100)

      stepTimer = setInterval(() => {
        if (currentStep.value < effectiveSteps.value.length - 1) {
          currentStep.value += 1
        }
      }, 1200)
    }

    function stopPipeline() {
      clearInterval(clockTimer)
      clearInterval(stepTimer)
      clockTimer = null
      stepTimer = null
      if (elapsedMs.value > 0) {
        currentStep.value = effectiveSteps.value.length
        isDone.value = true
      }
    }

    watch(
      () => props.active,
      (newVal) => {
        if (newVal) {
          startPipeline()
        } else {
          stopPipeline()
        }
      },
      { immediate: true }
    )

    onUnmounted(() => {
      clearInterval(clockTimer)
      clearInterval(stepTimer)
    })

    function toggleExpanded() {
      isExpanded.value = !isExpanded.value
    }

    return {
      currentStep,
      isExpanded,
      elapsedMs,
      formattedElapsed,
      effectiveSteps,
      isDone,
      toggleExpanded,
    }
  },
  template: `
    <div
      v-if="active || isDone"
      class="my-3 rounded-lg border border-white/10 bg-[#0c0d10] p-3 text-xs transition-all duration-200 select-none shadow-lg"
    >
      <!-- Cabecera colapsable del pipeline -->
      <div
        @click="toggleExpanded"
        class="flex items-center justify-between cursor-pointer select-none pb-1"
        role="button"
        :aria-expanded="isExpanded"
      >
        <div class="flex items-center gap-2 font-mono-code text-[11px] uppercase tracking-wider text-zinc-300">
          <span class="relative flex h-2 w-2 shrink-0 items-center justify-center">
            <span
              v-if="active"
              class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping absolute inline-flex opacity-75"
            ></span>
            <span
              class="w-1.5 h-1.5 rounded-full relative inline-flex"
              :class="active ? 'bg-indigo-400' : (isDone ? 'bg-emerald-400' : 'bg-zinc-600')"
            ></span>
          </span>
          <span class="font-bold text-white tracking-wide">{{ title }}</span>
          <span class="text-zinc-500 font-mono-code text-[10px]">
            [{{ String(Math.min(currentStep + (active ? 1 : 0), effectiveSteps.length)).padStart(2, '0') }}/{{ String(effectiveSteps.length).padStart(2, '0') }}]
          </span>
        </div>

        <div class="flex items-center gap-2 font-mono-code text-[10.5px]">
          <span class="tabular-nums px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/5">
            {{ formattedElapsed }}
          </span>
          <span class="text-zinc-500 hover:text-zinc-300 transition-colors">
            {{ isExpanded ? '[-]' : '[+]' }}
          </span>
        </div>
      </div>

      <!-- Lista secuencial de pasos técnicos -->
      <div v-show="isExpanded" class="mt-2.5 pt-2 border-t border-white/5 space-y-1.5 font-mono-code text-[11px]">
        <div
          v-for="(stepText, idx) in effectiveSteps"
          :key="idx"
          class="flex items-center justify-between gap-3 px-2 py-1 rounded transition-colors duration-150"
          :class="{
            'bg-indigo-500/10 border border-indigo-500/20 text-white': active && idx === currentStep,
            'text-zinc-400': idx < currentStep || isDone,
            'text-zinc-600': idx > currentStep && !isDone
          }"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Indicadores de estado geométrico (cero emojis) -->
            <span
              v-if="idx < currentStep || isDone"
              class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
              title="Completado"
            ></span>
            <span
              v-else-if="active && idx === currentStep"
              class="relative flex h-2 w-2 shrink-0 items-center justify-center"
              title="En progreso"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping absolute inline-flex"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 relative inline-flex"></span>
            </span>
            <span
              v-else
              class="w-1.5 h-1.5 rounded-full border border-zinc-600 shrink-0"
              title="Pendiente"
            ></span>

            <!-- Prefijo numérico ordenado [01] -->
            <span class="text-zinc-500 shrink-0 text-[10px]">[{{ String(idx + 1).padStart(2, '0') }}]</span>

            <!-- Texto del paso -->
            <span
              class="truncate"
              :class="{
                'font-medium text-white': active && idx === currentStep,
                'text-zinc-400': idx < currentStep || isDone,
                'text-zinc-600': idx > currentStep && !isDone
              }"
            >
              {{ stepText }}
            </span>
          </div>

          <!-- Estado lateral y cronómetro tabular -->
          <div class="shrink-0 text-[10px] tabular-nums font-mono-code">
            <span v-if="idx < currentStep || isDone" class="text-emerald-400 font-semibold">[OK]</span>
            <span v-else-if="active && idx === currentStep" class="text-indigo-400 animate-pulse">
              {{ formattedElapsed }}
            </span>
            <span v-else class="text-zinc-600">--</span>
          </div>
        </div>
      </div>
    </div>
  `,
}
