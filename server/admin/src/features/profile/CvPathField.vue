<script setup lang="ts">
/**
 * El PDF del CV, uno por idioma: «PDF en español» es el enlace «CV» del sitio en español y «PDF en
 * inglés» el de ?lang=en. Los dos son obligatorios y van a /cv/<archivo>.pdf (CV_PATH, la misma regla
 * del servidor). El archivo no se sube acá: lo genera `pnpm cv:pdf` y se commitea.
 */
import type { DocBlock } from '@shared/docSchema'
import { CV_PATH } from '@shared/docSchema'
import { computed, ref } from 'vue'
import Field from '../../ui/Field.vue'
import Mono from '../../ui/Mono.vue'
import TextInput from '../../ui/TextInput.vue'
import { useEditorContext } from '../collections/context'
import { profile } from './dict'

const props = defineProps<{ block: DocBlock }>()

const es = defineModel<string>('es', { default: '' })
const en = defineModel<string>('en', { default: '' })

const t = profile.cv
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const base = computed(() => `fields.${props.block.name}`)

const sides = computed(() => [
  { id: 'value', label: t.es, lang: t.inSpanish, model: es, placeholder: t.placeholderEs },
  { id: 'en', label: t.en, lang: t.inEnglish, model: en, placeholder: t.placeholderEn },
] as const)

/** Un lado se revisa en el lugar recién al salir de él: mientras se escribe la ruta no se marca a medias. */
const touched = ref<Record<'value' | 'en', boolean>>({ value: false, en: false })

/** El aviso en el lugar; el del servidor (o el de Guardar) manda si hay uno. */
function errorOf(id: 'value' | 'en', text: string, lang: string, example: string): string | null {
  const server = editor?.messageFor(`${base.value}.${id}`) ?? null
  if (server) return server
  const clean = text.trim()
  return clean && touched.value[id] && !CV_PATH.test(clean) ? t.invalid(lang, example) : null
}
</script>

<template>
  <div class="grid gap-4">
    <p class="m-0 max-w-[68ch] text-label text-faint">
      {{ block.help }}
    </p>
    <div class="grid items-start gap-x-10 gap-y-7 xl:grid-cols-2">
      <Field
        v-for="side in sides"
        :key="side.id"
        :data-field="`${base}.${side.id}`"
        :label="side.label"
        :error="errorOf(side.id, side.model.value, side.lang, side.placeholder)"
        required
      >
        <TextInput
          v-model="side.model.value"
          mono
          :placeholder="side.placeholder"
          :readonly="locked"
          autocomplete="off"
          @blur="touched[side.id] = true"
        />
      </Field>
    </div>
    <p class="m-0 text-label text-faint">
      {{ t.regenerate }} <Mono size="label" as="code" class="text-dim">{{ t.command }}</Mono> {{ t.regenerateAfter }}
    </p>
  </div>
</template>
