// Formulario Especializado: ProjectForm (AdmProjectForm)
// Editor progresivo de proyectos de 6 pestañas con Linear tabs y dropzone técnico

import { store } from '../../store.js'
import { api } from '../../api.js'
import { METRIC_PRESETS, slugify } from '../../config.js'

const { computed, ref } = window.Vue

export const ProjectForm = {
  name: 'AdmProjectForm',
  setup() {
    const fileInput = ref(null)

    // Categorización estructurada de herramientas
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

    function onTitleInput() {
      if (store.slugLocked && store.form) {
        store.form.slug = slugify(store.form.title)
      }
      store.checkDirty()
    }

    function toggleSlugLock() {
      store.slugLocked = !store.slugLocked
      if (store.slugLocked && store.form) {
        store.form.slug = slugify(store.form.title)
      }
      store.checkDirty()
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

    // Métricas Visuales
    function addMetricPreset(p) {
      store.metricsList.push({ key: p.key, value: p.value })
      store.syncMetricsToJson()
      store.toast('ok', `Métrica agregada: ${p.label}`)
    }

    function addMetricVisual() {
      store.metricsList.push({ key: '', value: '' })
      store.syncMetricsToJson()
    }

    function removeMetricVisual(idx) {
      store.metricsList.splice(idx, 1)
      store.syncMetricsToJson()
    }

    function toggleAdvancedMetrics() {
      store.advancedMetricsMode = !store.advancedMetricsMode
    }

    // Subfilas
    function addSubRow(key) {
      if (!store.form) return
      if (!Array.isArray(store.form[key])) store.form[key] = []
      if (key === 'links') {
        store.form.links.push({ label: '', url: '' })
      } else if (key === 'steps') {
        const order = store.form.steps.length + 1
        store.form.steps.push({ order, title: '', body: '', mediaId: null })
      }
      store.checkDirty()
    }

    function removeSubRow(key, idx) {
      if (!store.form || !Array.isArray(store.form[key])) return
      store.form[key].splice(idx, 1)
      store.checkDirty()
    }

    // Subida de archivos
    async function uploadMedia(e) {
      const file = e.target.files?.[0]
      if (!file || !store.form?.id) return
      const fd = new FormData()
      fd.append('file', file)
      fd.append('projectId', String(store.form.id))
      fd.append('alt', file.name.replace(/\.[^/.]+$/, ''))
      fd.append('role', 'GALLERY')
      fd.append('order', String((store.form.media || []).length))

      store.uploading = true
      try {
        const row = await api.uploadMedia(fd)
        if (!store.form.media) store.form.media = []
        store.form.media.push(row)
        store.toast('ok', 'Imagen subida correctamente')
      } catch (err) {
        store.toast('err', `Error al subir imagen: ${err.message}`)
      } finally {
        store.uploading = false
        if (fileInput.value) fileInput.value.value = ''
      }
    }

    async function updateMediaRole(mediaId, role) {
      try {
        await api.updateMediaRole(mediaId, role)
        const item = (store.form?.media || []).find(m => m.id === mediaId)
        if (item) item.role = role
        store.toast('ok', `Rol actualizado a ${role}`)
      } catch (err) {
        store.toast('err', `Error al cambiar rol: ${err.message}`)
      }
    }

    async function deleteMedia(mediaId) {
      const confirmed = await store.requestConfirm({
        title: 'Eliminar Imagen',
        message: '¿Confirmás que querés eliminar esta captura multimedia?',
        detail: 'Esta acción borrará el archivo de disco y de la base de datos.',
        confirmText: 'Eliminar',
        kind: 'danger',
      })
      if (!confirmed) return
      try {
        await api.deleteMedia(mediaId)
        store.form.media = (store.form.media || []).filter(m => m.id !== mediaId)
        store.toast('ok', 'Imagen eliminada')
      } catch (err) {
        store.toast('err', `Error al borrar imagen: ${err.message}`)
      }
    }

    // Importación GitHub
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
        store.toast('ok', `Datos importados de GitHub (${owner}/${repo}): ${data.stargazers_count || 0} estrellas`)
        store.checkDirty()
      } catch (err) {
        store.toast('err', `No se pudo consultar GitHub: ${err.message}`)
      } finally {
        store.importingGitHub = false
      }
    }

    return {
      store,
      fileInput,
      categorizedTechs,
      metricPresets: METRIC_PRESETS,
      onTitleInput,
      toggleSlugLock,
      isTechSelected,
      toggleTech,
      addMetricPreset,
      addMetricVisual,
      removeMetricVisual,
      toggleAdvancedMetrics,
      addSubRow,
      removeSubRow,
      uploadMedia,
      updateMediaRole,
      deleteMedia,
      importFromGitHub,
    }
  },
  template: `
    <div class="max-w-2xl space-y-5">
      
      <!-- PESTAÑA 1: DATOS BÁSICOS -->
      <div v-show="store.activeTab === 'general'" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Título del Proyecto *</label>
            <input
              type="text"
              v-model="store.form.title"
              @input="onTitleInput"
              placeholder="Nombre del caso de estudio"
              class="text-input"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="field-label !mb-0">Slug Web (URL) *</label>
              <button
                type="button"
                @click="toggleSlugLock"
                class="text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-colors cursor-pointer"
                :class="store.slugLocked ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-400 bg-white/5 border-white/10 hover:text-white'"
              >
                {{ store.slugLocked ? '[BLOQUEADO] Vinculado' : '[MANUAL] Desbloqueado' }}
              </button>
            </div>
            <input
              type="text"
              v-model="store.form.slug"
              :readonly="store.slugLocked"
              placeholder="mi-proyecto"
              class="text-input font-mono-code"
            />
          </div>
        </div>

        <div>
          <label class="field-label">Empresa o Cliente Asociado</label>
          <select v-model="store.form.orgId" class="select-input" @change="store.checkDirty()">
            <option :value="null">Sin empresa vinculada (Proyecto independiente / Open source)</option>
            <option v-for="org in store.meta.options.orgs" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
          <span class="field-hint">Organización en la que se desarrolló este proyecto.</span>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="field-label">Año de Realización</label>
            <input
              type="number"
              v-model.number="store.form.year"
              @input="store.checkDirty()"
              class="text-input font-mono-code"
            />
          </div>

          <div>
            <label class="field-label">Rol Desempeñado</label>
            <input
              type="text"
              v-model="store.form.role"
              @input="store.checkDirty()"
              placeholder="Lead Developer & Designer"
              class="text-input"
            />
          </div>

          <div>
            <label class="field-label">Prioridad (Sort Order)</label>
            <input
              type="number"
              v-model.number="store.form.sortOrder"
              @input="store.checkDirty()"
              class="text-input font-mono-code"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Fecha de Publicación</label>
            <input
              type="datetime-local"
              v-model="store.form.publishedAt"
              @input="store.checkDirty()"
              class="text-input font-mono-code"
            />
          </div>

          <div class="flex items-center pt-5">
            <label class="flex items-center gap-2.5 text-xs text-white cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="store.form.featured"
                @change="store.checkDirty()"
                class="w-4 h-4 accent-[#ff3e00]"
              />
              <span class="font-medium">Destacar en portada principal</span>
            </label>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 2: CASO DE ESTUDIO & TEXTOS -->
      <div v-show="store.activeTab === 'story'" class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="field-label !mb-0">Síntesis Ejecutiva (Resumen Tarjeta) *</label>
            <span class="text-[10px] font-mono-code text-zinc-500">{{ (store.form.summary || '').length }} caracteres</span>
          </div>
          <textarea
            v-model="store.form.summary"
            @input="store.checkDirty()"
            rows="3"
            placeholder="Descripción concisa de 1 a 2 líneas que presenta el proyecto en las tarjetas del explorador..."
            class="textarea-input"
          ></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="field-label !mb-0">El Reto / Desafío (Brief Técnico)</label>
            <span class="text-[10px] font-mono-code text-zinc-500">{{ (store.form.brief || '').length }} caracteres</span>
          </div>
          <textarea
            v-model="store.form.brief"
            @input="store.checkDirty()"
            rows="4"
            placeholder="Problema técnico o de negocio que motivó este desarrollo..."
            class="textarea-input"
          ></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="field-label !mb-0">El Resultado / Impacto (Outcome)</label>
            <span class="text-[10px] font-mono-code text-zinc-500">{{ (store.form.outcome || '').length }} caracteres</span>
          </div>
          <textarea
            v-model="store.form.outcome"
            @input="store.checkDirty()"
            rows="4"
            placeholder="Logros cuantitativos, mejoras de rendimiento medibles y aprendizajes..."
            class="textarea-input"
          ></textarea>
        </div>
      </div>

      <!-- PESTAÑA 3: MULTIMEDIA & PORTADA -->
      <div v-show="store.activeTab === 'media'" class="space-y-4">
        <div v-if="store.isNew" class="p-4 bg-[#121318] border border-white/10 rounded text-xs text-zinc-400">
          Guardá el proyecto primero para habilitar la subida de capturas multimedia.
        </div>

        <div v-else class="space-y-4">
          <!-- Dropzone Técnico -->
          <div class="border-2 border-dashed border-white/10 hover:border-[#ff3e00] rounded-lg p-6 text-center cursor-pointer transition-colors bg-[#0d0e12] relative group">
            <input
              type="file"
              ref="fileInput"
              @change="uploadMedia"
              accept="image/*"
              class="absolute inset-0 opacity-0 cursor-pointer"
            />
            <svg class="adm-icon lg text-zinc-500 group-hover:text-[#ff3e00] mx-auto mb-2 transition-colors" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <div class="text-xs font-semibold text-white">Arrastrá capturas aquí o hacé clic para subir</div>
            <div class="text-[11px] font-mono-code text-zinc-500 mt-1">WebP, PNG, JPG (máximo 10MB)</div>
          </div>

          <!-- Cuadrícula de Imágenes -->
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="m in (store.form.media || [])"
              :key="m.id"
              class="p-3 bg-[#121318] border border-white/10 rounded flex items-start gap-3"
            >
              <img
                :src="m.src"
                :alt="m.alt"
                class="w-20 h-16 object-cover rounded bg-black shrink-0 cursor-pointer border border-white/10 hover:border-[#ff3e00]"
                @click="store.modals.lightbox = m.src"
              />
              <div class="flex-1 truncate space-y-1.5">
                <div class="text-xs font-medium text-white truncate font-mono-code">{{ (m.src || '').split('/').pop() }}</div>
                <div class="flex items-center gap-2">
                  <select
                    :value="m.role"
                    @change="updateMediaRole(m.id, $event.target.value)"
                    class="select-input !h-[26px] !text-[10px] font-mono-code"
                  >
                    <option value="COVER">PORTADA</option>
                    <option value="GALLERY">GALERÍA</option>
                    <option value="LAYER">CAPA</option>
                  </select>
                  <button type="button" @click="deleteMedia(m.id)" class="text-xs text-red-400 hover:underline">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 4: MÉTRICAS DE IMPACTO -->
      <div v-show="store.activeTab === 'metrics'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-xs font-bold text-white uppercase font-mono-code">Métricas Cuantificables</h3>
            <p class="text-[11px] text-zinc-400">Datos verificables como Lighthouse score o bundle size.</p>
          </div>
          <button
            type="button"
            @click="toggleAdvancedMetrics"
            class="text-[11px] font-mono-code text-zinc-400 hover:text-white underline cursor-pointer"
          >
            {{ store.advancedMetricsMode ? 'Volver a Modo Visual' : 'Modo JSON Avanzado' }}
          </button>
        </div>

        <div v-if="!store.advancedMetricsMode" class="space-y-3">
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span class="text-[11px] font-mono-code text-zinc-500 self-center mr-1">Presets rápidos:</span>
            <button
              v-for="p in metricPresets"
              :key="p.key"
              type="button"
              @click="addMetricPreset(p)"
              class="text-[10.5px] font-mono-code bg-[#121318] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              + {{ p.label }}
            </button>
          </div>

          <div v-for="(m, mIdx) in store.metricsList" :key="mIdx" class="flex items-center gap-2">
            <input
              type="text"
              v-model="m.key"
              @input="store.syncMetricsToJson()"
              placeholder="Nombre (ej: Lighthouse)"
              class="text-input !h-[30px] w-48 font-mono-code"
            />
            <input
              type="text"
              v-model="m.value"
              @input="store.syncMetricsToJson()"
              placeholder="Valor (ej: 99/100)"
              class="text-input !h-[30px] flex-1 font-mono-code"
            />
            <button
              type="button"
              @click="removeMetricVisual(mIdx)"
              class="text-zinc-500 hover:text-red-400 px-2 py-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            @click="addMetricVisual"
            class="btn-secondary !h-[28px] !text-[11px]"
          >
            + Añadir Métrica Personalizada
          </button>
        </div>

        <div v-else>
          <textarea
            v-model="store.form.metrics"
            @input="store.checkDirty()"
            rows="6"
            placeholder='{\n  "Lighthouse": "100/100",\n  "Bundle": "< 45 kB"\n}'
            class="textarea-input font-mono-code text-xs"
          ></textarea>
        </div>
      </div>

      <!-- PESTAÑA 5: STACK & ENLACES -->
      <div v-show="store.activeTab === 'stack'" class="space-y-5">
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="field-label !mb-0">Tecnologías Utilizadas ({{ (store.form.techIds || []).length }} seleccionadas)</label>
            <input
              type="text"
              v-model="store.techSearchQuery"
              placeholder="Filtrar stack..."
              class="text-input !h-[26px] !w-36 text-[11px] font-mono-code"
            />
          </div>

          <div class="space-y-3 bg-[#0d0e12] p-3 rounded border border-white/10 max-h-64 overflow-y-auto">
            <div v-for="cat in categorizedTechs" :key="cat.key" class="space-y-1.5">
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

        <div class="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label class="field-label">URL Pública / Demo Online</label>
            <input
              type="url"
              v-model="store.form.url"
              @input="store.checkDirty()"
              placeholder="https://..."
              class="text-input font-mono-code"
            />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="field-label !mb-0">Repositorio GitHub</label>
              <button
                type="button"
                @click="importFromGitHub"
                :disabled="store.importingGitHub"
                class="text-[10px] font-mono-code px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/15 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <span v-if="store.importingGitHub" class="animate-spin inline-block">↻</span>
                <span>Importar repositorio</span>
              </button>
            </div>
            <input
              type="url"
              v-model="store.form.repo"
              @input="store.checkDirty()"
              placeholder="https://github.com/..."
              class="text-input font-mono-code"
            />
          </div>
        </div>
      </div>

      <!-- PESTAÑA 6: ENLACES & PASOS -->
      <div v-show="store.activeTab === 'sub'" class="space-y-6">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase font-mono-code">Enlaces Secundarios</h4>
            <button type="button" @click="addSubRow('links')" class="text-xs text-[#ff3e00] hover:underline font-medium cursor-pointer">+ Agregar Enlace</button>
          </div>
          <div v-for="(lnk, idx) in (store.form.links || [])" :key="idx" class="flex items-center gap-2">
            <input
              type="text"
              v-model="lnk.label"
              @input="store.checkDirty()"
              placeholder="Etiqueta (ej: Documentación)"
              class="text-input !h-[30px] w-48 font-mono-code"
            />
            <input
              type="url"
              v-model="lnk.url"
              @input="store.checkDirty()"
              placeholder="https://..."
              class="text-input !h-[30px] flex-1 font-mono-code"
            />
            <button
              type="button"
              @click="removeSubRow('links', idx)"
              class="text-zinc-500 hover:text-red-400 px-2 py-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase font-mono-code">Pasos del Proceso (Caso de Estudio)</h4>
            <button type="button" @click="addSubRow('steps')" class="text-xs text-[#ff3e00] hover:underline font-medium cursor-pointer">+ Agregar Paso</button>
          </div>
          <div
            v-for="(stp, idx) in (store.form.steps || [])"
            :key="idx"
            class="p-3.5 bg-[#121318] border border-white/10 rounded space-y-2"
          >
            <div class="flex items-center justify-between">
              <input
                type="text"
                v-model="stp.title"
                @input="store.checkDirty()"
                placeholder="Título (ej: 01 · Arquitectura inicial)"
                class="text-input !h-[30px] flex-1 font-mono-code"
              />
              <button
                type="button"
                @click="removeSubRow('steps', idx)"
                class="text-zinc-500 hover:text-red-400 px-2 py-1 text-xs ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <textarea
              v-model="stp.body"
              @input="store.checkDirty()"
              rows="2"
              placeholder="Detalle técnico de la fase..."
              class="textarea-input"
            ></textarea>
          </div>
        </div>
      </div>

    </div>
  `,
}
