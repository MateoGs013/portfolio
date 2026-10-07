<script setup lang="ts">
// Paleta de comandos "Ir a": búsqueda difusa instantánea en todo el portafolio.
// Indexa tablas, proyectos, etapas de experiencia y tecnologías.
import type { RouteLocationRaw } from 'vue-router'
import { routeFor } from '~/lib/path'

const emit = defineEmits<{ close: [] }>()
const api = useApi()
const { isEs } = usePortfolioLocale()

function formatWhere(w: string) {
  if (isEs.value) {
    if (w === 'projects') return 'proyectos'
    if (w === 'experience') return 'experiencia'
    if (w === 'stack') return 'stack'
    if (w === 'db') return 'db'
  }
  return w
}

interface Entry { label: string, where: string, to: RouteLocationRaw }

const { data: entries } = await useAsyncData<Entry[]>('datos-goto', async () => {
  const [schema, projects, experience, stack] = await Promise.all([
    api.schema(), api.list('projects'), api.list('experience'), api.list('stack'),
  ])
  return [
    ...schema.data.map(e => ({ label: e.key, where: 'db', to: routeFor([e.key]) })),
    ...projects.data.map(p => ({ label: p.title, where: 'projects', to: routeFor(['projects', p.slug]) })),
    ...experience.data.map(e => ({ label: e.org ? `${e.role} · ${e.org.name}` : e.role, where: 'experience', to: routeFor(['experience', e.slug]) })),
    ...stack.data.map(t => ({ label: t.name, where: 'stack', to: routeFor(['stack', t.slug]) })),
  ]
}, { server: false })

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
  emit('close')
  navigateTo(entry.to)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.preventDefault(); emit('close') }
  else if (e.key === 'ArrowDown') { e.preventDefault(); sel.value = Math.min(sel.value + 1, results.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); sel.value = Math.max(sel.value - 1, 0) }
  else if (e.key === 'Enter') { e.preventDefault(); go(results.value[sel.value]) }
}

onMounted(() => input.value?.focus())
</script>

<template>
  <div
    class="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex justify-center items-start pt-[clamp(48px,12vh,140px)]"
    @click.self="emit('close')"
  >
    <div
      class="w-[min(580px,calc(100vw-32px))] bg-surface border border-rule-strong shadow-[0_24px_60px_rgba(0,0,0,0.6)] rounded-[2px] overflow-hidden"
      role="dialog"
      :aria-label="isEs ? 'Ir a' : 'Goto'"
      @keydown="onKey"
    >
      <label class="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3.5 border-b border-rule bg-surface-raised">
        <span class="font-mono text-[12px] text-sig font-bold">{{ isEs ? 'ir a' : 'goto' }}</span>
        <input
          ref="input"
          v-model="q"
          type="text"
          autocomplete="off"
          spellcheck="false"
          class="w-full border-0 p-0 bg-transparent text-ink font-sans text-base font-medium outline-none placeholder:text-faint placeholder:text-sm"
          :placeholder="isEs ? 'buscar proyecto, tecnología, etapa…' : 'search project, tech, stage…'"
          :aria-label="isEs ? 'Buscar en todo el portafolio' : 'Search whole portfolio'"
          :aria-activedescendant="results[sel] ? `goto-${sel}` : undefined"
          aria-controls="goto-lista"
        >
        <span class="font-mono text-[10px] text-dim border border-rule px-1.5 py-0.5">ESC</span>
      </label>
      <ol id="goto-lista" class="list-none m-0 p-0 max-h-[55vh] overflow-y-auto" role="listbox">
        <li
          v-for="(r, i) in results"
          :id="`goto-${i}`"
          :key="`${r.where}/${r.label}`"
          role="option"
          :aria-selected="i === sel"
          class="grid grid-cols-[100px_1fr_auto] gap-3 items-center h-[42px] px-4 border-b border-rule last:border-b-0 cursor-pointer transition-colors duration-150"
          :class="i === sel ? 'bg-sig text-white' : 'text-ink hover:bg-hover'"
          @mouseenter="sel = i"
          @click="go(r)"
        >
          <span class="font-mono text-[11px] text-right" :class="i === sel ? 'text-white/75' : 'text-dim'">{{ formatWhere(r.where) }} /</span>
          <span class="font-sans text-[14px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">{{ r.label }}</span>
          <span v-if="i === sel" class="font-mono text-[12px] text-white opacity-80">↵</span>
        </li>
        <li v-if="entries && !results.length" class="grid grid-cols-1 px-4 py-3 text-faint font-mono text-[12px] cursor-default">
          {{ isEs ? `00 resultados para "${q}"` : `00 results for "${q}"` }}
        </li>
        <li v-if="!entries" class="grid grid-cols-1 px-4 py-3 text-faint font-mono text-[12px] cursor-default">
          {{ isEs ? 'cargando índice de la base de datos…' : 'loading database index…' }}
        </li>
      </ol>
    </div>
  </div>
</template>
