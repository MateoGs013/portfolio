<script setup lang="ts">
/**
 * El texto del artículo: el español y debajo el inglés, cada uno con «Escribir» y «Vista previa». Uno
 * debajo del otro y no lado a lado: es prosa larga y pide su medida de lectura entera.
 */
import { computed } from 'vue'
import { fieldOf } from '../../../models/validate'
import { articles } from '../dict'
import MarkdownField from '../MarkdownField.vue'
import type { ArticleForm } from '../model'

const form = defineModel<ArticleForm>('form', { required: true })
const t = articles.text
const label = computed(() => fieldOf('Article', 'content')?.label ?? t.label)
</script>

<template>
  <div class="grid min-w-0 gap-12">
    <MarkdownField
      v-model="form.content"
      :label="`${label} · ${t.es}`"
      :hint="t.hint"
      path="content"
      lang="es"
      required
    />
    <MarkdownField
      v-model="form.translations.en.content"
      :label="`${label} · ${t.en}`"
      path="translations.en.content"
      lang="en"
      :source="form.content"
    />
  </div>
</template>
