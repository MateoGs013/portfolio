<script setup lang="ts">
// Paleta de comandos "Ir a": búsqueda difusa instantánea en todo el portafolio.
// Indexa tablas, proyectos, etapas de experiencia y tecnologías.
import type { RouteLocationRaw } from 'vue-router'
import { routeFor } from '~/lib/path'
import {
  fallbackSchemaData,
  fallbackProjects,
  fallbackExperience,
  fallbackStack,
  fallbackArticles,
} from '~/lib/fallbackData'
import { useBenchoSound } from '~/composables/useBenchoSound'

const emit = defineEmits<{ close: [] }>()
const api = useApi()
const { isEs } = usePortfolioLocale()
const { playSound } = useBenchoSound()

function formatWhere(w: string) {
  if (isEs.value) {
    if (w === 'projects') return 'proyectos'
    if (w === 'experience') return 'experiencia'
    if (w === 'stack') return 'stack'
    if (w === 'articles') return 'artículos'
    if (w === 'lab') return 'lab ui'
    if (w === 'db') return 'db'
  }
  return w
}

interface Entry { label: string, where: string, to: RouteLocationRaw }

function getDefaultEntries(): Entry[] {
  return [
    { label: isEs.value ? 'laboratorio ui · 31 componentes interactivos' : 'ui lab · 31 interactive components', where: 'lab', to: routeFor(['lab']) },
    ...fallbackSchemaData.data.map(e => ({ label: e.key, where: 'db', to: routeFor([e.key]) })),
    ...fallbackProjects.map(p => ({ label: p.title, where: 'projects', to: routeFor(['projects', p.slug]) })),
    ...fallbackExperience.map(e => ({ label: e.org ? `${e.role} · ${e.org.name}` : e.role, where: 'experience', to: routeFor(['experience', e.slug]) })),
    ...fallbackStack.map(t => ({ label: t.name, where: 'stack', to: routeFor(['stack', t.slug]) })),
    ...fallbackArticles.map(a => ({ label: a.title, where: 'articles', to: routeFor(['articles', a.slug]) })),
  ]
}

const { data: entries } = await useAsyncData<Entry[]>('datos-goto', async () => {
  try {
    const [schema, projects, experience, stack, articles] = await Promise.all([
      api.schema(),
      api.list('projects'),
      api.list('experience'),
      api.list('stack'),
      api.list('articles').catch(() => ({ data: [] })),
    ])
    return [
      { label: isEs.value ? 'laboratorio ui · 31 componentes interactivos' : 'ui lab · 31 interactive components', where: 'lab', to: routeFor(['lab']) },
      ...schema.data.map(e => ({ label: e.key, where: 'db', to: routeFor([e.key]) })),
      ...projects.data.map(p => ({ label: p.title, where: 'projects', to: routeFor(['projects', p.slug]) })),
      ...experience.data.map(e => ({ label: e.org ? `${e.role} · ${e.org.name}` : e.role, where: 'experience', to: routeFor(['experience', e.slug]) })),
      ...stack.data.map(t => ({ label: t.name, where: 'stack', to: routeFor(['stack', t.slug]) })),
      ...articles.data.map(a => ({ label: a.title, where: 'articles', to: routeFor(['articles', a.slug]) })),
    ]
  }
  catch {
    return getDefaultEntries()
  }
}, { default: () => getDefaultEntries(), server: false })

const q = ref('')
const sel = ref(0)
const input = ref<HTMLInputElement | null>(null)

const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const results = computed(() => {
  const all = entries.value ?? []
  const needle = plain(q.value.trim())
  const hits = needle ? all.filter(e => plain(`${e.where} ${e.label}`).includes(needle)) : all
  return hits.slice(0, 10)
})
watch(results, () => { sel.value = 0 })

function go(entry?: Entry) {
  if (!entry) return
  playSound('tock', { gap: 30 })
  emit('close')
  navigateTo(entry.to)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (results.value.length > 0) {
      sel.value = Math.min(sel.value + 1, results.value.length - 1)
      playSound('tock', { gap: 40 })
    }
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (results.value.length > 0) {
      sel.value = Math.max(sel.value - 1, 0)
      playSound('tock', { gap: 40 })
    }
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    go(results.value[sel.value])
  }
}

onMounted(() => input.value?.focus())
</script>

