<script setup lang="ts">
/**
 * «Dónde se usa», debajo de los campos de una empresa o una tecnología: las obras, las entradas de la
 * trayectoria y los artículos que la nombran (GET /:path/:id/impact), cada uno con el enlace a su
 * ficha. Es de solo lectura: la relación se elige desde cada registro. Lo comparten los dos catálogos.
 */
import type { AdminImpact, ImpactItem } from '@shared/adminContracts'
import { computed, onScopeDispose, shallowRef, watch } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { api, onWrite, useRequestScope } from '../../api/client'
import { isAbort, messageOf } from '../../api/errors'
import ErrorState from '../../ui/ErrorState.vue'
import Icon from '../../ui/Icon.vue'
import Skeleton from '../../ui/Skeleton.vue'
import { catalog } from './dict'

const props = defineProps<{
  /** `/orgs` o `/techs`. */
  path: string
  id: number
}>()

const t = catalog.usage
const scope = useRequestScope()
const impact = shallowRef<AdminImpact | null>(null)
const problem = shallowRef('')
const loading = shallowRef(false)

async function load(): Promise<void> {
  const signal = scope.renew()
  loading.value = true
  problem.value = ''
  try {
    impact.value = await api.get<AdminImpact>(`${props.path}/${props.id}/impact`, { signal })
  }
  catch (err) {
    if (!isAbort(err)) problem.value = messageOf(err)
  }
  finally {
    if (!signal.aborted) loading.value = false
  }
}

watch(() => [props.path, props.id], () => {
  impact.value = null
  void load()
}, { immediate: true })

// Lo que se guarda en otra pantalla (una obra que ahora la usa) se ve al volver; acá, al guardar.
onScopeDispose(onWrite(() => void load()))

type Group = { label: string, items: ImpactItem[], to: (id: number) => RouteLocationRaw }
const groups = computed<Group[]>(() => {
  const found = impact.value
  if (!found) return []
  const all: Group[] = [
    { label: t.projects, items: found.projects, to: id => ({ name: 'obra', params: { id: String(id) } }) },
    { label: t.experiences, items: found.experiences, to: id => ({ name: 'experiencia', params: { id: String(id) } }) },
    { label: t.articles, items: found.articles, to: id => ({ name: 'articulo', params: { id: String(id) } }) },
  ]
  return all.filter(g => g.items.length)
})
</script>

<template>
  <section class="grid gap-5 border-t border-rule pt-8" :aria-busy="loading" aria-labelledby="catalog-usage">
    <h2 id="catalog-usage" class="m-0 text-title">
      {{ t.title }}
    </h2>
    <ErrorState v-if="problem && !impact" :message="`${t.failed} ${problem}`" :retrying="loading" @retry="load()" />
    <Skeleton v-else-if="!impact" variant="text" :count="3" />
    <p v-else-if="!impact.total" class="m-0 max-w-[60ch] text-body text-dim">
      {{ t.none }}
    </p>
    <div v-else class="grid gap-7 sm:grid-cols-2">
      <div v-for="group in groups" :key="group.label" class="grid content-start gap-2">
        <h3 class="m-0 flex items-baseline gap-2 text-label font-[420] text-dim">
          {{ group.label }}
          <span class="text-meta text-faint tabular-nums">{{ group.items.length }}</span>
        </h3>
        <ul class="m-0 grid list-none border-t border-rule p-0">
          <li v-for="item in group.items" :key="item.id" class="border-b border-rule">
            <RouterLink
              :to="group.to(item.id)"
              class="group/use flex items-baseline justify-between gap-3 rounded-control py-2.5 text-row text-ink no-underline transition-colors duration-120 ease-e hover:text-dim"
            >
              <span class="min-w-0 wrap-break-word">{{ item.title }}</span>
              <span class="shrink-0 text-faint transition-transform duration-200 ease-e group-hover/use:translate-x-1">
                <Icon name="arrow-right" :size="14" />
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
