// Formulario Especializado: OrgsForm (AdmOrgsForm)
// Editor de empresas, organizaciones y clientes

import { store } from '../../store.js'
import { slugify } from '../../config.js'

export const OrgsForm = {
  name: 'AdmOrgsForm',
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

    return {
      store,
      onNameInput,
      toggleSlugLock,
    }
  },
  template: `
    <div class="max-w-2xl space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="field-label">Nombre de la Organización *</label>
          <input
            type="text"
            v-model="store.form.name"
            @input="onNameInput"
            placeholder="Acme Studio"
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

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="field-label">Sitio Web Corporativo</label>
          <input
            type="url"
            v-model="store.form.url"
            @input="store.checkDirty()"
            placeholder="https://acme.com"
            class="text-input font-mono-code"
          />
        </div>
        <div>
          <label class="field-label">Ciudad, País o Modalidad</label>
          <input
            type="text"
            v-model="store.form.city"
            @input="store.checkDirty()"
            placeholder="Buenos Aires, Argentina (Remoto)"
            class="text-input"
          />
        </div>
      </div>

      <div
        v-if="store.form._count"
        class="p-3 bg-[#0d0e12] rounded border border-white/10 flex items-center justify-between text-xs font-mono-code text-zinc-400"
      >
        <span>Impacto en base de datos:</span>
        <span class="text-white">
          {{ store.form._count.projects || 0 }} proyectos vinculados · {{ store.form._count.experiences || 0 }} experiencias vinculadas
        </span>
      </div>
    </div>
  `,
}