<template>
  <Teleport to="body">
    <Transition name="goto-modal" appear>
      <div
        class="goto-backdrop fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex justify-center items-start pt-[clamp(48px,12vh,140px)] p-4"
        @click.self="emit('close')"
      >
        <div
          class="goto-dialog w-[min(580px,calc(100vw-32px))] bg-surface border border-rule-strong shadow-[0_32px_70px_rgba(0,0,0,0.65)] rounded-2xl overflow-hidden flex flex-col"
          role="dialog"
          :aria-label="isEs ? 'Ir a' : 'Goto'"
          @keydown="onKey"
        >
          <label class="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3.5 border-b border-rule bg-surface-raised">
            <span class="font-mono text-[12px] text-sig font-bold">{{ isEs ? 'ir a' : 'goto' }}</span>
            <input
              id="global-goto-input"
              ref="input"
              v-model="q"
              name="goto-search"
              type="text"
              autocomplete="off"
              spellcheck="false"
              class="w-full border-0 p-0 bg-transparent text-ink font-sans text-base font-medium outline-none placeholder:text-faint placeholder:text-sm"
              :placeholder="isEs ? 'buscar proyecto, artículo, tecnología, etapa…' : 'search project, article, tech, stage…'"
              :aria-label="isEs ? 'Buscar en todo el portafolio' : 'Search whole portfolio'"
              :aria-activedescendant="results[sel] ? `goto-${sel}` : undefined"
              aria-controls="goto-lista"
            >
            <span class="font-mono text-[10px] text-dim border border-rule px-1.5 py-0.5 rounded cursor-pointer hover:text-ink" @click="emit('close')">ESC</span>
          </label>

          <ol id="goto-lista" class="list-none m-0 p-0 max-h-[55vh] overflow-y-auto" role="listbox">
            <li
              v-for="(r, i) in results"
              :id="`goto-${i}`"
              :key="`${r.where}/${r.label}`"
              role="option"
              :aria-selected="i === sel"
              class="grid grid-cols-[100px_1fr_auto] gap-3 items-center h-[42px] px-4 border-b border-rule last:border-b-0 cursor-pointer transition-all duration-150"
              :class="i === sel ? 'bg-surface-raised border-l-[3px] border-l-sig pl-[13px] text-ink' : 'text-dim hover:text-ink hover:bg-hover border-l-[3px] border-l-transparent pl-[13px]'"
              @mouseenter="sel = i"
              @click="go(r)"
            >
              <span class="font-mono text-[11px] text-right" :class="i === sel ? 'text-sig font-semibold' : 'text-dim'">{{ formatWhere(r.where) }} /</span>
              <span class="font-sans text-[14px] font-medium overflow-hidden text-ellipsis whitespace-nowrap text-ink">{{ r.label }}</span>
              <span v-if="i === sel" class="font-mono text-[11px] text-faint px-1.5 py-0.5 rounded bg-surface border border-rule">↵</span>
            </li>
            <li v-if="entries && !results.length" class="grid grid-cols-1 px-4 py-6 text-center text-faint font-mono text-[12px] cursor-default">
              {{ isEs ? `00 resultados para "${q}"` : `00 results for "${q}"` }}
            </li>
          </ol>

          <!-- Barra de Navegación Táctil y Atajos al Pie -->
          <footer class="flex items-center justify-between px-4 py-2 border-t border-rule bg-surface-raised font-mono text-[10.5px] text-dim select-none">
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-1">
                <kbd class="px-1 py-0.5 rounded bg-paper border border-rule text-[9.5px]">↑</kbd>
                <kbd class="px-1 py-0.5 rounded bg-paper border border-rule text-[9.5px]">↓</kbd>
                <span class="text-faint">{{ isEs ? 'navegar' : 'navigate' }}</span>
              </span>
              <span class="text-faint">·</span>
              <span class="inline-flex items-center gap-1">
                <kbd class="px-1 py-0.5 rounded bg-paper border border-rule text-[9.5px]">↵</kbd>
                <span class="text-faint">{{ isEs ? 'seleccionar' : 'open' }}</span>
              </span>
            </div>
            <div class="text-faint">
              {{ results.length }} / {{ entries?.length ?? 0 }} {{ isEs ? 'registros' : 'items' }}
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.goto-modal-enter-active,
.goto-modal-leave-active {
  transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.goto-modal-enter-active .goto-dialog,
.goto-modal-leave-active .goto-dialog {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.goto-modal-enter-from,
.goto-modal-leave-to {
  opacity: 0;
}
.goto-modal-enter-from .goto-dialog,
.goto-modal-leave-to .goto-dialog {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}
</style>
