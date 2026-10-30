// Campos de la experiencia que usa el CV: tipo de entrada, lugar, posición en el CV,
// viñetas (hasta 3 de 160 caracteres, la cota de una página A4) y obras ligadas.

import { store } from '../../store.js'
import { EXPERIENCE_KIND_LABELS, HIGHLIGHTS_MAX, HIGHLIGHT_CHARS } from '../../fields.js'

const { computed } = window.Vue

export const ExperienceCvFields = {
  name: 'AdmExperienceCvFields',
  setup() {
    const highlights = computed(() => store.form?.highlights || [])
    const projects = computed(() => store.meta.options.projects || [])

    function addHighlight() {
      if (!Array.isArray(store.form.highlights)) store.form.highlights = []
      if (store.form.highlights.length >= HIGHLIGHTS_MAX) return
      store.form.highlights.push('')
      store.checkDirty()
    }

    function removeHighlight(idx) {
      store.form.highlights.splice(idx, 1)
      store.checkDirty()
    }

    function setHighlight(idx, value) {
      store.form.highlights[idx] = value
      store.checkDirty()
    }

    const isLinked = id => (store.form?.projectIds || []).includes(id)

    function toggleProject(id) {
      if (!Array.isArray(store.form.projectIds)) store.form.projectIds = []
      const idx = store.form.projectIds.indexOf(id)
      if (idx === -1) store.form.projectIds.push(id)
      else store.form.projectIds.splice(idx, 1)
      store.checkDirty()
    }

    return {
      store, highlights, projects, addHighlight, removeHighlight, setHighlight, isLinked, toggleProject,
      HIGHLIGHTS_MAX, HIGHLIGHT_CHARS,
      kinds: computed(() => store.meta.enums.ExperienceKind || []),
      kindLabel: k => EXPERIENCE_KIND_LABELS[k] || k,
    }
  },
  template: `
    <section class="p-3 bg-[#0d0e12] rounded border border-white/10 space-y-4" aria-labelledby="exp-cv-title">
      <div>
        <h4 id="exp-cv-title" class="text-xs font-bold text-white uppercase font-mono-code">Currículum</h4>
        <p class="text-[11px] text-zinc-400">Lo que el CV Harvard ATS toma de esta entrada. Sin posición, la entrada no aparece en la experiencia del CV.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label class="block">
          <span class="field-label">Tipo de entrada</span>
          <select v-model="store.form.kind" @change="store.checkDirty()" class="select-input font-mono-code">
            <option v-for="k in kinds" :key="k" :value="k">{{ kindLabel(k) }}</option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">Lugar</span>
          <input type="text" v-model="store.form.location" @input="store.checkDirty()" maxlength="120" class="text-input" />
          <span class="field-hint">Vacío: la ciudad de la empresa (sin empresa, remoto).</span>
        </label>
        <label class="block">
          <span class="field-label">Posición en el CV</span>
          <input type="number" min="1" max="99" v-model="store.form.cvOrder" @input="store.checkDirty()" placeholder="Fuera del CV" class="text-input font-mono-code" />
        </label>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="field-label !mb-0">Viñetas del CV ({{ highlights.length }}/{{ HIGHLIGHTS_MAX }})</span>
          <button
            type="button"
            @click="addHighlight"
            :disabled="highlights.length >= HIGHLIGHTS_MAX"
            class="text-xs text-[#ff3e00] hover:underline font-medium cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
          >+ Agregar viñeta</button>
        </div>
        <div v-for="(h, idx) in highlights" :key="idx" class="space-y-1">
          <div class="flex items-start gap-2">
            <textarea
              :value="h"
              @input="setHighlight(idx, $event.target.value)"
              rows="2"
              :maxlength="HIGHLIGHT_CHARS"
              :aria-label="'Viñeta ' + (idx + 1)"
              :aria-describedby="'highlight-count-' + idx"
              class="textarea-input"
            ></textarea>
            <button type="button" class="icon-btn danger mt-1" @click="removeHighlight(idx)" :aria-label="'Quitar la viñeta ' + (idx + 1)">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <div
            :id="'highlight-count-' + idx"
            class="text-[10.5px] font-mono-code text-right pr-8"
            :class="h.length >= HIGHLIGHT_CHARS ? 'text-amber-400' : 'text-zinc-500'"
          >{{ h.length }}/{{ HIGHLIGHT_CHARS }}</div>
        </div>
      </div>

      <div>
        <span class="field-label">Obras ligadas ({{ (store.form.projectIds || []).length }})</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="p in projects"
            :key="p.id"
            type="button"
            @click="toggleProject(p.id)"
            class="tech-chip"
            :class="{ selected: isLinked(p.id) }"
            :aria-pressed="isLinked(p.id)"
          >{{ p.title }}</button>
        </div>
        <span class="field-hint">Solo las obras que se hicieron en esta etapa, una por una.</span>
      </div>
    </section>
  `,
}
