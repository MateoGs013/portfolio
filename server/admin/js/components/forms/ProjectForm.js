// Formulario Especializado: ProjectForm (AdmProjectForm)
// Editor progresivo de obras en 6 pestañas (Linear tabs). Datos básicos y textos viven acá;
// media, métricas, stack y pasos tienen su componente en ./project/. En modo EN, los textos
// traducibles pasan a su versión en inglés con el español de referencia (EnField).

import { store } from '../../store.js'
import { slugify, toLocalDatetime } from '../../config.js'
import { isPublished } from '../../fields.js'
import { EnField } from './EnField.js'
import { ProjectMedia } from './project/ProjectMedia.js'
import { ProjectMetrics } from './project/ProjectMetrics.js'
import { ProjectStack } from './project/ProjectStack.js'
import { ProjectSteps } from './project/ProjectSteps.js'

const { computed } = window.Vue

export const ProjectForm = {
  name: 'AdmProjectForm',
  components: { EnField, ProjectMedia, ProjectMetrics, ProjectStack, ProjectSteps },
  setup() {
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

    // «Mostrar en el sitio»: encendido = fecha de publicación (ahora, si no tenía); apagado = sin fecha.
    const visible = computed(() => !!store.form?.publishedAt)
    const scheduled = computed(() => visible.value && !isPublished({ publishedAt: store.form.publishedAt }))

    function toggleVisible() {
      store.form.publishedAt = visible.value ? '' : toLocalDatetime(new Date().toISOString())
      store.checkDirty()
    }

    return { store, onTitleInput, toggleSlugLock, visible, scheduled, toggleVisible }
  },
  template: `
    <div class="max-w-2xl space-y-5">

      <!-- PESTAÑA 1: DATOS BÁSICOS -->
      <div v-show="store.activeTab === 'general'" class="space-y-4">
        <div class="p-3 bg-[#0d0e12] border border-white/10 rounded flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            id="project-visible"
            type="button"
            role="switch"
            class="switch"
            :aria-checked="visible ? 'true' : 'false'"
            aria-describedby="project-visible-hint"
            @click="toggleVisible"
          ><span class="sr-only">Mostrar en el sitio</span></button>
          <label for="project-visible" class="text-xs font-semibold text-white cursor-pointer select-none">Mostrar en el sitio</label>
          <span id="project-visible-hint" class="text-[11px] text-zinc-400 flex-1 min-w-[12rem]">
            {{ !visible ? 'Oculta: queda en la base pero el sitio no la lista ni la enlaza.' : scheduled ? 'Programada: aparece en el sitio desde la fecha elegida.' : 'Visible en el sitio desde la fecha de publicación.' }}
          </span>
          <input
            v-if="visible"
            type="datetime-local"
            v-model="store.form.publishedAt"
            @input="store.checkDirty()"
            aria-label="Fecha de publicación"
            class="text-input !h-[30px] !w-auto font-mono-code"
          />
        </div>

        <div v-if="store.editingEn" class="space-y-4">
          <EnField
            id="project-title-en"
            label="Título"
            :es="store.form.title"
            v-model="store.form.en.title"
            hint="Vacío: se usa el título en español. Un nombre propio no se traduce."
          />
          <EnField id="project-role-en" label="Rol desempeñado" :es="store.form.role" v-model="store.form.en.role" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label v-if="!store.editingEn" class="block">
            <span class="field-label">Título del proyecto *</span>
            <input type="text" v-model="store.form.title" @input="onTitleInput" placeholder="Nombre del caso de estudio" class="text-input" />
          </label>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="project-slug" class="field-label !mb-0">Slug web (URL) *</label>
              <button
                type="button"
                @click="toggleSlugLock"
                :aria-pressed="store.slugLocked"
                class="text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-colors cursor-pointer"
                :class="store.slugLocked ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-400 bg-white/5 border-white/10 hover:text-white'"
              >
                {{ store.slugLocked ? '[BLOQUEADO] Vinculado' : '[MANUAL] Desbloqueado' }}
              </button>
            </div>
            <input id="project-slug" type="text" v-model="store.form.slug" :readonly="store.slugLocked" placeholder="mi-proyecto" class="text-input font-mono-code" />
          </div>
        </div>

        <label class="block">
          <span class="field-label">Empresa o cliente asociado</span>
          <select v-model="store.form.orgId" class="select-input" @change="store.checkDirty()">
            <option :value="null">Sin empresa vinculada (proyecto independiente / open source)</option>
            <option v-for="org in store.meta.options.orgs" :key="org.id" :value="org.id">{{ org.name }}</option>
          </select>
          <span class="field-hint">Organización en la que se desarrolló este proyecto.</span>
        </label>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label class="block">
            <span class="field-label">Año de realización</span>
            <input type="number" v-model.number="store.form.year" @input="store.checkDirty()" class="text-input font-mono-code" />
          </label>
          <label v-if="!store.editingEn" class="block">
            <span class="field-label">Rol desempeñado</span>
            <input type="text" v-model="store.form.role" @input="store.checkDirty()" placeholder="Lead Developer & Designer" class="text-input" />
          </label>
          <label class="block">
            <span class="field-label">Orden en el sitio</span>
            <input type="number" v-model.number="store.form.sortOrder" @input="store.checkDirty()" class="text-input font-mono-code" />
            <span class="field-hint">También se cambia con subir/bajar en la lista.</span>
          </label>
        </div>

        <label class="flex items-center gap-2.5 text-xs text-white cursor-pointer select-none">
          <input type="checkbox" v-model="store.form.featured" @change="store.checkDirty()" class="w-4 h-4 accent-[#ff3e00]" />
          <span class="font-medium">Destacar en portada principal</span>
        </label>
      </div>

      <!-- PESTAÑA 2: CASO DE ESTUDIO & TEXTOS -->
      <div v-if="store.editingEn" v-show="store.activeTab === 'story'" class="space-y-4">
        <EnField id="project-summary-en" label="Síntesis ejecutiva (resumen tarjeta)" :es="store.form.summary" v-model="store.form.en.summary" :rows="3" />
        <EnField id="project-brief-en" label="El reto / desafío (brief técnico)" :es="store.form.brief" v-model="store.form.en.brief" :rows="4" />
        <EnField id="project-outcome-en" label="El resultado / impacto (outcome)" :es="store.form.outcome" v-model="store.form.en.outcome" :rows="4" />
      </div>
      <div v-else v-show="store.activeTab === 'story'" class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="project-summary" class="field-label !mb-0">Síntesis ejecutiva (resumen tarjeta) *</label>
            <span class="text-[10px] font-mono-code text-zinc-500">{{ (store.form.summary || '').length }} caracteres</span>
          </div>
          <textarea id="project-summary" v-model="store.form.summary" @input="store.checkDirty()" rows="3" placeholder="Descripción concisa de 1 a 2 líneas que presenta el proyecto en las tarjetas..." class="textarea-input"></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="project-brief" class="field-label !mb-0">El reto / desafío (brief técnico)</label>
            <span class="text-[10px] font-mono-code text-zinc-500">{{ (store.form.brief || '').length }} caracteres</span>
          </div>
          <textarea id="project-brief" v-model="store.form.brief" @input="store.checkDirty()" rows="4" placeholder="Problema técnico o de negocio que motivó este desarrollo..." class="textarea-input"></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="project-outcome" class="field-label !mb-0">El resultado / impacto (outcome)</label>
            <span class="text-[10px] font-mono-code text-zinc-500">{{ (store.form.outcome || '').length }} caracteres</span>
          </div>
          <textarea id="project-outcome" v-model="store.form.outcome" @input="store.checkDirty()" rows="4" placeholder="Logros medibles y aprendizajes..." class="textarea-input"></textarea>
        </div>
      </div>

      <!-- PESTAÑAS 3 a 6 -->
      <ProjectMedia v-show="store.activeTab === 'media'" />
      <ProjectMetrics v-show="store.activeTab === 'metrics'" />
      <ProjectStack v-show="store.activeTab === 'stack'" />
      <ProjectSteps v-show="store.activeTab === 'sub'" />
    </div>
  `,
}
