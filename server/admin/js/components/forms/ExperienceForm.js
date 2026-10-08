// Formulario Especializado: ExperienceForm (AdmExperienceForm)
// Editor de experiencia laboral con cálculo de duración en tiempo real y chips

import { store } from '../../store.js'
import { slugify } from '../../config.js'

const { computed } = window.Vue

export const ExperienceForm = {
  name: 'AdmExperienceForm',
  setup() {
    const categorizedTechs = computed(() => {
      const q = store.techSearchQuery.trim().toLowerCase()
      const groups = {
        FRONTEND: { label: 'Frontend & UI', items: [] },
        BACKEND: { label: 'Backend & APIs', items: [] },
        DATABASE: { label: 'Bases de Datos & ORM', items: [] },
        DEVOPS: { label: 'Cloud, Docker & VPS', items: [] },
        TOOLING: { label: 'Herramientas & Tooling', items: [] },
        LANGUAGE: { label: 'Lenguajes de Programación', items: [] },
        OTHER: { label: 'Otras Herramientas', items: [] },
      }

      const all = (store.allTechs && store.allTechs.length ? store.allTechs : store.meta.options.techs) || []
      const filtered = q ? all.filter(t => (t.name || '').toLowerCase().includes(q)) : all

      for (const t of filtered) {
        const cat = (t.category && groups[t.category]) ? t.category : 'OTHER'
        groups[cat].items.push(t)
      }

      return Object.entries(groups)
        .filter(([, g]) => g.items.length > 0)
        .map(([k, g]) => ({ key: k, label: g.label, items: g.items }))
    })

    function onRoleInput() {
      if (store.slugLocked && store.form) {
        store.form.slug = slugify(store.form.role)
      }
      store.checkDirty()
    }

    function toggleSlugLock() {
      store.slugLocked = !store.slugLocked
      if (store.slugLocked && store.form) {
        store.form.slug = slugify(store.form.role)
      }
      store.checkDirty()
    }

    function toggleCurrentExperience() {
      if (!store.form) return
      if (!store.form.endedAt) {
        const today = new Date().toISOString().slice(0, 10)
        store.form.endedAt = today
      } else {
        store.form.endedAt = null
      }
      store.checkDirty()
    }

    function calcDuration(startedAt, endedAt) {
      if (!startedAt) return ''
      const start = new Date(startedAt)
      const end = endedAt ? new Date(endedAt) : new Date()
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return ''
      
      let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      if (months < 1) months = 1
      const years = Math.floor(months / 12)
      const remMonths = months % 12
      
      const isCurrent = !endedAt
      let str = ''
      if (years > 0) {
        str += `${years} año${years > 1 ? 's' : ''}`
      }
      if (remMonths > 0) {
        if (str) str += ' y '
        str += `${remMonths} mes${remMonths > 1 ? 'es' : ''}`
      }
      return `${str} ${isCurrent ? '(en curso)' : ''}`.trim()
    }

    function isTechSelected(id) {
      return Array.isArray(store.form?.techIds) && store.form.techIds.includes(id)
    }

    function toggleTech(id) {
      if (!store.form) return
      if (!Array.isArray(store.form.techIds)) store.form.techIds = []
      const idx = store.form.techIds.indexOf(id)
      if (idx === -1) {
        store.form.techIds.push(id)
      } else {
        store.form.techIds.splice(idx, 1)
      }
      store.checkDirty()
    }

    return {
      store,
      categorizedTechs,
      onRoleInput,
      toggleSlugLock,
      toggleCurrentExperience,
      calcDuration,
      isTechSelected,
      toggleTech,
    }
  },
  template: `
    <div class="max-w-2xl space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="field-label">Cargo o Posición *</label>
          <input
            type="text"
            v-model="store.form.role"
            @input="onRoleInput"
            placeholder="Senior Frontend Engineer"
            class="text-input"
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="field-label !mb-0">Slug Web *</label>
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

      <!-- Selector de Empresa -->
      <div>
        <label class="field-label">Empresa u Organización</label>
        <select v-model="store.form.orgId" class="select-input" @change="store.checkDirty()">
          <option :value="null">Sin empresa registrada (Autónomo / Freelance)</option>
          <option v-for="org in store.meta.options.orgs" :key="org.id" :value="org.id">
            {{ org.name }}
          </option>
        </select>
      </div>

      <!-- Fechas con Botón de Actualidad y Cálculo de Duración -->
      <div class="p-3 bg-[#0d0e12] rounded border border-white/10 space-y-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Fecha de Inicio *</label>
            <input
              type="date"
              v-model="store.form.startedAt"
              @input="store.checkDirty()"
              class="text-input font-mono-code"
            />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="field-label !mb-0">Fecha de Fin</label>
              <button
                type="button"
                @click="toggleCurrentExperience"
                class="text-[10px] font-mono-code px-1.5 py-0.5 rounded border cursor-pointer"
                :class="!store.form.endedAt ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-zinc-400 border-white/10'"
              >
                {{ !store.form.endedAt ? 'Actualmente en este rol' : 'Marcar Presente' }}
              </button>
            </div>
            <input
              type="date"
              v-model="store.form.endedAt"
              @input="store.checkDirty()"
              class="text-input font-mono-code"
              :disabled="!store.form.endedAt"
            />
          </div>
        </div>
        <div
          v-if="store.form.startedAt"
          class="text-[11px] font-mono-code text-zinc-400 pt-1 border-t border-white/5 flex items-center justify-between"
        >
          <span>Duración estimada:</span>
          <span class="text-white font-semibold">{{ calcDuration(store.form.startedAt, store.form.endedAt) }}</span>
        </div>
      </div>

      <!-- Selector de Tecnologías -->
      <div>
        <label class="field-label">Tecnologías Principales Utilizadas ({{ (store.form.techIds || []).length }})</label>
        <div class="space-y-3 bg-[#0d0e12] p-3 rounded border border-white/10 max-h-56 overflow-y-auto">
          <div v-for="cat in categorizedTechs" :key="cat.key" class="space-y-1">
            <div class="text-[10px] font-mono-code uppercase tracking-wider text-zinc-500">{{ cat.label }}</div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="t in cat.items"
                :key="t.id"
                @click="toggleTech(t.id)"
                class="tech-chip"
                :class="{ selected: isTechSelected(t.id) }"
              >
                {{ t.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Textareas -->
      <div>
        <label class="field-label">Síntesis de Desempeño (1 Línea) *</label>
        <textarea
          v-model="store.form.summary"
          @input="store.checkDirty()"
          rows="2"
          placeholder="Resumen conciso del impacto y responsabilidades principales..."
          class="textarea-input"
        ></textarea>
      </div>

      <div>
        <label class="field-label">Historia, Retos y Aprendizajes</label>
        <textarea
          v-model="store.form.story"
          @input="store.checkDirty()"
          rows="4"
          placeholder="Relato detallado de la etapa profesional..."
          class="textarea-input"
        ></textarea>
      </div>
    </div>
  `,
}
