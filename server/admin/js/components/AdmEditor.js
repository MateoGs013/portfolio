// Componente Estructural: AdmEditor
// Lienzo del editor con pestañas lineales, router interno de formularios y barra de acciones anclada

import { store } from '../store.js'
import { api } from '../api.js'
import { MODELS } from '../config.js'

import { ProjectForm } from './forms/ProjectForm.js'
import { ExperienceForm } from './forms/ExperienceForm.js'
import { StackForm } from './forms/StackForm.js'
import { OrgsForm } from './forms/OrgsForm.js'
import { DocsForm } from './forms/DocsForm.js'

const { computed } = window.Vue

export const AdmEditor = {
  name: 'AdmEditor',
  components: {
    ProjectForm,
    ExperienceForm,
    StackForm,
    OrgsForm,
    DocsForm,
  },
  setup() {
    const model = computed(() => MODELS[store.section])

    function setProjectStatus(status) {
      if (store.form) {
        store.form.status = status
        store.checkDirty()
      }
    }

    async function duplicateRecord() {
      if (!store.form) return
      const baseTitle = store.form.title || store.form.name || store.form.role || 'Copia'
      const cloned = JSON.parse(JSON.stringify(store.form))
      delete cloned.id
      delete cloned.createdAt
      delete cloned.updatedAt
      cloned.slug = `${cloned.slug || 'copia'}-borrador`
      if (cloned.title) cloned.title = `${cloned.title} (Copia)`
      if (cloned.name) cloned.name = `${cloned.name} (Copia)`
      if (cloned.role) cloned.role = `${cloned.role} (Copia)`
      cloned.status = 'WIP'
      cloned.featured = false

      store.current = null
      store.isNew = true
      store.form = cloned
      store.slugLocked = false
      store.isDirty = true
      store.toast('ok', `Registro duplicado: "${baseTitle}". Revisá los datos y guardá.`)
    }

    async function save() {
      if (!store.form) return
      const m = model.value
      if (!m) return

      try {
        const payload = m.toPayload(store.form)
        let saved = null

        if (store.isNew) {
          saved = await api.createRecord(m.path, payload)
          store.toast('ok', `${m.singular} creado exitosamente`)
        } else {
          const idVal = store.current[m.idKey || 'id']
          const method = m.saveMethod ? m.saveMethod() : 'PUT'
          const savePath = m.saveUrl ? m.saveUrl(store.form) : `${m.path}/${encodeURIComponent(idVal)}`
          saved = await api.fetch(savePath, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          store.toast('ok', `${m.singular} actualizado`)
        }

        // Recargar lista y seleccionar el registro guardado
        const refreshedRows = await api.getCollection(m.path)
        store.rows = refreshedRows || []
        store.counts[store.section] = store.rows.length

        const targetKey = m.idKey || 'id'
        const savedId = saved ? saved[targetKey] : (store.current ? store.current[targetKey] : null)
        const match = store.rows.find(r => r[targetKey] === savedId) || store.rows[0]
        if (match) {
          store.selectRecord(match)
        }
      } catch (err) {
        store.toast('err', `Error al guardar: ${err.message}`)
      }
    }

    async function remove() {
      if (!store.current || store.isNew) return
      const m = model.value
      if (!m) return
      const targetName = m.name ? m.name(store.current) : (store.current.title || store.current.name || store.current.slug || '')

      const confirmed = await store.requestConfirm({
        title: `Eliminar ${m.singular}`,
        message: `¿Estás seguro de que deseás eliminar este registro de la base de datos?`,
        targetName: `[${m.label}] ${targetName}`,
        detail: 'Esta acción no se puede deshacer y borrará los datos permanentemente.',
        confirmText: 'Eliminar Registro',
        kind: 'danger',
      })
      if (!confirmed) return

      try {
        const idVal = store.current[m.idKey || 'id']
        await api.deleteRecord(m.path, idVal)
        store.toast('ok', `${m.singular} eliminado exitosamente`)

        const refreshedRows = await api.getCollection(m.path)
        store.rows = refreshedRows || []
        store.counts[store.section] = store.rows.length

        if (store.rows.length > 0) {
          store.selectRecord(store.rows[0])
        } else {
          store.createRecord()
        }
        store.mobileView = 'list'
      } catch (err) {
        store.toast('err', `Error al eliminar: ${err.message}`)
      }
    }

    async function cancelEdit() {
      if (store.isDirty) {
        await store.checkDirtyDiscard(() => {
          if (store.current) {
            store.selectRecord(store.current)
          } else if (store.rows.length > 0) {
            store.selectRecord(store.rows[0])
          }
          store.mobileView = 'list'
        })
      } else {
        if (store.current) {
          store.selectRecord(store.current)
        }
        store.mobileView = 'list'
      }
    }

    return {
      store,
      model,
      setProjectStatus,
      duplicateRecord,
      save,
      remove,
      cancelEdit,
    }
  },
  template: `
    <section class="flex-1 flex flex-col h-full overflow-hidden bg-[#08090a]">
      <div v-if="store.form" class="h-full flex flex-col overflow-hidden">
        
        <!-- CABECERA DEL EDITOR -->
        <div class="p-3 sm:p-4 px-4 sm:px-6 border-b border-white/10 bg-[#0c0d10] flex items-center justify-between shrink-0 select-none flex-wrap sm:flex-nowrap gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              @click="store.mobileView = 'list'"
              class="md:hidden flex items-center gap-1 px-2.5 py-1 text-xs font-mono-code text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 shrink-0 cursor-pointer"
              title="Volver a la lista"
            >
              <span>←</span>
              <span>Lista</span>
            </button>
            <span class="text-[11px] font-mono-code uppercase text-zinc-500 tracking-wider truncate">
              {{ store.section }} / {{ store.isNew ? 'nuevo' : (store.form.slug || store.form.key || 'editar') }}
            </span>
            <span class="h-3 w-px bg-white/10 hidden sm:inline-block"></span>
            <div class="hidden sm:flex items-center gap-1.5 shrink-0">
              <span class="status-dot" :class="store.isDirty ? 'wip' : 'live'"></span>
              <span class="text-[11px] font-mono-code" :class="store.isDirty ? 'text-amber-400' : 'text-emerald-400'">
                {{ store.isDirty ? 'Modificado' : 'Sincronizado' }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              @click="duplicateRecord"
              class="btn-secondary !h-[28px] !text-[11px] cursor-pointer"
              title="Duplicar como nuevo borrador (Ctrl+D)"
            >
              <span>Duplicar</span>
              <kbd class="hidden md:inline-block text-[9px] font-mono-code bg-black/40 px-1 rounded border border-white/10 text-zinc-400">Ctrl+D</kbd>
            </button>

            <!-- Selector de Estado Pill para Proyectos -->
            <div v-if="store.form.status !== undefined" class="flex items-center gap-1 bg-[#121318] p-0.5 rounded border border-white/10">
              <button
                type="button"
                @click="setProjectStatus('LIVE')"
                class="px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono-code transition-colors flex items-center gap-1 cursor-pointer"
                :class="store.form.status === 'LIVE' ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30' : 'text-zinc-500 hover:text-white'"
              >
                <span class="status-dot live"></span> LIVE
              </button>
              <button
                type="button"
                @click="setProjectStatus('WIP')"
                class="px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono-code transition-colors flex items-center gap-1 cursor-pointer"
                :class="store.form.status === 'WIP' ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30' : 'text-zinc-500 hover:text-white'"
              >
                <span class="status-dot wip"></span> WIP
              </button>
              <button
                type="button"
                @click="setProjectStatus('ARCHIVED')"
                class="hidden sm:flex px-2 py-0.5 rounded text-[10.5px] font-mono-code transition-colors items-center gap-1 cursor-pointer"
                :class="store.form.status === 'ARCHIVED' ? 'bg-zinc-500/15 text-zinc-300 font-bold border border-zinc-500/30' : 'text-zinc-500 hover:text-white'"
              >
                <span class="status-dot archived"></span> ARCHIVED
              </button>
            </div>
          </div>
        </div>

        <!-- Pestañas Lineales (Linear-style tabs) para Proyectos -->
        <div
          v-if="store.section === 'projects'"
          class="px-4 sm:px-6 border-b border-white/10 bg-[#0c0d10] flex items-center gap-2 shrink-0 select-none overflow-x-auto"
        >
          <button type="button" @click="store.activeTab = 'general'" class="linear-tab shrink-0" :class="{ active: store.activeTab === 'general' }">
            <span>Datos Básicos</span>
          </button>
          <button type="button" @click="store.activeTab = 'story'" class="linear-tab shrink-0" :class="{ active: store.activeTab === 'story' }">
            <span>Caso de Estudio & Textos</span>
          </button>
          <button type="button" @click="store.activeTab = 'media'" class="linear-tab shrink-0" :class="{ active: store.activeTab === 'media' }">
            <span>Multimedia & Portada</span>
            <span v-if="(store.form.media || []).length" class="text-[9.5px] bg-white/10 px-1 rounded">{{ (store.form.media || []).length }}</span>
          </button>
          <button type="button" @click="store.activeTab = 'metrics'" class="linear-tab shrink-0" :class="{ active: store.activeTab === 'metrics' }">
            <span>Métricas de Impacto</span>
            <span v-if="store.metricsList.length" class="text-[9.5px] bg-white/10 px-1 rounded">{{ store.metricsList.length }}</span>
          </button>
          <button type="button" @click="store.activeTab = 'stack'" class="linear-tab shrink-0" :class="{ active: store.activeTab === 'stack' }">
            <span>Stack & Enlaces</span>
            <span v-if="(store.form.techIds || []).length" class="text-[9.5px] bg-white/10 px-1 rounded">{{ (store.form.techIds || []).length }}</span>
          </button>
          <button type="button" @click="store.activeTab = 'sub'" class="linear-tab shrink-0" :class="{ active: store.activeTab === 'sub' }">
            <span>Enlaces & Pasos</span>
          </button>
        </div>

        <!-- CUERPO DEL EDITOR (SCROLL CENTRAL INDEPENDIENTE) -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          <ProjectForm v-if="store.section === 'projects'" />
          <ExperienceForm v-else-if="store.section === 'experience'" />
          <StackForm v-else-if="store.section === 'stack'" />
          <OrgsForm v-else-if="store.section === 'orgs'" />
          <DocsForm v-else-if="store.section === 'docs'" />
        </div>

        <!-- BARRA DE ACCIONES ANCLADA AL PIE DEL EDITOR -->
        <footer class="h-[54px] px-4 sm:px-6 border-t border-white/10 bg-[#0c0d10] flex items-center justify-between shrink-0 select-none">
          <div class="flex items-center gap-3 text-xs text-zinc-500 font-mono-code">
            <div class="flex items-center gap-1.5">
              <span class="status-dot" :class="store.isDirty ? 'wip' : 'live'"></span>
              <span v-if="store.isDirty" class="text-amber-400 text-[11px] sm:text-xs">Modificado</span>
              <span v-else class="text-emerald-400 text-[11px] sm:text-xs">Sincronizado</span>
            </div>
            <div class="hidden lg:flex items-center gap-3 border-l border-white/10 pl-3 text-[11px]">
              <span>Guardar: <kbd class="bg-black/40 text-zinc-300 px-1 py-0.5 rounded border border-white/10">Ctrl+S</kbd></span>
              <span>Nuevo: <kbd class="bg-black/40 text-zinc-300 px-1 py-0.5 rounded border border-white/10">Ctrl+N</kbd></span>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              @click="cancelEdit"
              class="btn-secondary !h-[30px] !text-[11px] sm:!text-xs cursor-pointer"
              :title="store.isDirty ? 'Descartar cambios no guardados' : 'Cerrar editor'"
            >
              {{ store.isDirty ? 'Descartar' : 'Cerrar' }}
            </button>

            <button
              v-if="!store.isNew"
              type="button"
              @click="remove"
              class="btn-danger !h-[30px] !text-[11px] sm:!text-xs cursor-pointer"
              title="Eliminar este registro permanentemente"
            >
              Eliminar
            </button>

            <button
              type="button"
              @click="save"
              class="btn-primary !h-[30px] !text-[11px] sm:!text-xs cursor-pointer"
              title="Guardar cambios en la base de datos (Ctrl+S)"
            >
              <span>{{ store.isNew ? 'Crear' : 'Guardar' }}</span>
              <kbd class="hidden md:inline-block text-[9.5px] bg-black/40 px-1 py-0.2 rounded border border-black/20 text-black font-bold">Ctrl+S</kbd>
            </button>
          </div>
        </footer>


      </div>

      <div v-else class="h-full flex items-center justify-center text-zinc-500 text-xs font-mono-code">
        Seleccioná un registro del explorador o creá uno nuevo.
      </div>
    </section>
  `,
}
