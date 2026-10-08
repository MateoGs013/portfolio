// Componente Estructural: AdmExplorer
// Columna exploradora de 320px con buscador reactivo, filtros por estado y botón + Nuevo

import { store } from '../store.js'
import { MODELS } from '../config.js'

const { computed } = window.Vue

export const AdmExplorer = {
  name: 'AdmExplorer',
  setup() {
    const model = computed(() => MODELS[store.section])

    const filteredRows = computed(() => {
      const q = store.searchQuery.trim().toLowerCase()
      let list = store.rows || []

      // Filtro por píldoras
      if (store.filter === 'live') {
        list = list.filter(r => r.status === 'LIVE')
      } else if (store.filter === 'wip') {
        list = list.filter(r => r.status === 'WIP')
      } else if (store.filter === 'featured') {
        list = list.filter(r => !!r.featured)
      }

      if (!q) return list
      return list.filter(r => {
        const title = (r.title || r.name || r.role || r.key || '').toLowerCase()
        const slug = (r.slug || '').toLowerCase()
        const meta = model.value?.meta ? model.value.meta(r).toLowerCase() : ''
        return title.includes(q) || slug.includes(q) || meta.includes(q)
      })
    })

    function isSelected(r) {
      if (store.isNew || !store.current) return false
      const key = model.value?.idKey || 'id'
      return store.current[key] === r[key]
    }

    async function onSelect(r) {
      if (isSelected(r)) return
      if (store.isDirty) {
        const proceed = await store.checkDirtyDiscard(() => store.selectRecord(r))
        if (!proceed) return
      } else {
        store.selectRecord(r)
      }
    }

    async function onCreate() {
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
      isSelected,
      onSelect,
      onCreate,
    }
  },
  template: `
    <div class="w-80 bg-[#101114] border-r border-white/10 flex flex-col shrink-0 overflow-hidden select-none">
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

        <!-- Filtros Rápidos en Píldoras Sobrias (Solo para modelos con estado/featured) -->
        <div v-if="store.section === 'projects'" class="flex items-center gap-1 text-[10.5px] font-mono-code">
          <button
            type="button"
            @click="store.filter = 'all'"
            class="px-2 py-0.5 rounded transition-colors cursor-pointer"
            :class="store.filter === 'all' ? 'bg-white/15 text-white font-semibold' : 'text-zinc-500 hover:text-white'"
          >
            Todos
          </button>
          <button
            type="button"
            @click="store.filter = 'live'"
            class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
            :class="store.filter === 'live' ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-zinc-500 hover:text-white'"
          >
            <span class="status-dot live"></span> LIVE
          </button>
          <button
            type="button"
            @click="store.filter = 'wip'"
            class="px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
            :class="store.filter === 'wip' ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-zinc-500 hover:text-white'"
          >
            <span class="status-dot wip"></span> WIP
          </button>
          <button
            type="button"
            @click="store.filter = 'featured'"
            class="px-2 py-0.5 rounded transition-colors cursor-pointer"
            :class="store.filter === 'featured' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-semibold' : 'text-zinc-500 hover:text-white'"
          >
            Destacados
          </button>
        </div>
      </div>

      <!-- Lista Scrolleable de Registros -->
      <div class="flex-1 overflow-y-auto divide-y divide-white/5">
        <div
          v-for="r in filteredRows"
          :key="r.id || r.key"
          @click="onSelect(r)"
          class="p-3 cursor-pointer transition-colors relative"
          :class="isSelected(r) ? 'bg-[#181920] border-l-2 border-[#ff3e00]' : 'hover:bg-white/[0.03]'"
        >
          <div class="flex items-center justify-between text-xs font-semibold text-white">
            <span class="truncate pr-2">{{ model?.name ? model.name(r) : (r.title || r.name || r.role || r.key) }}</span>
            <div class="flex items-center gap-1.5 shrink-0">
              <span v-if="r.featured" class="text-[9.5px] font-mono-code px-1 rounded bg-[#ff3e00]/15 text-[#ff3e00]">DEST</span>
              <span v-if="r.status" class="status-dot" :class="r.status === 'LIVE' ? 'live' : r.status === 'WIP' ? 'wip' : 'archived'"></span>
            </div>
          </div>

          <div class="text-[11px] text-zinc-400 mt-0.5 truncate font-mono-code">
            {{ model?.meta ? model.meta(r) : (r.slug || '') }}
          </div>
        </div>

        <div v-if="filteredRows.length === 0" class="p-8 text-center text-xs text-zinc-500 font-mono-code">
          Sin registros coincidentes.
        </div>
      </div>
    </div>
  `,
}
