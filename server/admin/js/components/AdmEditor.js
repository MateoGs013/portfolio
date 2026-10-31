// Componente Estructural: AdmEditor
// Lienzo del editor con pestañas lineales, router interno de formularios y barra de acciones anclada.
// La cabecera (estado, selector ES|EN, duplicar) vive en AdmEditorHeader.

import { store } from '../store.js'
import { api } from '../api.js'
import { MODELS } from '../config.js'
import { AdmEditorHeader } from './AdmEditorHeader.js'

import { ProjectForm } from './forms/ProjectForm.js'
import { ExperienceForm } from './forms/ExperienceForm.js'
import { StackForm } from './forms/StackForm.js'
import { OrgsForm } from './forms/OrgsForm.js'
import { DocsForm } from './forms/DocsForm.js'
import { ArticleForm } from './forms/ArticleForm.js'

const { ref, computed } = window.Vue

export const AdmEditor = {
  name: 'AdmEditor',
  components: {
    AdmEditorHeader,
    ProjectForm,
    ExperienceForm,
    StackForm,
    OrgsForm,
    DocsForm,
    ArticleForm,
  },
  setup() {
    const model = computed(() => MODELS[store.section])

    const isSaving = ref(false)

    /**
     * Guarda el registro abierto. Se niega si el formulario es de otra sección (una lista que no cargó,
     * un cambio de sección a medias). La respuesta del servidor se aplica en el acto, así un segundo
     * Ctrl+S actualiza y no crea otro; la lista se refresca aparte y nunca le cambia el registro a
     * quien ya abrió otro.
     */
    async function save() {
      if (!store.form || isSaving.value) return
      const m = model.value
      if (!m) return
      if (store.formSection !== store.section || store.loadError) {
        store.toast('err', 'Este formulario no corresponde a la sección abierta. Volvé a abrir el registro antes de guardar.')
        return
      }

      const section = store.section
      const form = store.form
      const key = m.idKey || 'id'
      const sent = store.calcSnapshot(form)
      const wasNew = store.isNew
      isSaving.value = true
      let saved
      try {
        const payload = m.toPayload(form)
        if (wasNew) {
          saved = await api.createRecord(m.path, payload)
        } else {
          const idVal = store.current[key]
          const method = m.saveMethod ? m.saveMethod() : 'PUT'
          const savePath = m.saveUrl ? m.saveUrl(form) : `${m.path}/${encodeURIComponent(idVal)}`
          saved = await api.fetch(savePath, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        }
      } catch (err) {
        store.toast('err', `No se pudo guardar: ${err.message}`)
        isSaving.value = false
        return
      }

      const stillOpen = store.form === form && store.section === section
      if (stillOpen && saved && typeof saved === 'object' && saved[key] != null) {
        // Lo guardado pasa a ser el registro abierto, salvo que el operador haya seguido escribiendo.
        if (store.calcSnapshot(form) === sent) {
          store.selectRecord(saved)
        } else {
          store.current = saved
          store.isNew = false
          store.initialSnapshot = sent
          store.checkDirty()
        }
      }
      store.toast('ok', wasNew ? `${m.singular} creado` : `${m.singular} guardado`)
      isSaving.value = false

      try {
        const rows = (await api.getCollection(m.path)) || []
        if (store.section !== section) return
        store.rows = rows
        store.counts[section] = rows.length
        const savedId = saved?.[key]
        const row = rows.find(r => r[key] === savedId)
        // La fila de la lista reemplaza a la respuesta solo si el registro guardado sigue abierto.
        if (row && store.current && store.current[key] === savedId) store.current = row
      } catch {
        if (store.section === section) store.toast('err', 'Se guardó; no pudimos actualizar la lista.')
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
      isSaving,
      save,
      remove,
      cancelEdit,
    }
  },
  template: `
    <section class="flex-1 flex flex-col h-full overflow-hidden bg-[#08090a]">
      <div v-if="store.form" class="h-full flex flex-col overflow-hidden">
        
        <AdmEditorHeader />

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
          <p v-if="store.editingEn" class="max-w-2xl flex items-start gap-2 text-[11.5px] leading-relaxed text-zinc-300 border border-[#ff3e00]/25 bg-[#ff3e00]/[0.06] rounded px-3 py-2">
            <span class="mt-[5px] inline-block w-[7px] h-[7px] rotate-45 border border-[#ff8a5c] shrink-0" aria-hidden="true"></span>
            <span>Editando el inglés. Los campos con marca <b class="font-mono-code text-[#ff8a5c]">EN</b> guardan la traducción y muestran el español arriba; un campo vacío se publica en español. El resto es común a los dos idiomas.</span>
          </p>
          <ProjectForm v-if="store.section === 'projects'" />
          <ExperienceForm v-else-if="store.section === 'experience'" />
          <StackForm v-else-if="store.section === 'stack'" />
          <OrgsForm v-else-if="store.section === 'orgs'" />
          <DocsForm v-else-if="store.section === 'docs'" />
          <ArticleForm v-else-if="store.section === 'articles'" />
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
              <span v-if="store.canCreate">Nuevo: <kbd class="bg-black/40 text-zinc-300 px-1 py-0.5 rounded border border-white/10">Ctrl+N</kbd></span>
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
              v-if="store.canRemove"
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
              :disabled="isSaving"
              class="btn-primary !h-[30px] !text-[11px] sm:!text-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              title="Guardar cambios en la base de datos (Ctrl+S)"
            >
              <span v-if="isSaving" class="animate-spin inline-block text-[10px]">↻</span>
              <span>{{ isSaving ? 'Guardando...' : (store.isNew ? 'Crear' : 'Guardar') }}</span>
              <kbd v-if="!isSaving" class="hidden md:inline-block text-[9.5px] bg-black/40 px-1 py-0.2 rounded border border-black/20 text-black font-bold">Ctrl+S</kbd>
            </button>
          </div>
        </footer>


      </div>

      <div v-else-if="store.loadError" role="alert" class="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p class="max-w-md text-sm text-zinc-200">{{ store.loadError }}</p>
        <p class="max-w-md text-xs text-zinc-400">No hay nada abierto para editar, así que no se guarda ningún cambio hasta que la lista cargue.</p>
        <button type="button" class="btn-secondary !h-[30px] !text-xs cursor-pointer" @click="store.loadSection(store.section, false)">Reintentar</button>
      </div>

      <div v-else-if="store.loadingSection" class="h-full flex items-center justify-center text-zinc-400 text-xs" role="status">
        Cargando…
      </div>

      <div v-else class="h-full flex items-center justify-center text-zinc-500 text-xs font-mono-code">
        Seleccioná un registro del explorador o creá uno nuevo.
      </div>
    </section>
  `,
}
