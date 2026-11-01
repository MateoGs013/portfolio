<script setup lang="ts">
/**
 * La publicación de un registro (obras y artículos), en el encabezado del editor: punto y palabra
 * («Oculta», «Publicada», «Programada») y «Faltan 2» o «Lista para publicar». Abre un panel con
 * «Mostrar en el sitio», la fecha opcional desde la que se ve y la checklist que da el modelo.
 * Prender la publicación con faltantes pide confirmación. Cambia el formulario: se guarda con el resto.
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useId } from '../../composables/useId'
import type { ChecklistItem, RecordStatus } from '../../models/types'
import { requestConfirm } from '../../stores/dialogs'
import Field from '../../ui/Field.vue'
import Icon from '../../ui/Icon.vue'
import StatusDot from '../../ui/StatusDot.vue'
import Switch from '../../ui/Switch.vue'
import TextInput from '../../ui/TextInput.vue'
import Checklist from './Checklist.vue'
import { useEditorContext } from './context'
import { collections } from './dict'

const props = withDefaults(defineProps<{
  status: RecordStatus
  items: readonly ChecklistItem[]
  /** Ofrece «Publicar desde» con una fecha (YYYY-MM-DD). */
  schedule?: boolean
  /** Ruta del campo de publicación para los errores y ?campo= (`publishedAt`). */
  path?: string
}>(), { schedule: true, path: 'publishedAt' })

const published = defineModel<boolean>('published', { default: false })
const at = defineModel<string>('at', { default: '' })

const t = collections.publish
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const missing = computed(() => props.items.filter(i => !i.done))
const summary = computed(() => (missing.value.length ? t.missing(missing.value.length) : t.ready))

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const panelId = useId('publish')

async function show(): Promise<void> {
  open.value = true
  document.addEventListener('pointerdown', onOutside, true)
  await nextTick()
  panel.value?.querySelector<HTMLElement>('[role="switch"]')?.focus()
}

function hide(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  document.removeEventListener('pointerdown', onOutside, true)
  if (returnFocus) trigger.value?.focus()
}

function onOutside(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) hide(false)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  hide(true)
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))

/** El switch: apagar es inmediato; prender con faltantes pregunta primero. */
const shown = computed({
  get: () => published.value,
  set: async (value: boolean) => {
    if (value && missing.value.length) {
      const yes = await requestConfirm({
        title: t.confirmTitle(missing.value.length),
        message: t.confirmText,
        impact: missing.value.map(i => i.label),
        confirmLabel: t.confirm,
        cancelLabel: t.cancel,
      })
      if (!yes) return
    }
    published.value = value
  },
})
</script>

<template>
  <div ref="root" class="relative" @keydown="onKeydown">
    <button
      ref="trigger"
      type="button"
      :aria-expanded="open"
      :aria-controls="panelId"
      class="inline-flex h-8 items-center gap-2 rounded-full border border-rule-strong bg-transparent px-3 text-label text-ink transition-colors duration-120 ease-e hover:bg-surface"
      @click="open ? hide(true) : show()"
    >
      <StatusDot :tone="status.tone" :label="status.label" strong />
      <span class="text-faint tabular-nums">· {{ summary }}</span>
      <Icon name="chevron-down" :size="14" class="text-faint transition-transform duration-200 ease-e" :class="open ? 'rotate-180' : ''" />
    </button>
    <section
      v-show="open"
      :id="panelId"
      ref="panel"
      :aria-label="t.panel"
      class="absolute top-full right-0 z-30 mt-2 grid w-[min(380px,calc(100vw-32px))] animate-enter gap-5 rounded-dialog border border-rule-strong bg-surface-2 p-5 shadow-dialog max-sm:right-auto max-sm:left-0"
    >
      <div :data-field="path" class="grid gap-5">
        <Switch v-model="shown" :label="t.show" :hint="t.showHint" :disabled="locked" />
        <Field v-if="schedule && published" :label="t.schedule" :hint="t.scheduleHint" :error="editor?.messageFor(path) ?? null">
          <TextInput v-model="at" type="date" :readonly="locked" />
        </Field>
      </div>
      <div v-if="items.length" class="grid gap-2.5">
        <h3 class="m-0 text-label font-[420] text-dim">
          {{ t.checklist }}
        </h3>
        <Checklist :items="items" @navigate="hide(false)" />
      </div>
    </section>
  </div>
</template>
