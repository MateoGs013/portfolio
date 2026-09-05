<script setup lang="ts">
// "Ir a": un índice de todo lo que hay, filtrado mientras se escribe.
// No es una consola: es una línea sobre el papel y filas de resultados.
import type { RouteLocationRaw } from 'vue-router'
import { routeFor } from '~/lib/path'

const emit = defineEmits<{ close: [] }>()
const api = useApi()

interface Entry { label: string, where: string, to: RouteLocationRaw }

const { data: entries } = await useAsyncData<Entry[]>('datos-goto', async () => {
  const [schema, projects, experience, stack] = await Promise.all([
    api.schema(), api.list('projects'), api.list('experience'), api.list('stack'),
  ])
  return [
    ...schema.data.map(e => ({ label: e.key, where: 'db', to: routeFor('datos', [e.key]) })),
    ...projects.data.map(p => ({ label: p.title, where: 'projects', to: routeFor('datos', ['projects', p.slug]) })),
    ...experience.data.map(e => ({ label: e.org ? `${e.role} · ${e.org.name}` : e.role, where: 'experience', to: routeFor('datos', ['experience', e.slug]) })),
    ...stack.data.map(t => ({ label: t.name, where: 'stack', to: routeFor('datos', ['stack', t.slug]) })),
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
  <div class="velo" @click.self="emit('close')">
    <div class="goto" role="dialog" aria-label="Ir a" @keydown="onKey">
      <label class="linea">
        <span class="k">ir a</span>
        <input
          ref="input"
          v-model="q"
          type="text"
          autocomplete="off"
          spellcheck="false"
          placeholder="proyecto, tecnología, etapa…"
          aria-label="Buscar en todo"
          :aria-activedescendant="results[sel] ? `goto-${sel}` : undefined"
          aria-controls="goto-lista"
        >
      </label>
      <ol id="goto-lista" class="lista" role="listbox">
        <li
          v-for="(r, i) in results"
          :id="`goto-${i}`"
          :key="`${r.where}/${r.label}`"
          role="option"
          :aria-selected="i === sel"
          class="fila"
          :class="{ on: i === sel }"
          @mouseenter="sel = i"
          @click="go(r)"
        >
          <span class="where">{{ r.where }} /</span>
          <span class="label">{{ r.label }}</span>
        </li>
        <li v-if="entries && !results.length" class="fila vacia">00 resultados</li>
        <li v-if="!entries" class="fila vacia">cargando el índice…</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.velo {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(16, 18, 20, 0.14);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: clamp(48px, 12vh, 140px);
}
.goto {
  width: min(560px, calc(100vw - 32px));
  background: var(--d-paper);
  border: 1px solid var(--d-ink);
  box-shadow: 0 24px 60px -30px rgba(16, 18, 20, 0.5);
}
.linea {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: baseline;
  padding: 14px 16px;
  border-bottom: 1px solid var(--d-ink);
}
.k { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); }
input {
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--d-ink);
  font-family: var(--font-text);
  font-size: 18px;
  font-weight: 500;
  outline: none;
}
input::placeholder { color: var(--d-faint); }
.lista { list-style: none; margin: 0; padding: 0; max-height: 60vh; overflow: auto; }
.fila {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: baseline;
  height: var(--d-row);
  padding: 0 16px;
  border-bottom: 1px solid var(--d-rule);
  cursor: pointer;
}
.fila:last-child { border-bottom: 0; }
.fila.on { background: var(--d-ink); color: var(--d-paper); }
.where { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); text-align: right; }
.fila.on .where { color: var(--d-inv-dim); }
.label { font-family: var(--font-text); font-size: var(--d-fs-name); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vacia { grid-template-columns: 1fr; color: var(--d-faint); font-family: var(--font-mono); font-size: var(--d-fs-mono); cursor: default; }
</style>
