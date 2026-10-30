// Pestaña Enlaces & Pasos: enlaces de la obra y pasos del caso, con orden por posición
// (subir/bajar), una imagen opcional por paso y quitar con nombre accesible.

import { store } from '../../../store.js'
import { MEDIA_ROLE_LABELS, fileName } from '../../../fields.js'

const { computed } = window.Vue

export const ProjectSteps = {
  name: 'AdmProjectSteps',
  setup() {
    const links = computed(() => store.form?.links || [])
    const steps = computed(() => store.form?.steps || [])
    const mediaOptions = computed(() => (store.form?.media || []).map(m => ({
      id: m.id,
      label: `${MEDIA_ROLE_LABELS[m.role] || m.role}${m.kind === 'VIDEO' ? ' · video' : ''} · ${fileName(m.src)}`,
    })))

    function add(key) {
      if (!Array.isArray(store.form[key])) store.form[key] = []
      store.form[key].push(key === 'links' ? { id: null, label: '', url: '' } : { id: null, title: '', body: '', mediaId: null })
      store.checkDirty()
    }

    function remove(key, idx) {
      store.form[key].splice(idx, 1)
      store.checkDirty()
    }

    function move(idx, dir) {
      const list = store.form.steps
      list.splice(idx + dir, 0, ...list.splice(idx, 1))
      store.checkDirty()
    }

    const stepName = (s, idx) => `paso ${idx + 1}${s.title ? ` (${s.title})` : ''}`

    return { store, links, steps, mediaOptions, add, remove, move, stepName }
  },
  template: `
    <div class="space-y-6">
      <section class="space-y-2" aria-labelledby="links-title">
        <div class="flex items-center justify-between">
          <h4 id="links-title" class="text-xs font-bold text-white uppercase font-mono-code">Enlaces secundarios</h4>
          <button type="button" @click="add('links')" class="text-xs text-[#ff3e00] hover:underline font-medium cursor-pointer">+ Agregar enlace</button>
        </div>
        <div v-for="(lnk, idx) in links" :key="lnk.id || 'n' + idx" class="flex items-center gap-2">
          <input
            type="text"
            v-model="lnk.label"
            @input="store.checkDirty()"
            placeholder="Etiqueta (ej: Documentación)"
            :aria-label="'Etiqueta del enlace ' + (idx + 1)"
            class="text-input !h-[30px] w-40 sm:w-48 font-mono-code"
          />
          <input
            type="url"
            v-model="lnk.url"
            @input="store.checkDirty()"
            placeholder="https://..."
            :aria-label="'Dirección del enlace ' + (idx + 1)"
            class="text-input !h-[30px] flex-1 font-mono-code"
          />
          <button type="button" class="icon-btn danger" @click="remove('links', idx)" :aria-label="'Quitar el enlace ' + (lnk.label || idx + 1)">
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </section>

      <section class="space-y-2" aria-labelledby="steps-title">
        <div class="flex items-center justify-between">
          <div>
            <h4 id="steps-title" class="text-xs font-bold text-white uppercase font-mono-code">Pasos del proceso (caso de estudio)</h4>
            <p class="text-[11px] text-zinc-400">El número de cada paso sale de su posición en la lista.</p>
          </div>
          <button type="button" @click="add('steps')" class="text-xs text-[#ff3e00] hover:underline font-medium cursor-pointer">+ Agregar paso</button>
        </div>
        <div
          v-for="(stp, idx) in steps"
          :key="stp.id || 'n' + idx"
          class="p-3.5 bg-[#121318] border border-white/10 rounded space-y-2"
        >
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono-code text-zinc-500 w-6 shrink-0">{{ String(idx + 1).padStart(2, '0') }}</span>
            <input
              type="text"
              v-model="stp.title"
              @input="store.checkDirty()"
              placeholder="Título (ej: Arquitectura inicial)"
              :aria-label="'Título del paso ' + (idx + 1)"
              class="text-input !h-[30px] flex-1 font-mono-code"
              maxlength="200"
            />
            <button type="button" class="icon-btn" :disabled="idx === 0" @click="move(idx, -1)" :aria-label="'Subir el ' + stepName(stp, idx)">
              <svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" class="icon-btn" :disabled="idx === steps.length - 1" @click="move(idx, 1)" :aria-label="'Bajar el ' + stepName(stp, idx)">
              <svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" class="icon-btn danger" @click="remove('steps', idx)" :aria-label="'Quitar el ' + stepName(stp, idx)">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <textarea
            v-model="stp.body"
            @input="store.checkDirty()"
            rows="3"
            placeholder="Detalle técnico de la fase..."
            :aria-label="'Texto del paso ' + (idx + 1)"
            class="textarea-input"
          ></textarea>
          <label v-if="mediaOptions.length" class="flex items-center gap-2">
            <span class="field-label !mb-0 shrink-0">Imagen</span>
            <select v-model="stp.mediaId" @change="store.checkDirty()" class="select-input !h-[28px] !text-[11px] font-mono-code">
              <option :value="null">Sin imagen</option>
              <option v-for="o in mediaOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  `,
}
