<script setup lang="ts">
/**
 * Lista de obra del inicio (movimiento.html, `.rows`): una fila por obra, sobre líneas de 1 px, con el
 * título monumental y a la derecha rol, cliente, estado y año. Cada fila es el origen de un viaje
 * (`data-travel="row"`): su título se vuelve el título del caso y la imagen abierta de la vista previa,
 * su portada. También es destino de j/k (`data-row`) y anticipa la temperatura de la obra
 * (`data-tint`). Sin `data-view`: como en el prototipo, el único gesto sobre las filas es la vista
 * previa (una cosa por pantalla); la burbuja «Ver caso» no se le encima.
 *
 * Atenuar (docs/diseno.md §2): con puntero fino, al apuntar una fila sus hermanas bajan a .25 y el
 * título apuntado se corre 1,2 rem; en Hiperfoco no se atenúa. En táctil la fila lleva la miniatura
 * de la portada, que es también lo que viaja como `cover`.
 *
 * Avisa a quien la contiene qué fila apunta el mouse (`point`) y cuándo sale (`leave`): la vista
 * previa vive afuera, en el body.
 */
import type { ProjectSummary } from '~/lib/api'

defineProps<{
  projects: readonly ProjectSummary[]
}>()

const emit = defineEmits<{
  point: [index: number, event: PointerEvent]
  leave: []
}>()

const { t, localeRoute, langAttr } = useLocale()
const prefs = useMotionPrefs()

/** En táctil (ya hidratado) la miniatura de la fila es la portada que viaja. */
const thumbTravels = computed(() => prefs.ready.value && !prefs.fine.value)

const coverOf = (p: ProjectSummary) => p.media.find(m => m.role === 'COVER' && m.kind === 'IMAGE') ?? null
const tintOf = (p: ProjectSummary) => p.media.find(m => m.role === 'COVER' && m.tint)?.tint ?? undefined

function onOver(index: number, e: PointerEvent) {
  if (e.pointerType === 'mouse') emit('point', index, e)
}

const row = 'group/row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-t border-rule py-[clamp(1.2rem,3vh,2rem)] text-ink transition-opacity duration-500 ease-expo md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-baseline md:gap-x-0'
const dim = 'fine:not-focus-mode:group-hover/rows:not-hover:opacity-25'
</script>

<template>
  <ul class="group/rows border-b border-rule" @pointerleave="emit('leave')">
    <li v-for="(p, i) in projects" :key="p.slug" :data-f="p.slug">
      <NuxtLink
        :to="localeRoute(`/projects/${p.slug}`)"
        data-travel="row"
        data-row
        :data-tint="tintOf(p)"
        :class="[row, dim]"
        @pointerover="onOver(i, $event)"
      >
        <span class="min-w-0 text-display-row focus-mode:text-xl">
          <span
            data-travel-title
            data-f="title"
            class="fv transition-transform duration-700 ease-expo fine:not-focus-mode:group-hover/row:translate-x-[1.2rem]"
          >{{ p.title }}</span>
        </span>
        <span class="col-start-1 mt-2 text-s text-dim md:col-start-2 md:row-start-1 md:mt-0 md:pl-8 md:text-right">
          <span class="block" :lang="langAttr(p, 'role')">{{ p.role }}</span>
          <span class="block">
            <template v-if="p.org">{{ p.org.name }} · </template>{{ t(`status.${p.status}`) }} · {{ p.year }}
          </span>
        </span>
        <span
          v-if="coverOf(p)"
          class="col-start-2 row-span-2 row-start-1 w-[clamp(5rem,22vw,8rem)] self-center overflow-hidden rounded-[3px] bg-surface fine:hidden md:col-start-3 md:row-span-1 md:ml-4"
        >
          <MediaImage
            :media="coverOf(p)!"
            decorative
            sizes="8rem"
            class="block aspect-[16/10] w-full object-cover"
            :data-travel-cover="thumbTravels ? '' : undefined"
          />
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
