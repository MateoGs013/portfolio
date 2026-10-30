// Pestaña Stack & Enlaces: tecnologías por categoría, URL pública y repositorio (con importación de GitHub).

import { store } from '../../../store.js'
import { TECH_CATEGORY_MAP, slugify } from '../../../config.js'

const { computed } = window.Vue

export const ProjectStack = {
  name: 'AdmProjectStack',
  setup() {
    const categorizedTechs = computed(() => {
      const q = store.techSearchQuery.trim().toLowerCase()
      const all = (store.allTechs && store.allTechs.length ? store.allTechs : store.meta.options.techs) || []
      const groups = new Map([...Object.keys(TECH_CATEGORY_MAP), 'OTHER'].map(k => [k, []]))
      for (const t of q ? all.filter(t => (t.name || '').toLowerCase().includes(q)) : all) {
        groups.get(groups.has(t.category) ? t.category : 'OTHER').push(t)
      }
      return [...groups.entries()]
        .filter(([, items]) => items.length)
        .map(([key, items]) => ({ key, label: TECH_CATEGORY_MAP[key] || 'Otras Tecnologías', items }))
    })

    const isTechSelected = id => Array.isArray(store.form?.techIds) && store.form.techIds.includes(id)

    function toggleTech(id) {
      if (!Array.isArray(store.form.techIds)) store.form.techIds = []
      const idx = store.form.techIds.indexOf(id)
      if (idx === -1) store.form.techIds.push(id)
      else store.form.techIds.splice(idx, 1)
      store.checkDirty()
    }

    async function importFromGitHub() {
      const repoUrl = (store.form?.repo || '').trim()
      const match = repoUrl.match(/(?:github\.com\/|^)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/|\.git)?$/)
      if (!match) {
        store.toast('err', 'Ingresá una URL de GitHub válida en el campo de repositorio.')
        return
      }
      const [, owner, repo] = match
      store.importingGitHub = true
      try {
        const res = await window.fetch(`https://api.github.com/repos/${owner}/${repo}`)
        if (!res.ok) throw new Error(`GitHub API error (${res.status})`)
        const data = await res.json()
        if (!store.form.title && data.name) store.form.title = data.name
        if (!store.form.summary && data.description) store.form.summary = data.description
        if (store.slugLocked || !store.form.slug) store.form.slug = slugify(store.form.title || repo)
        store.toast('ok', `Datos importados de GitHub (${owner}/${repo})`)
        store.checkDirty()
      }
      catch (err) {
        store.toast('err', `No se pudo consultar GitHub: ${err.message}`)
      }
      finally {
        store.importingGitHub = false
      }
    }

    return { store, categorizedTechs, isTechSelected, toggleTech, importFromGitHub }
  },
  template: `
    <div class="space-y-5">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="field-label !mb-0">Tecnologías utilizadas ({{ (store.form.techIds || []).length }} seleccionadas)</span>
          <input
            type="text"
            v-model="store.techSearchQuery"
            placeholder="Filtrar stack..."
            aria-label="Filtrar tecnologías"
            class="text-input !h-[26px] !w-36 text-[11px] font-mono-code"
          />
        </div>
        <div class="space-y-3 bg-[#0d0e12] p-3 rounded border border-white/10 max-h-64 overflow-y-auto">
          <div v-for="cat in categorizedTechs" :key="cat.key" class="space-y-1.5">
            <div class="text-[10px] font-mono-code uppercase tracking-wider text-zinc-500">{{ cat.label }}</div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="t in cat.items"
                :key="t.id"
                type="button"
                @click="toggleTech(t.id)"
                class="tech-chip"
                :class="{ selected: isTechSelected(t.id) }"
                :aria-pressed="isTechSelected(t.id)"
              >{{ t.name }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <label class="block">
          <span class="field-label">URL pública / demo online</span>
          <input type="url" v-model="store.form.url" @input="store.checkDirty()" placeholder="https://..." class="text-input font-mono-code" />
        </label>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="project-repo" class="field-label !mb-0">Repositorio GitHub</label>
            <button
              type="button"
              @click="importFromGitHub"
              :disabled="store.importingGitHub"
              class="text-[10px] font-mono-code px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/15 transition-colors disabled:opacity-50 cursor-pointer"
            >{{ store.importingGitHub ? 'Importando…' : 'Importar repositorio' }}</button>
          </div>
          <input id="project-repo" type="url" v-model="store.form.repo" @input="store.checkDirty()" placeholder="https://github.com/..." class="text-input font-mono-code" />
        </div>
      </div>
    </div>
  `,
}
