<script setup lang="ts">
/**
 * Los enlaces extra del caso: el texto con su inglés y la dirección, que se completa con https:// al
 * salir del campo. Quitar uno se puede deshacer desde el aviso; nada cambia hasta Guardar. Viajan por
 * id, así conservan su inglés.
 */
import { computed, nextTick } from 'vue'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import Field from '../../../ui/Field.vue'
import IconButton from '../../../ui/IconButton.vue'
import TextInput from '../../../ui/TextInput.vue'
import BilingualField from '../../collections/BilingualField.vue'
import { useEditorContext } from '../../collections/context'
import { withHttps } from '../../orgs/dict'
import { useProject } from '../context'
import { keyer } from '../reorder'
import type { LinkForm } from '../types'
import { dataText } from './dict'
import { blankLink } from './links'

const t = dataText.links
const { form, record } = useProject()
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const keyOf = keyer<LinkForm>('enlace')

async function focusIn(link: LinkForm | undefined, selector: string): Promise<void> {
  await nextTick()
  if (!link) return document.querySelector<HTMLElement>('[data-link-add]')?.focus()
  document.querySelector<HTMLElement>(`[data-link-key="${keyOf(link)}"] ${selector}`)?.focus()
}

function add(): void {
  form.value.links.push(blankLink())
  void focusIn(form.value.links.at(-1), 'input')
}

function remove(index: number): void {
  const link = form.value.links[index]
  if (!link || locked.value) return
  form.value.links.splice(index, 1)
  const owner = record.value?.id ?? null
  toast(t.removed(index + 1), {
    tone: 'info',
    action: {
      label: t.undo,
      run: () => {
        if ((record.value?.id ?? null) !== owner) return
        form.value.links.splice(Math.min(index, form.value.links.length), 0, link)
        void focusIn(link, 'input')
      },
    },
  })
  void focusIn(form.value.links[Math.min(index, form.value.links.length - 1)], '[data-remove]')
}

function complete(link: LinkForm): void {
  link.url = withHttps(link.url)
}
</script>

<template>
  <section class="grid gap-7 border-t border-rule pt-8.5" data-field="links" aria-labelledby="enlaces-titulo">
    <div class="grid gap-1.5">
      <h2 id="enlaces-titulo" class="m-0 text-title">
        {{ t.title }}
      </h2>
      <p class="m-0 max-w-[60ch] text-body text-dim">
        {{ t.text }}
      </p>
    </div>

    <ol v-if="form.links.length" class="m-0 grid list-none border-t border-rule p-0">
      <li
        v-for="(link, index) in form.links"
        :key="keyOf(link)"
        :data-link-key="keyOf(link)"
        class="grid gap-6 border-b border-rule pt-5 pb-7"
      >
        <div class="flex items-center gap-3">
          <h3 class="m-0 text-row text-ink">
            {{ t.link(index + 1) }}
          </h3>
          <IconButton icon="trash" size="sm" class="ml-auto" :label="t.remove(index + 1)" data-remove :disabled="locked" @click="remove(index)" />
        </div>
        <BilingualField
          v-model:es="link.label"
          v-model:en="link.translations.en.label"
          :path="`links[${index}].label`"
          :en-path="`links[${index}].translations.en.label`"
          :label="t.label"
          :hint="t.labelHint"
          :max="80"
          required
        />
        <Field
          :data-field="`links[${index}].url`"
          :label="t.url"
          :hint="t.urlHint"
          :error="editor?.messageFor(`links[${index}].url`) ?? null"
          required
        >
          <TextInput v-model="link.url" type="url" mono inputmode="url" autocomplete="url" :readonly="locked" placeholder="https://" @blur="complete(link)" />
        </Field>
      </li>
    </ol>
    <p v-else class="m-0 text-label text-faint">
      {{ t.empty }}
    </p>

    <div>
      <Button icon="plus" data-link-add :disabled="locked" @click="add">
        {{ t.add }}
      </Button>
    </div>
  </section>
</template>
