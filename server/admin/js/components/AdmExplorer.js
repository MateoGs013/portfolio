// Componente Estructural: AdmExplorer
// Columna exploradora de 320px con buscador reactivo, filtros por estado y botón + Nuevo.
// Cada tarjeta con texto en español sin su inglés lleva la marca «sin traducir» (rombo, sin emojis).

import { store } from '../store.js'
import { MODELS } from '../config.js'
import { isPublished } from '../fields.js'
import { TRANSLATABLE_SECTIONS, missingEn, missingText } from '../translations.js'

const { computed } = window.Vue

export const AdmExplorer = {
  name: 'AdmExplorer',
  setup() {
    const model = computed(() => MODELS[store.section])

    /** Campos sin inglés por fila guardada (la marca desaparece al guardar la traducción completa). */
    const missingByRow = computed(() => {
      const m = model.value
      if (!m || !TRANSLATABLE_SECTIONS.includes(store.section)) return new Map()
      return new Map((store.rows || []).map(r => [r, missingEn(store.section, m.toForm(r))]))
    })
    const missingOf = r => missingByRow.value.get(r) || []

    const translatable = computed(() => TRANSLATABLE_SECTIONS.includes(store.section))
    const untranslatedCount = computed(() => (store.rows || []).filter(r => missingOf(r).length).length)

    const filteredRows = computed(() => {
      const q = store.searchQuery.trim().toLowerCase()
      let list = store.rows || []

      // Filtro por píldoras
      if (store.filter === 'live') {
        list = list.filter(r => r.status === 'LIVE' || r.status === 'PUBLISHED')
      } else if (store.filter === 'wip') {
        list = list.filter(r => r.status === 'WIP' || r.status === 'DRAFT')
      } else if (store.filter === 'featured') {
        list = list.filter(r => !!r.featured)
      } else if (store.filter === 'hidden') {
        list = list.filter(r => !isPublished(r))
      } else if (store.filter === 'untranslated') {
        list = list.filter(r => missingOf(r).length)
      }

      if (!q) return list
      return list.filter(r => {
        const title = (r.title || r.name || r.role || r.key || '').toLowerCase()
        const slug = (r.slug || '').toLowerCase()
        const meta = model.value?.meta ? model.value.meta(r).toLowerCase() : ''
        return title.includes(q) || slug.includes(q) || meta.includes(q)
      })
    })

    // El orden de las obras se toca solo con la lista completa a la vista (sin filtro ni búsqueda).
    const canReorder = computed(() => store.section === 'projects' && store.filter === 'all' && !store.searchQuery.trim())

    function isSelected(r) {
      if (store.isNew || !store.current) return false
      const key = model.value?.idKey || 'id'
      return store.current[key] === r[key]
    }

    async function onSelect(r) {
      store.mobileView = 'detail'
      if (isSelected(r)) return
      if (store.isDirty) {
        const proceed = await store.checkDirtyDiscard(() => store.selectRecord(r))
        if (!proceed) return
      } else {
        store.selectRecord(r)
      }
    }

    async function onCreate() {
      store.mobileView = 'detail'
      if (store.isNew) return
      if (store.isDirty) {
        const proceed = await store.checkDirtyDiscard(() => store.createRecord())
        if (!proceed) return
      } else {
        store.createRecord()
      }
    }

    return {
      store,
      model,
      filteredRows,
      canReorder,
      missingOf,
      missingText,
      translatable,
      untranslatedCount,
      isPublished,
      isSelected,
      onSelect,
      onCreate,
    }
  },
  template: `
    <div class="w-full md:w-80 bg-[#101114] border-r border-white/10 flex flex-col shrink-0 overflow-hidden select-none">
      <!-- Cabecera de Explorador -->
      <div class="p-3 border-b border-white/10 space-y-2.5 bg-[#0c0d10]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-bold text-white uppercase font-mono-code tracking-wide">
              {{ model?.label }}
            </h2>
            <span class="text-[10px] font-mono-code bg-white/5 text-zinc-400 px-1.5 py-0.2 rounded border border-white/10">
              {{ filteredRows.length }}
            </span>
          </div>

          <button
            type="button"
            @click="onCreate"
            class="btn-primary !h-[26px] !px-2.5 !text-xs cursor-pointer"
            title="Crear nuevo registro (Ctrl+N)"
          >
            <span>+ Nuevo</span>
            <kbd class="text-[9px] font-mono-code bg-black/40 px-1 rounded border border-black/20 text-black font-bold">Ctrl+N</kbd>
          </button>
        </div>

        <!-- Buscador Reactivo -->
        <div class="relative">
          <input
            type="text"
            v-model="store.searchQuery"
            :placeholder="'Buscar en ' + (model?.label || 'registros') + '...'"
            class="text-input !h-[30px] pl-7 text-xs font-mono-code"
          />
          <svg class="adm-icon sm text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>

        <!-- Filtros Rápidos en Píldoras Sobrias (Para proyectos y artículos) -->
        <div v-if="store.section === 'projects' || store.section === 'articles' || translatable" class="flex flex-wrap items-center gap-1 text-[10.5px] font-mono-code">
          <button
            type="button"
            @click="store.filter = 'all'"
            class="px-2 py-0.5 rounded transition-colors cursor-pointer"
            :class="store.filter === 'all' ? 'bg-white/15 text-white font-semibold' : 'text-zinc-500 hover:text-white'"
          >
            Todos
          </button>
          <template v-if="store.section === 'projects' || store.section === 'articles'">
            <button
              type="button"
              @click="store.filter = 'live'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
              :class="store.filter === 'live' ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              <span class="status-dot live"></span> {{ store.section === 'articles' ? 'Publicados' : 'LIVE' }}
            </button>
            <button
              type="button"
              @click="store.filter = 'wip'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
              :class="store.filter === 'wip' ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              <span class="status-dot wip"></span> {{ store.section === 'articles' ? 'Borradores' : 'WIP' }}
            </button>
            <button
              type="button"
              @click="store.filter = 'featured'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer"
              :class="store.filter === 'featured' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              Destacados
            </button>
            <button
              v-if="store.section === 'projects'"
              type="button"
              @click="store.filter = 'hidden'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
              :class="store.filter === 'hidden' ? 'bg-white/15 text-white font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              <span class="status-dot archived"></span> Ocultas
            </button>
          </template>
          <button
            v-if="translatable"
            type="button"
            @click="store.filter = 'untranslated'"
            :aria-pressed="store.filter === 'untranslated' ? 'true' : 'false'"
            class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
            :class="store.filter === 'untranslated' ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-white'"
          >
            <span class="inline-block w-[7px] h-[7px] rotate-45 border border-amber-400" aria-hidden="true"></span>
            Sin traducir ({{ untranslatedCount }})
          </button>
        </div>
      </div>

      <!-- Lista Scrolleable de Registros -->
      <div class="flex-1 overflow-y-auto divide-y divide-white/5">
        <div
          v-for="(r, idx) in filteredRows"
          :key="r.id || r.key"
          @click="onSelect(r)"
          class="p-3 cursor-pointer transition-colors relative"
          :class="isSelected(r) ? 'bg-[#181920] border-l-2 border-[#ff3e00]' : 'hover:bg-white/[0.03]'"
        >
          <div class="flex items-center justify-between text-xs font-semibold text-white">
            <span class="truncate pr-2">{{ model?.name ? model.name(r) : (r.title || r.name || r.role || r.key) }}</span>
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                v-if="missingOf(r).length"
                class="flex items-center gap-1 text-[9.5px] font-mono-code text-amber-300"
                :title="missingText(missingOf(r))"
                data-untranslated
              >
                <span class="inline-block w-[7px] h-[7px] rotate-45 border border-amber-400" aria-hidden="true"></span>
                <span aria-hidden="true">EN</span>
                <span class="sr-only">{{ missingText(missingOf(r)) }}</span>
              </span>
              <span v-if="r.featured" class="text-[9.5px] font-mono-code px-1 rounded bg-[#ff3e00]/15 text-[#ff3e00]">DEST</span>
              <span v-if="r.status" class="status-dot" :class="(r.status === 'LIVE' || r.status === 'PUBLISHED') ? 'live' : (r.status === 'WIP' || r.status === 'DRAFT') ? 'wip' : 'archived'"></span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 mt-0.5">
            <div class="text-[11px] text-zinc-400 truncate font-mono-code">
              {{ model?.meta ? model.meta(r) : (r.slug || '') }}
            </div>
            <div v-if="canReorder" class="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                @click.stop="store.moveProject(r, -1)"
                :disabled="idx === 0"
                :aria-label="'Subir ' + r.title + ' en el orden del sitio'"
                class="icon-btn"
              ><svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg></button>
              <button
                type="button"
                @click.stop="store.moveProject(r, 1)"
                :disabled="idx === filteredRows.length - 1"
                :aria-label="'Bajar ' + r.title + ' en el orden del sitio'"
                class="icon-btn"
              ><svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>
            </div>
          </div>
        </div>

        <div v-if="filteredRows.length === 0" class="p-8 text-center text-xs text-zinc-500 font-mono-code">
          Sin registros coincidentes.
        </div>
      </div>
    </div>
  `,
}
