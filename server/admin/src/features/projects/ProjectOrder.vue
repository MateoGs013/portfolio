<script setup lang="ts">
/**
 * #/obras?vista=orden: el orden en que el sitio muestra las obras (sortOrder), como pantalla. Se
 * ordena arrastrando el asa o con Subir y Bajar (el foco sigue a la fila movida) y se guarda con un
 * solo botón (o Ctrl/⌘S): solo se manda PATCH /projects/:id de las filas cuyo orden cambió, con los
 * mismos números que ya había (repartidos de nuevo), así mover una fila toca a las que se corrieron.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../../api/client'
import { messageOf } from '../../api/errors'
import { useCollection, rememberRecord } from '../../composables/useCollection'
import { useLeaveGuard } from '../../composables/useLeaveGuards'
import { onShortcut } from '../../composables/useShortcuts'
import { enumLabel } from '../../models/labels'
import { toast } from '../../stores/toasts'
import { announce } from '../../ui/announce'
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'
import ErrorState from '../../ui/ErrorState.vue'
import Icon from '../../ui/Icon.vue'
import IconButton from '../../ui/IconButton.vue'
import Skeleton from '../../ui/Skeleton.vue'
import StatusDot from '../../ui/StatusDot.vue'
import { projectsText } from './dict'
import { projectModel } from './model'
import { publicationOf, publicationStatus } from './publication'
import { moveItem, useDragSort } from './reorder'
import type { AdminProject } from './types'

const t = projectsText.orderView
const { items, error, loading, reload } = useCollection<AdminProject>(projectModel)

/** El orden del sitio con la regla de la API pública: sortOrder y, a igual orden, el año más nuevo. */
const saved = computed(() => [...(items.value ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || b.year - a.year))
const savedIds = computed(() => saved.value.map(p => p.id))
const byId = computed(() => new Map(saved.value.map(p => [p.id, p])))

const order = ref<number[]>([])
const saving = ref(false)
const dirty = computed(() => order.value.join() !== savedIds.value.join())

// Lo guardado cambió (otra pestaña, un guardado): sin cambios propios se toma tal cual; con cambios,
// se conservan y se suman las obras nuevas al final.
watch(savedIds, (next, previous) => {
  if (saving.value) return
  if (!order.value.length || order.value.join() === (previous ?? []).join()) {
    order.value = [...next]
    return
  }
  const known = new Set(next)
  const kept = order.value.filter(id => known.has(id))
  order.value = [...kept, ...next.filter(id => !kept.includes(id))]
}, { immediate: true })

const rows = computed(() => order.value.map(id => byId.value.get(id)).filter((p): p is AdminProject => !!p))

async function focusRow(id: number, which: 'up' | 'down'): Promise<void> {
  await nextTick()
  const row = document.querySelector<HTMLElement>(`[data-order-key="${id}"]`)
  const button = row?.querySelector<HTMLButtonElement>(`[data-move="${which}"]`)
  if (button && !button.disabled) button.focus()
  else row?.querySelector<HTMLButtonElement>('[data-move]:not(:disabled)')?.focus()
}

function move(from: number, to: number, focus?: 'up' | 'down'): void {
  const id = order.value[from]
  if (id === undefined || saving.value || to < 0 || to >= order.value.length) return
  moveItem(order.value, from, to)
  announce(t.moved(byId.value.get(id)?.title ?? '', to + 1, order.value.length))
  if (focus) void focusRow(id, focus)
}

const drag = useDragSort((from, to) => move(from, to), () => !saving.value)

/** Los mismos números de orden repartidos en el orden nuevo; si había repetidos, 1..n. */
function changes(): { id: number, sortOrder: number }[] {
  const values = saved.value.map(p => p.sortOrder)
  const unique = new Set(values).size === values.length
  return order.value
    .map((id, i) => ({ id, sortOrder: unique ? values[i]! : i + 1 }))
    .filter(change => byId.value.get(change.id)?.sortOrder !== change.sortOrder)
}

async function save(): Promise<void> {
  if (saving.value) return
  const pending = changes()
  if (!dirty.value || !pending.length) {
    announce(t.unchanged)
    return
  }
  saving.value = true
  let done = 0
  try {
    for (const change of pending) {
      const updated = await api.patch<AdminProject>(`${projectModel.path}/${change.id}`, { sortOrder: change.sortOrder })
      rememberRecord(projectModel.path, updated)
      done++
    }
    toast(t.saved)
  }
  catch (err) {
    const partial = done ? ` ${t.partial(done)}` : ''
    toast(`${t.failed}. ${messageOf(err)}${partial}`, { tone: 'error' })
    order.value = []
  }
  finally {
    saving.value = false
    await reload()
    if (!order.value.length || !dirty.value) order.value = [...savedIds.value]
  }
}

function discard(): void {
  if (saving.value) return
  order.value = [...savedIds.value]
}

onShortcut('save', () => void save())
useLeaveGuard({
  dirty: () => dirty.value && !saving.value,
  keeps: to => to.name === 'obras' && to.query['vista'] === 'orden',
})

const meta = (p: AdminProject) => [enumLabel('ProjectStatus', p.status), String(p.year)].join(' · ')
const pad = 'px-4 md:px-10 xl:px-16'
</script>

<template>
  <section class="flex min-h-full flex-col">
    <div :class="pad" class="flex-1 pt-8 pb-16 md:pt-9">
      <RouterLink
        :to="{ name: 'obras' }"
        class="inline-flex items-center gap-2 rounded-control text-row font-[420] text-faint no-underline transition-colors duration-120 ease-e hover:text-ink"
      >
        <Icon name="arrow-left" :size="14" />
        {{ t.back }}
      </RouterLink>
      <h1 class="mt-3.5 mb-0 animate-rise text-display text-balance">
        {{ t.title }}
      </h1>
      <p class="mt-3.5 mb-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:1]">
        {{ t.lead }}
      </p>

      <div class="mt-9 max-w-[1080px]">
        <ErrorState v-if="error && !items" :message="error.message" :retrying="loading" @retry="reload()" />
        <Skeleton v-else-if="!items" variant="rows" :count="6" />
        <ol v-else class="group/rows m-0 list-none border-t border-rule p-0" :aria-label="t.list" :aria-busy="saving">
          <li
            v-for="(project, index) in rows"
            :key="project.id"
            :data-order-key="project.id"
            :style="{ '--i': Math.min(index, 12) }"
            class="group/row grid animate-rise grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-rule py-4.5 stagger transition-[opacity,background-color] duration-500 ease-e group-hover/rows:not-hover:opacity-28 group-hover/rows:focus-within:opacity-100"
            :class="[
              drag.over.value === index && drag.dragging.value !== index ? 'bg-surface' : '',
              drag.dragging.value === index ? 'opacity-45' : '',
            ]"
            v-bind="drag.row(index)"
          >
            <span
              v-bind="drag.handle(index)"
              class="grid size-8 cursor-grab place-items-center rounded-control text-faint transition-colors duration-120 ease-e hover:bg-surface hover:text-ink active:cursor-grabbing"
              :title="t.drag(project.title)"
              aria-hidden="true"
            >
              <Icon name="drag" :size="18" />
            </span>
            <span class="grid min-w-0 gap-1.5">
              <span class="w-fit max-w-full text-list text-ink transition-transform duration-700 ease-e group-hover/row:translate-x-3.5">
                {{ project.title }}
              </span>
              <span class="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-body text-dim">
                <StatusDot v-bind="publicationStatus(project.publishedAt)" />
                <span>{{ meta(project) }}</span>
                <span v-if="publicationOf(project.publishedAt) === 'hidden'" class="text-faint">{{ t.hidden }}</span>
              </span>
            </span>
            <span class="flex items-center gap-1">
              <IconButton icon="arrow-up" :label="t.up(project.title)" data-move="up" :disabled="saving || index === 0" @click="move(index, index - 1, 'up')" />
              <IconButton icon="arrow-down" :label="t.down(project.title)" data-move="down" :disabled="saving || index === rows.length - 1" @click="move(index, index + 1, 'down')" />
            </span>
          </li>
        </ol>
      </div>
    </div>

    <footer
      v-if="items"
      :class="pad"
      class="sticky bottom-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule bg-bg py-3.5"
    >
      <StatusDot :tone="dirty ? 'wip' : 'neutral'" :label="dirty ? t.dirty : t.clean" />
      <div class="ml-auto flex items-center gap-2">
        <Button variant="ghost" :disabled="!dirty || saving" @click="discard">
          {{ ui.actions.discard }}
        </Button>
        <Button variant="primary" size="lg" shortcut="mod+s" :loading="saving" :loading-label="t.saving" :disabled="!dirty" @click="save">
          {{ t.save }}
        </Button>
      </div>
    </footer>
  </section>
</template>
