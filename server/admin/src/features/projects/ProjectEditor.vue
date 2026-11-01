<script setup lang="ts">
/**
 * El editor de una obra, con el marco común: Lo esencial, Relato, Imágenes y Datos, la publicación con
 * su checklist en el encabezado y «Ver en el sitio» cuando ya se ve.
 * - Obra nueva: abre en Lo esencial con el foco en el título; al crearla pasa a la primera sección
 *   que le falta.
 * - El rol vacío se nombra con su frase («Falta el rol que tuviste en la obra»), junto al campo y
 *   antes de mandar nada; el resto lo valida el marco con el esquema.
 */
import { computed, nextTick, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditor } from '../../composables/useEditor'
import { onShortcut } from '../../composables/useShortcuts'
import { validatePayload } from '../../models/validate'
import type { MenuItem } from '../../ui/Menu.vue'
import EditorFrame from '../collections/EditorFrame.vue'
import PublishState from '../collections/PublishState.vue'
import { projectKey } from './context'
import { projectsText } from './dict'
import { projectIssues, projectModel } from './model'
import { dayOf, publicationStatus, publishedAtFor } from './publication'
import Data from './sections/Data.vue'
import Essentials from './sections/Essentials.vue'
import Images from './sections/Images.vue'
import Story from './sections/Story.vue'
import type { AdminProject } from './types'

const props = defineProps<{ id: number | 'nueva' }>()

const route = useRoute()
const router = useRouter()
const t = projectsText

/** La primera sección que le falta a una obra recién creada (Lo esencial ya está). */
function nextSection(project: AdminProject): string | null {
  if (!project.brief || !project.outcome || !project.steps.length) return 'relato'
  if (!project.media.some(m => m.role === 'COVER')) return 'imagenes'
  if (!project.techs.length) return 'datos'
  return null
}

const editor = useEditor({
  model: projectModel,
  id: () => props.id,
  onAfterSave: (saved, { created, current }) => {
    const section = created && current ? nextSection(saved) : null
    if (section) void router.replace({ name: 'obra', params: { id: String(saved.id), seccion: section } })
  },
})
const { form, record } = editor
provide(projectKey, { form, record })

/** Primero el rol con su frase; si falta, se muestran todos los problemas juntos y no se manda nada. */
async function save(): Promise<void> {
  if (!editor.ready.value || editor.busy.value) return
  if (form.value.role.trim()) return editor.save()
  const payload = projectModel.toPayload(form.value, record.value)
  const others = validatePayload(projectModel.schema, payload, { creating: !record.value }).filter(i => i.path !== 'role')
  await editor.errors.show([{ path: 'role', message: t.essentials.roleMissing }, ...others, ...projectIssues(form.value)])
}
onShortcut('save', () => void save())
const view = { ...editor, save }

/* ── Publicación ───────────────────────────────────────── */

const saved = computed(() => record.value?.publishedAt ?? null)
const status = computed(() => publicationStatus(form.value.publishedAt))
const checklist = computed(() => projectModel.checklist?.(form.value, record.value) ?? [])
const published = computed({
  get: () => form.value.publishedAt !== null,
  set: (on: boolean) => {
    form.value.publishedAt = on ? (saved.value ?? new Date().toISOString()) : null
  },
})
const publishDay = computed({
  get: () => dayOf(form.value.publishedAt),
  set: (day: string) => {
    form.value.publishedAt = publishedAtFor(day, saved.value)
  },
})

/* ── Encabezado y secciones ────────────────────────────── */

const actions: MenuItem[] = [{ id: 'order', label: t.order }]
function onAction(id: string): void {
  if (id === 'order') void router.push({ name: 'obras', query: { vista: 'orden' } })
}

const counts = computed(() => ({
  relato: form.value.steps.length,
  imagenes: record.value?.media.length ?? 0,
  datos: form.value.techIds.length + form.value.links.length + (record.value?.metrics.length ?? 0),
}))

function onSlugChanged(next: AdminProject): void {
  editor.applyPatch(next, ['slug'])
}

// Obra nueva: el foco va al título después del que el router le da al encabezado.
watch(() => editor.ready.value && editor.isNew.value, async (fresh) => {
  if (!fresh || route.query['campo']) return
  await nextTick()
  for (let i = 0; i < 2; i++) await new Promise(resolve => requestAnimationFrame(resolve))
  document.querySelector<HTMLElement>('#main [data-field="title"] input')?.focus()
}, { immediate: true })
</script>

<template>
  <EditorFrame :editor="view" :actions="actions" :counts="counts" @action="onAction">
    <template #publish>
      <PublishState v-model:published="published" v-model:at="publishDay" :status="status" :items="checklist" />
    </template>
    <template #default="{ section }">
      <Essentials v-if="section === 'esencial'" @slug-changed="onSlugChanged" />
      <Story v-else-if="section === 'relato'" />
      <Images v-else-if="section === 'imagenes'" />
      <Data v-else />
    </template>
  </EditorFrame>
</template>
