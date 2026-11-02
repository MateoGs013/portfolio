<script setup lang="ts">
/**
 * Dónde más aparece la obra, en solo lectura: las entradas de la trayectoria y los artículos que la
 * eligieron (se ligan desde ellos, no desde acá). Cada una lleva a su editor.
 */
import { onMounted, ref, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'
import { api, useRequestScope } from '../../api/client'
import { isAbort } from '../../api/errors'
import { enumLabel } from '../../models/labels'
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'
import Icon from '../../ui/Icon.vue'
import { projectsText } from './dict'

const props = defineProps<{ projectId: number }>()

interface ExperienceRow { id: number, role: string, org: { name: string } | null, projects: { id: number }[] }
interface ArticleRow { id: number, title: string, status: string, project: { id: number } | null }
interface Linked { id: string, title: string, meta: string, to: string }

const t = projectsText.relations
const scope = useRequestScope()
const experience = shallowRef<Linked[]>([])
const articles = shallowRef<Linked[]>([])
const state = ref<'loading' | 'ready' | 'error'>('loading')

async function load(): Promise<void> {
  const signal = scope.renew()
  state.value = 'loading'
  try {
    const [entries, posts] = await Promise.all([
      api.get<ExperienceRow[]>('/experience', { signal }),
      api.get<ArticleRow[]>('/articles', { signal }),
    ])
    experience.value = entries
      .filter(e => e.projects.some(p => p.id === props.projectId))
      .map(e => ({ id: `e${e.id}`, title: e.role, meta: e.org?.name ?? '', to: `/trayectoria/${e.id}` }))
    articles.value = posts
      .filter(a => a.project?.id === props.projectId)
      .map(a => ({ id: `a${a.id}`, title: a.title, meta: enumLabel('ArticleStatus', a.status), to: `/articulos/${a.id}` }))
    state.value = 'ready'
  }
  catch (err) {
    if (!isAbort(err)) state.value = 'error'
  }
}

onMounted(load)

const groups = () => [
  { id: 'experience', label: t.experience, items: experience.value },
  { id: 'articles', label: t.articles, items: articles.value },
]
</script>

<template>
  <section class="grid gap-6" aria-labelledby="relaciones-titulo" :aria-busy="state === 'loading'">
    <div class="grid gap-1.5">
      <h2 id="relaciones-titulo" class="m-0 text-title">
        {{ t.title }}
      </h2>
      <p class="m-0 text-body text-dim">
        {{ state === 'loading' ? t.loading : t.text }}
      </p>
    </div>
    <div v-if="state === 'error'" class="flex flex-wrap items-center gap-4">
      <p class="m-0 text-body text-danger">
        {{ t.failed }}
      </p>
      <Button @click="load">
        {{ ui.actions.retry }}
      </Button>
    </div>
    <div v-else-if="state === 'ready'" class="grid gap-8 sm:grid-cols-2">
      <div v-for="group in groups()" :key="group.id" class="grid content-start gap-2">
        <h3 class="m-0 text-label font-[420] text-dim">
          {{ group.label }}
        </h3>
        <ul v-if="group.items.length" class="m-0 grid list-none border-t border-rule p-0">
          <li v-for="item in group.items" :key="item.id" class="border-b border-rule">
            <RouterLink
              :to="item.to"
              class="group flex items-baseline gap-3 rounded-control py-3 text-body text-ink no-underline transition-colors duration-120 ease-e hover:text-ink"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate">{{ item.title }}</span>
                <span v-if="item.meta" class="block text-label text-faint">{{ item.meta }}</span>
              </span>
              <Icon name="arrow-right" :size="14" class="text-faint transition-transform duration-200 ease-e group-hover:translate-x-1" />
            </RouterLink>
          </li>
        </ul>
        <p v-else class="m-0 border-t border-rule pt-3 text-body text-faint">
          {{ t.none }}
        </p>
      </div>
    </div>
  </section>
</template>
