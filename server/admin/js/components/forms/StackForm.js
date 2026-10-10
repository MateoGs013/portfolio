// Formulario Especializado: StackForm (AdmStackForm)
// Editor de tecnologías y herramientas del stack técnico

import { store } from '../../store.js'
import { slugify } from '../../config.js'

export const StackForm = {
  name: 'AdmStackForm',
  setup() {
    function onNameInput() {
      if (store.slugLocked && store.form) {
        store.form.slug = slugify(store.form.name)
      }
      store.checkDirty()
    }

    function toggleSlugLock() {
      store.slugLocked = !store.slugLocked
      if (store.slugLocked && store.form) {
        store.form.slug = slugify(store.form.name)
      }
      store.checkDirty()
    }

    function calcTechExperience(sinceYear) {
      if (!sinceYear) return ''
      const y = Number(sinceYear)
      if (isNaN(y) || y < 1990 || y > new Date().getFullYear()) return ''
      const diff = new Date().getFullYear() - y
      if (diff <= 0) return 'Adoptada recientemente este año'
      if (diff === 1) return '1 año de trayectoria técnica'
      return `${diff} años de trayectoria técnica continua`
    }

    return {
      store,
      onNameInput,
      toggleSlugLock,
      calcTechExperience,
    }
  },
  template: `
    <div class="max-w-2xl space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="field-label">Nombre de la Tecnología *</label>
          <input
            type="text"
            v-model="store.form.name"
            @input="onNameInput"
            placeholder="Ej: Vue.js"
            class="text-input"
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="field-label !mb-0">Identificador (Slug) *</label>
            <button
              type="button"
              @click="toggleSlugLock"
              class="text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-colors cursor-pointer"
              :class="store.slugLocked ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-400 bg-white/5 border-white/10 hover:text-white'"
            >
              {{ store.slugLocked ? '[BLOQUEADO]' : '[MANUAL]' }}
            </button>
          </div>
          <input
            type="text"
            v-model="store.form.slug"
            :readonly="store.slugLocked"
            class="text-input font-mono-code"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="field-label">Categoría Técnica</label>
          <select
            v-model="store.form.category"
            @change="store.checkDirty()"
            class="select-input font-mono-code"
          >
            <option v-for="c in (store.meta.enums.TechCategory || [])" :key="c" :value="c">
              {{ c }}
            </option>
          </select>
        </div>
        <div>
          <label class="field-label">Año de Inicio de Uso</label>
          <input
            type="number"
            v-model.number="store.form.since"
            @input="store.checkDirty()"
            placeholder="2022"
            class="text-input font-mono-code"
          />
          <span v-if="store.form.since" class="field-hint">
            {{ calcTechExperience(store.form.since) }}
          </span>
        </div>
      </div>

      <div>
        <label class="field-label">Criterio Técnico / Criterio de Elección</label>
        <textarea
          v-model="store.form.note"
          @input="store.checkDirty()"
          rows="3"
          placeholder="Cuándo y por qué la utilizás frente a otras alternativas..."
          class="textarea-input"
        ></textarea>
      </div>

      <div>
        <label class="field-label">Color de Acento HEX (Opcional)</label>
        <div class="flex items-center gap-2">
          <input
            type="text"
            v-model="store.form.color"
            @input="store.checkDirty()"
            placeholder="#42b883"
            class="text-input font-mono-code w-36"
          />
          <div
            v-if="store.form.color"
            class="w-8 h-8 rounded border border-white/20 shrink-0"
            :style="{ backgroundColor: store.form.color }"
          ></div>
        </div>
      </div>
    </div>
  `,
}
