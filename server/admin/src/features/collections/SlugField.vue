<script setup lang="ts">
/**
 * La dirección pública del registro. Mientras es nuevo sale sola del nombre (o se escribe a mano) y se
 * ve cómo queda en la URL. Guardado, queda fija: el nombre puede cambiar sin tocarla, y cambiarla es
 * una acción explícita («Cambiar dirección»), que avisa que los enlaces viejos dejan de andar.
 */
import { computed, ref, watch } from 'vue'
import { slugify } from '../../models/slug'
import Field from '../../ui/Field.vue'
import Mono from '../../ui/Mono.vue'
import TextInput from '../../ui/TextInput.vue'
import { useEditorContext } from './context'
import { collections } from './dict'
import SlugDialog from './SlugDialog.vue'

const props = withDefaults(defineProps<{
  /** El texto del que sale mientras es nueva (el título o el nombre). */
  source: string
  /** Cómo se lee en el sitio: `/projects?org=acme`. */
  preview: (slug: string) => string
  /** PATCH de la dirección del registro guardado (`/orgs/12/slug`); sin esto no se puede cambiar. */
  endpoint?: string | null
  path?: string
  isNew?: boolean
}>(), { endpoint: null, path: 'slug', isNew: undefined })

const slug = defineModel<string>({ default: '' })
const emit = defineEmits<{ changed: [record: unknown] }>()

const t = collections.slug
const editor = useEditorContext()
const fresh = computed(() => props.isNew ?? editor?.isNew.value ?? false)
const locked = computed(() => editor?.busy.value ?? false)

/** Automática hasta que alguien la escribe a mano. */
const auto = ref(!slug.value || slug.value === slugify(props.source))
watch(() => props.source, (text) => {
  if (fresh.value && auto.value) slug.value = slugify(text)
}, { immediate: true })

function manual(): void {
  auto.value = false
}

function automatic(): void {
  auto.value = true
  slug.value = slugify(props.source)
}

const shown = computed(() => props.preview(slug.value || slugify(props.source) || '…'))
const changing = ref(false)
</script>

<template>
  <div class="grid gap-2.5">
    <Field
      :data-field="path"
      :label="t.label"
      :hint="fresh ? t.auto : t.fixed"
      :error="editor?.messageFor(path) ?? null"
    >
      <template #aux>
        <button
          v-if="fresh"
          type="button"
          class="rounded-control border-0 bg-transparent p-0 text-meta text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink"
          :disabled="locked"
          @click="auto ? manual() : automatic()"
        >
          {{ auto ? t.edit : t.reset }}
        </button>
        <button
          v-else-if="endpoint"
          type="button"
          class="rounded-control border-0 bg-transparent p-0 text-meta text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink"
          :disabled="locked"
          @click="changing = true"
        >
          {{ t.change }}
        </button>
      </template>
      <TextInput v-model="slug" mono :readonly="!fresh || auto || locked" autocomplete="off" />
    </Field>
    <p class="m-0 flex flex-wrap items-baseline gap-x-2 text-label text-faint">
      {{ t.preview }}
      <Mono data-slug-preview>{{ shown }}</Mono>
    </p>
    <SlugDialog
      v-if="!fresh && endpoint"
      v-model:open="changing"
      :current="slug"
      :endpoint="endpoint"
      :preview="preview"
      @changed="emit('changed', $event)"
    />
  </div>
</template>
