<script setup lang="ts">
/**
 * El retrato de Sobre mí: la foto actual, «Cambiar retrato» (POST /docs/about/portrait, apenas se
 * elige, sin esperar a Guardar) y su descripción en los dos idiomas (el bloque del alt). La imagen no
 * tiene inglés: es la misma en el sitio en español y en ?lang=en. También se puede soltar una imagen
 * sobre la foto. Si el archivo guardado ya no está en el disco, lo dice y pide subirlo de nuevo.
 */
import type { AdminDoc } from '@shared/adminContracts'
import type { DocBlock } from '@shared/docSchema'
import { computed, ref, watch } from 'vue'
import { api } from '../../api/client'
import { messageOf } from '../../api/errors'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import StatusDot from '../../ui/StatusDot.vue'
import BilingualField from '../collections/BilingualField.vue'
import { useEditorContext } from '../collections/context'
import { profile } from './dict'
import type { BlockForm } from './model'

const props = defineProps<{
  block: DocBlock
  /** El bloque de la descripción (portrait_alt), si el esquema lo tiene. */
  altBlock: DocBlock | null
  /** La ruta guardada del retrato, o '' si todavía no hay. */
  src: string
  /** La base todavía no tiene la descripción. */
  altMissing?: boolean
}>()

const emit = defineEmits<{ uploaded: [doc: AdminDoc] }>()
const alt = defineModel<BlockForm>('alt', { default: () => ({ value: '', en: '' }) })

const t = profile.portrait
const TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024

const editor = useEditorContext()
const input = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const broken = ref(false)
const over = ref(false)
const problem = ref<string | null>(null)

watch(() => props.src, () => (broken.value = false))

const altPath = computed(() => (props.altBlock ? `fields.${props.altBlock.name}` : ''))
const altEs = computed({ get: () => alt.value.value, set: (value: string) => (alt.value = { ...alt.value, value }) })
const altEn = computed({ get: () => alt.value.en, set: (value: string) => (alt.value = { ...alt.value, en: value }) })
const locked = computed(() => uploading.value || (editor?.busy.value ?? false))

async function send(file: File): Promise<void> {
  problem.value = null
  if (!TYPES.includes(file.type)) problem.value = t.wrongType
  else if (file.size > MAX_BYTES) problem.value = t.tooBig
  if (problem.value) return
  const body = new FormData()
  body.append('file', file)
  uploading.value = true
  try {
    emit('uploaded', await api.post<AdminDoc>('/docs/about/portrait', body))
    toast(t.done)
  }
  catch (err) {
    problem.value = messageOf(err)
    toast(`${t.failed}. ${problem.value}`, { tone: 'error' })
  }
  finally {
    uploading.value = false
    if (input.value) input.value.value = ''
  }
}

function onPick(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) void send(file)
}

function onDrop(event: DragEvent): void {
  over.value = false
  const file = event.dataTransfer?.files[0]
  if (file && !locked.value) void send(file)
}
</script>

<template>
  <div class="grid gap-8.5">
    <div class="grid gap-3">
      <span class="text-label text-dim">{{ block.label }}</span>
      <div class="flex flex-wrap items-end gap-x-7 gap-y-5">
        <div
          class="relative grid aspect-4/5 w-36 shrink-0 place-items-center overflow-hidden rounded-media bg-surface transition-colors duration-120 ease-e md:w-44"
          :class="over ? 'bg-surface-2 outline-2 outline-offset-4 outline-ink' : ''"
          @dragover.prevent="over = !locked"
          @dragleave="over = false"
          @drop.prevent="onDrop"
        >
          <img
            v-if="src && !broken"
            :src="src"
            :alt="alt.value.trim() || t.preview"
            class="size-full object-cover transition-opacity duration-200 ease-e"
            :class="uploading ? 'opacity-40' : ''"
            @error="broken = true"
          >
          <span v-else class="px-4 text-center text-label text-faint">{{ broken ? t.broken : t.none }}</span>
          <span v-if="over" class="absolute inset-x-3 bottom-3 text-center text-label text-ink">{{ t.drop }}</span>
        </div>
        <div class="grid max-w-[40ch] gap-3">
          <Button
            data-field="fields.portrait"
            class="justify-self-start"
            icon="upload"
            :loading="uploading"
            :loading-label="t.uploading"
            :disabled="editor?.busy.value ?? false"
            @click="input?.click()"
          >
            {{ src ? t.change : t.first }}
          </Button>
          <p class="m-0 text-label text-faint">
            {{ block.help }} {{ t.hint }}
          </p>
          <p v-if="problem" role="alert" class="m-0 text-label text-danger">
            {{ problem }}
          </p>
        </div>
      </div>
      <input
        ref="input"
        type="file"
        class="hidden"
        tabindex="-1"
        aria-hidden="true"
        accept="image/png,image/jpeg,image/webp"
        @change="onPick"
      >
    </div>
    <p v-if="altBlock && altMissing && !alt.value.trim() && !alt.en.trim()" class="-mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <StatusDot tone="wip" :label="profile.missing" strong />
      <span class="text-label text-faint">{{ profile.missingHint }}</span>
    </p>
    <BilingualField
      v-if="altBlock"
      v-model:es="altEs"
      v-model:en="altEn"
      :data-field="altPath"
      :label="altBlock.label"
      :hint="altBlock.help"
      :path="`${altPath}.value`"
      :en-path="`${altPath}.en`"
    />
  </div>
</template>
