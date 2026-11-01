<script setup lang="ts">
/**
 * El editor de un artículo (#/articulos/:id y #/articulos/nuevo), en dos secciones: Lo esencial y
 * Texto. En el encabezado, la publicación («Mostrar en el sitio» pone PUBLISHED y la fecha desde la que
 * se ve) con su checklist, y en «Más acciones», Archivar o Sacar del archivo. Uno nuevo nace borrador:
 * la publicación aparece después de crearlo. Si llegó desde «Publicar en el blog», avisa qué revisar.
 */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEditor } from '../../composables/useEditor'
import type { RecordStatus } from '../../models/types'
import { requestConfirm } from '../../stores/dialogs'
import { announce } from '../../ui/announce'
import type { MenuItem } from '../../ui/Menu.vue'
import EditorFrame from '../collections/EditorFrame.vue'
import PublishState from '../collections/PublishState.vue'
import { articles } from './dict'
import { articleChecklist, articleModel, articleStatus, type AdminArticle } from './model'
import { fromDay } from './dates'
import ReviewNotice from './ReviewNotice.vue'
import Essentials from './sections/Essentials.vue'
import TextSection from './sections/TextSection.vue'

const props = defineProps<{ id: number | 'nueva' }>()

const editor = useEditor({ model: articleModel, id: () => props.id })
const { form, record } = editor

/* ── Publicación ────────────────────────────────────────── */

const published = computed({
  get: () => form.value.status === 'PUBLISHED',
  set: (on: boolean) => { form.value.status = on ? 'PUBLISHED' : 'DRAFT' },
})
const status = computed<RecordStatus>(() => {
  const day = form.value.publishedAt
  const at = day ? new Date(fromDay(day)) : (published.value && record.value?.status !== 'PUBLISHED' ? new Date() : null)
  return articleStatus(form.value.status, at)
})
const checklist = computed(() => articleChecklist(form.value))

/* ── Dirección ──────────────────────────────────────────── */

const slugEndpoint = computed(() => (record.value ? articleModel.slugEndpoint?.(record.value.id) ?? null : null))
function onSlugChanged(next: unknown): void {
  editor.applyPatch(next as AdminArticle, ['slug'])
}

/* ── Archivar ───────────────────────────────────────────── */

const a = articles.actions
const actions = computed<MenuItem[]>(() => {
  if (!record.value) return []
  return [record.value.status === 'ARCHIVED' ? { id: 'unarchive', label: a.unarchive } : { id: 'archive', label: a.archive }]
})

async function onAction(id: string): Promise<void> {
  if (id !== 'archive' && id !== 'unarchive') return
  const archiving = id === 'archive'
  if (archiving) {
    const yes = await requestConfirm({
      title: a.archiveTitle,
      message: editor.dirty.value ? `${a.archiveText} ${a.archiveDirty}` : a.archiveText,
      confirmLabel: a.archive,
    })
    if (!yes) return
  }
  const before = form.value.status
  form.value.status = archiving ? 'ARCHIVED' : 'DRAFT'
  await editor.save()
  if (editor.status.value === 'error') form.value.status = before
  else announce(archiving ? a.archived : a.unarchived)
}

/* ── Llegó desde Publicaciones ──────────────────────────── */

const route = useRoute()
const back = (window.history.state as { back?: unknown } | null)?.back
const fromPosts = route.query['origen'] === 'eros' || (typeof back === 'string' && back.startsWith('/busqueda/publicaciones'))
const reviewDismissed = ref(false)
const review = computed(() => fromPosts && !reviewDismissed.value && record.value?.status === 'DRAFT')
</script>

<template>
  <EditorFrame :editor="editor" :actions="actions" @action="onAction">
    <template #publish>
      <PublishState
        v-if="record"
        v-model:published="published"
        v-model:at="form.publishedAt"
        :status="status"
        :items="checklist"
      />
    </template>
    <template #default="{ section }">
      <ReviewNotice v-if="review" @dismiss="reviewDismissed = true" />
      <Essentials
        v-if="section === 'esencial'"
        v-model:form="form"
        :record="record"
        :slug-endpoint="slugEndpoint"
        @slug-changed="onSlugChanged"
      />
      <TextSection v-else v-model:form="form" />
    </template>
  </EditorFrame>
</template>
