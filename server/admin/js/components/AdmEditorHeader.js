// Cabecera del editor: ruta del registro, estado de guardado, selector ES|EN con lo que falta
// traducir, duplicar y estado de publicación (obras y artículos).

import { store } from '../store.js'
import { TRANSLATABLE_SECTIONS, missingText } from '../translations.js'

const { computed } = window.Vue

const STATUS_PILLS = {
  projects: [{ value: 'LIVE', dot: 'live' }, { value: 'WIP', dot: 'wip' }, { value: 'ARCHIVED', dot: 'archived' }],
  articles: [{ value: 'PUBLISHED', dot: 'live' }, { value: 'DRAFT', dot: 'wip' }, { value: 'ARCHIVED', dot: 'archived' }],
}
const PILL_ON = {
  live: 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30',
  wip: 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30',
  archived: 'bg-zinc-500/15 text-zinc-300 font-bold border border-zinc-500/30',
}
const LANGS = [
  { value: 'es', title: 'Editar el español: el registro' },
  { value: 'en', title: 'Editar el inglés, con el español de referencia' },
]

export const AdmEditorHeader = {
  name: 'AdmEditorHeader',
  setup() {
    const translatable = computed(() => TRANSLATABLE_SECTIONS.includes(store.section))
    const pills = computed(() => (store.form?.status !== undefined ? STATUS_PILLS[store.section] || [] : []))
    const missing = computed(() => store.missingEnList)

    function setStatus(status) {
      store.form.status = status
      store.checkDirty()
    }

    function duplicateRecord() {
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
      cloned.status = store.section === 'articles' ? 'DRAFT' : 'WIP'
      cloned.featured = false
      // Una copia de obra nace oculta y sin media: «Mostrar en el sitio» se enciende a mano.
      if (store.section === 'projects') {
        cloned.publishedAt = ''
        cloned.media = []
      }

      store.current = null
      store.isNew = true
      store.form = cloned
      store.slugLocked = false
      store.isDirty = true
      store.toast('ok', `Registro duplicado: "${baseTitle}". Revisá los datos y guardá.`)
    }

    return { store, translatable, pills, missing, missingText, setStatus, duplicateRecord, LANGS, PILL_ON }
  },
  template: `
    <div class="p-3 sm:p-4 px-4 sm:px-6 border-b border-white/10 bg-[#0c0d10] flex items-center justify-between shrink-0 select-none flex-wrap sm:flex-nowrap gap-2">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          @click="store.mobileView = 'list'"
          class="md:hidden flex items-center gap-1 px-2.5 py-1 text-xs font-mono-code text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 shrink-0 cursor-pointer"
          title="Volver a la lista"
        >
          <span aria-hidden="true">←</span>
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

      <div class="flex items-center gap-2 sm:gap-2.5 flex-wrap max-w-full sm:shrink-0">
        <template v-if="translatable">
          <span
            v-if="missing.length"
            class="flex items-center gap-1.5 text-[10.5px] font-mono-code text-amber-300"
            :title="missingText(missing)"
          >
            <span class="inline-block w-[7px] h-[7px] rotate-45 border border-amber-400" aria-hidden="true"></span>
            <span aria-hidden="true">{{ missing.length }} sin traducir</span>
            <span class="sr-only">{{ missingText(missing) }}</span>
          </span>
          <div role="group" aria-label="Idioma que se edita" class="flex items-center gap-0.5 bg-[#121318] p-0.5 rounded border border-white/10">
            <button
              v-for="l in LANGS"
              :key="l.value"
              type="button"
              @click="store.lang = l.value"
              :aria-pressed="store.lang === l.value ? 'true' : 'false'"
              :title="l.title"
              class="px-2 py-0.5 rounded text-[10.5px] font-mono-code transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ff3e00]"
              :class="store.lang === l.value ? 'bg-white/15 text-white font-bold' : 'text-zinc-400 hover:text-white'"
            >{{ l.value.toUpperCase() }}</button>
          </div>
        </template>

        <button
          type="button"
          @click="duplicateRecord"
          class="btn-secondary !h-[28px] !text-[11px] cursor-pointer"
          title="Duplicar como nuevo borrador (Ctrl+D)"
        >
          <span>Duplicar</span>
          <kbd class="hidden md:inline-block text-[9px] font-mono-code bg-black/40 px-1 rounded border border-white/10 text-zinc-400">Ctrl+D</kbd>
        </button>

        <div v-if="pills.length" class="flex items-center gap-1 bg-[#121318] p-0.5 rounded border border-white/10">
          <button
            v-for="(p, i) in pills"
            :key="p.value"
            type="button"
            @click="setStatus(p.value)"
            class="px-2 py-0.5 rounded font-mono-code transition-colors items-center gap-1 cursor-pointer"
            :class="[
              i === 2 ? 'hidden sm:flex text-[10.5px]' : 'flex text-[10px] sm:text-[10.5px]',
              store.form.status === p.value ? PILL_ON[p.dot] : 'text-zinc-500 hover:text-white',
            ]"
          >
            <span class="status-dot" :class="p.dot"></span> {{ p.value }}
          </button>
        </div>
      </div>
    </div>
  `,
}
