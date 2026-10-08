// Componente Modal: CommandPalette (AdmCommandPalette)
// Buscador global rápido con atajo Ctrl+K / Cmd+K y navegación por teclado

import { store } from '../../store.js'
import { MODELS } from '../../config.js'

const { computed, ref, onMounted, nextTick } = window.Vue

export const CommandPalette = {
  name: 'AdmCommandPalette',
  emits: ['close', 'action'],
  setup(props, { emit }) {
    const query = ref('')
    const selectedIndex = ref(0)
    const inputRef = ref(null)

    const commands = computed(() => {
      const q = query.value.trim().toLowerCase()
      const list = [
        {
          id: 'new-record',
          label: '+ Crear Nuevo Registro',
          category: 'Acciones Rápidas',
          badge: MODELS[store.section]?.singular || 'Nuevo',
          action: () => {
            store.createRecord()
            emit('close')
          },
        },
        {
          id: 'go-projects',
          label: 'Proyectos & Casos de Estudio',
          category: 'Secciones',
          badge: `${store.counts.projects}`,
          action: () => {
            store.loadSection('projects')
            emit('close')
          },
        },
        {
          id: 'go-experience',
          label: 'Experiencia Laboral',
          category: 'Secciones',
          badge: `${store.counts.experience}`,
          action: () => {
            store.loadSection('experience')
            emit('close')
          },
        },
        {
          id: 'go-stack',
          label: 'Habilidades & Stack Técnico',
          category: 'Secciones',
          badge: `${store.counts.stack}`,
          action: () => {
            store.loadSection('stack')
            emit('close')
          },
        },
        {
          id: 'go-orgs',
          label: 'Empresas & Clientes',
          category: 'Secciones',
          badge: `${store.counts.orgs}`,
          action: () => {
            store.loadSection('orgs')
            emit('close')
          },
        },
        {
          id: 'go-docs',
          label: 'Páginas & Textos (Docs)',
          category: 'Secciones',
          badge: `${store.counts.docs}`,
          action: () => {
            store.loadSection('docs')
            emit('close')
          },
        },
        {
          id: 'go-hunter',
          label: 'Job Hunter IA (Eros)',
          category: 'Herramientas & IA',
          badge: `${store.counts.hunter}`,
          action: () => {
            store.loadSection('hunter')
            emit('close')
          },
        },
        {
          id: 'open-portfolio',
          label: 'Ver Portafolio Público',
          category: 'Navegación',
          badge: 'Sitio Web',
          action: () => {
            window.open('/', '_blank')
            emit('close')
          },
        },
      ]

      if (!q) return list
      return list.filter(c => 
        c.label.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q) ||
        c.badge.toLowerCase().includes(q)
      )
    })

    function onKeyDown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (commands.value.length > 0) {
          selectedIndex.value = (selectedIndex.value + 1) % commands.value.length
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (commands.value.length > 0) {
          selectedIndex.value = (selectedIndex.value - 1 + commands.value.length) % commands.value.length
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = commands.value[selectedIndex.value]
        if (selected && selected.action) {
          selected.action()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        emit('close')
      }
    }

    onMounted(() => {
      nextTick(() => {
        if (inputRef.value) inputRef.value.focus()
      })
    })

    return {
      query,
      selectedIndex,
      commands,
      inputRef,
      onKeyDown,
    }
  },
  template: `
    <div
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 z-50 p-4"
      @click.self="$emit('close')"
      @keydown="onKeyDown"
    >
      <div class="bg-[#121318] border border-white/15 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[480px]">
        <!-- Buscador Input -->
        <div class="p-3.5 border-b border-white/10 flex items-center gap-3 bg-[#0d0e12]">
          <svg class="adm-icon text-zinc-500" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            ref="inputRef"
            type="text"
            v-model="query"
            placeholder="Escribí una orden o buscá una sección..."
            class="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600 font-sans"
          />
          <kbd class="text-[10px] font-mono-code bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-zinc-400">ESC</kbd>
        </div>

        <!-- Lista de Comandos -->
        <div class="overflow-y-auto p-2 space-y-1 flex-1">
          <div
            v-for="(cmd, idx) in commands"
            :key="cmd.id"
            @click="cmd.action()"
            @mouseenter="selectedIndex = idx"
            class="px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors text-xs"
            :class="selectedIndex === idx ? 'bg-[#ff3e00]/15 text-white' : 'text-zinc-300 hover:bg-white/5'"
          >
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ cmd.label }}</span>
              <span class="text-[10.5px] text-zinc-500">· {{ cmd.category }}</span>
            </div>
            <span class="font-mono-code text-[10.5px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">
              {{ cmd.badge }}
            </span>
          </div>

          <div v-if="commands.length === 0" class="p-6 text-center text-xs text-zinc-500 font-mono-code">
            Sin resultados para "{{ query }}"
          </div>
        </div>

        <!-- Footer Ayuda Atajos -->
        <div class="px-4 py-2.5 bg-[#0d0e12] border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500 font-mono-code">
          <div class="flex items-center gap-3">
            <span><kbd class="bg-black/30 border border-white/10 px-1 rounded text-zinc-400">↑↓</kbd> navegar</span>
            <span><kbd class="bg-black/30 border border-white/10 px-1 rounded text-zinc-400">↵</kbd> ejecutar</span>
          </div>
          <span>Paleta de Operaciones CMS</span>
        </div>
      </div>
    </div>
  `,
}
