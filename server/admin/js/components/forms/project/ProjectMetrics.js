// Pestaña Métricas de Impacto: filas Metric tipadas. Cada una es un número con unidad o una lista.
// Las claves sugeridas salen de las otras obras de la base: cargan la clave (y la unidad que ya usa),
// nunca un valor.

import { store } from '../../../store.js'
import { METRIC_UNIT_LABELS, blankMetric, metricToPayload } from '../../../fields.js'

const { computed, ref } = window.Vue

export const ProjectMetrics = {
  name: 'AdmProjectMetrics',
  setup() {
    const showJson = ref(false)
    const metrics = computed(() => store.form?.metrics || [])

    /** Claves que ya usan otras obras, con su unidad más frecuente. */
    const knownKeys = computed(() => {
      const units = new Map()
      for (const p of store.rows || []) {
        for (const m of p.metrics || []) {
          const tally = units.get(m.key) || {}
          const unit = m.unit || ''
          tally[unit] = (tally[unit] || 0) + 1
          units.set(m.key, tally)
        }
      }
      return [...units.entries()]
        .map(([key, tally]) => ({ key, unit: Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0] }))
        .sort((a, b) => a.key.localeCompare(b.key))
    })
    const presets = computed(() => knownKeys.value.filter(k => !metrics.value.some(m => m.key === k.key)))

    function add(key = '', unit = '') {
      if (!Array.isArray(store.form.metrics)) store.form.metrics = []
      store.form.metrics.push(blankMetric(key, unit))
      store.checkDirty()
    }

    function remove(idx) {
      store.form.metrics.splice(idx, 1)
      store.checkDirty()
    }

    function move(idx, dir) {
      const list = store.form.metrics
      list.splice(idx + dir, 0, ...list.splice(idx, 1))
      store.checkDirty()
    }

    function setMode(m, mode) {
      m.mode = mode
      store.checkDirty()
    }

    const duplicated = key => !!key && metrics.value.filter(m => m.key.trim() === key.trim()).length > 1

    return {
      store, metrics, presets, knownKeys, showJson, add, remove, move, setMode, duplicated,
      units: computed(() => store.meta.enums.MetricUnit || []),
      unitLabel: u => METRIC_UNIT_LABELS[u] || u,
      json: computed(() => JSON.stringify(metrics.value.filter(m => (m.key || '').trim()).map(metricToPayload), null, 2)),
    }
  },
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-xs font-bold text-white uppercase font-mono-code">Métricas medibles</h3>
          <p class="text-[11px] text-zinc-400">Un número con su unidad (LCP en segundos, peso en kB) o una lista (idiomas). Cargá solo lo que se puede verificar, con su origen.</p>
        </div>
        <button type="button" @click="showJson = !showJson" class="text-[11px] font-mono-code text-zinc-400 hover:text-white underline cursor-pointer shrink-0" :aria-expanded="showJson">
          {{ showJson ? 'Ocultar JSON' : 'Ver JSON' }}
        </button>
      </div>

      <pre v-if="showJson" class="p-3 bg-[#0d0e12] border border-white/10 rounded text-[11px] font-mono-code text-zinc-300 overflow-x-auto">{{ json }}</pre>

      <div v-if="presets.length" class="flex flex-wrap items-center gap-1.5">
        <span class="text-[11px] font-mono-code text-zinc-500 mr-1">Claves de otras obras:</span>
        <button
          v-for="p in presets"
          :key="p.key"
          type="button"
          @click="add(p.key, p.unit)"
          class="tech-chip !py-0.5"
          :aria-label="'Agregar la métrica ' + p.key"
        >+ {{ p.key }}</button>
      </div>

      <datalist id="metric-keys">
        <option v-for="k in knownKeys" :key="k.key" :value="k.key"></option>
      </datalist>

      <div v-for="(m, idx) in metrics" :key="idx" class="p-3 bg-[#121318] border border-white/10 rounded space-y-2.5">
        <div class="flex flex-wrap items-end gap-2">
          <label class="block flex-1 min-w-[10rem]">
            <span class="field-label !mb-1">Clave *</span>
            <input type="text" v-model="m.key" @input="store.checkDirty()" list="metric-keys" placeholder="bundleSizeKb" class="text-input !h-[30px] font-mono-code" :aria-invalid="duplicated(m.key)" />
          </label>
          <div class="flex rounded border border-white/10 overflow-hidden text-[11px] font-mono-code h-[30px]" role="group" :aria-label="'Tipo de la métrica ' + (m.key || (idx + 1))">
            <button type="button" class="px-2.5" :class="m.mode === 'number' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'" :aria-pressed="m.mode === 'number'" @click="setMode(m, 'number')">Número</button>
            <button type="button" class="px-2.5 border-l border-white/10" :class="m.mode === 'list' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'" :aria-pressed="m.mode === 'list'" @click="setMode(m, 'list')">Lista</button>
          </div>
          <div class="flex items-center gap-0.5 pb-0.5">
            <button type="button" class="icon-btn" :disabled="idx === 0" @click="move(idx, -1)" :aria-label="'Subir la métrica ' + (m.key || (idx + 1))">
              <svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" class="icon-btn" :disabled="idx === metrics.length - 1" @click="move(idx, 1)" :aria-label="'Bajar la métrica ' + (m.key || (idx + 1))">
              <svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" class="icon-btn danger" @click="remove(idx)" :aria-label="'Quitar la métrica ' + (m.key || (idx + 1))">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>
        <p v-if="duplicated(m.key)" class="text-[11px] text-red-400" role="alert">Esta clave ya está en otra fila: cada métrica va una sola vez.</p>

        <div v-if="m.mode === 'number'" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label class="block">
            <span class="field-label !mb-1">Valor *</span>
            <input type="number" step="any" v-model="m.value" @input="store.checkDirty()" class="text-input !h-[30px] font-mono-code" placeholder="0.8" />
          </label>
          <label class="block">
            <span class="field-label !mb-1">Unidad</span>
            <select v-model="m.unit" @change="store.checkDirty()" class="select-input !h-[30px] font-mono-code">
              <option value="">Sin unidad (conteo o puntaje)</option>
              <option v-for="u in units" :key="u" :value="u">{{ unitLabel(u) }}</option>
            </select>
          </label>
        </div>
        <label v-else class="block">
          <span class="field-label !mb-1">Elementos * (uno por renglón)</span>
          <textarea v-model="m.items" @input="store.checkDirty()" rows="3" class="textarea-input font-mono-code" placeholder="ES&#10;EN"></textarea>
        </label>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label class="block">
            <span class="field-label !mb-1">Origen</span>
            <input type="text" v-model="m.source" @input="store.checkDirty()" class="text-input !h-[30px]" placeholder="PageSpeed Insights, móvil" maxlength="200" />
          </label>
          <label class="block">
            <span class="field-label !mb-1">Medido el</span>
            <input type="date" v-model="m.measuredAt" @input="store.checkDirty()" class="text-input !h-[30px] font-mono-code" />
          </label>
          <label class="block">
            <span class="field-label !mb-1">Rótulo propio</span>
            <input type="text" v-model="m.label" @input="store.checkDirty()" class="text-input !h-[30px]" maxlength="80" />
            <span class="field-hint">Solo si el sitio no conoce esta clave.</span>
          </label>
        </div>
      </div>

      <button type="button" @click="add()" class="btn-secondary !h-[28px] !text-[11px]">+ Agregar métrica</button>
    </div>
  `,
}
