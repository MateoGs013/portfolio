<script setup lang="ts">
/**
 * Más acciones de una publicación: su estado (PATCH /content/posts/:id/status: aprobar, volver a
 * borrador, marcar como publicada, descartar) y eliminarla (DELETE, con confirmación, y de vuelta a la
 * lista). Todo va a Eros: sin Eros o con la muestra quedan apagadas.
 */
import { postStatusLabels, type ContentPost, type PostStatus } from '@shared/contentContracts'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { requestConfirm } from '../../stores/dialogs'
import { toast } from '../../stores/toasts'
import Menu, { type MenuItem } from '../../ui/Menu.vue'
import { failureText } from '../hunter/adapter'
import { post as t } from './dict'
import { postTitle } from './model'
import { canChangePost, changePostStatus, posts, removePost } from './store'

const props = defineProps<{ post: ContentPost }>()
const router = useRouter()

const busy = ref(false)

const STATUS_ACTIONS: readonly { status: PostStatus, label: string }[] = [
  { status: 'approved', label: t.status.approve },
  { status: 'draft', label: t.status.toDraft },
  { status: 'published', label: t.status.published },
  { status: 'rejected', label: t.status.reject },
]

const items = computed<MenuItem[]>(() => {
  const locked = !canChangePost(props.post) || busy.value
  return [
    ...STATUS_ACTIONS.filter(a => a.status !== props.post.status).map(a => ({ id: a.status, label: a.label, disabled: locked })),
    { id: 'remove', label: t.remove.label, icon: 'trash', danger: true, disabled: locked },
  ]
})

async function setStatus(status: PostStatus): Promise<void> {
  busy.value = true
  try {
    await changePostStatus(props.post, status)
    toast(t.status.done(postStatusLabels[status]))
  }
  catch (err) {
    toast(failureText(err, t.status.failed), { tone: 'error' })
  }
  finally {
    busy.value = false
  }
}

async function remove(): Promise<void> {
  const ok = await requestConfirm({
    title: t.remove.title,
    message: `${t.remove.message(postTitle(props.post))} ${t.remove.blogKept}`,
    impact: [...t.remove.impact],
    confirmLabel: t.remove.confirm,
    destructive: true,
  })
  if (!ok) return
  busy.value = true
  try {
    await removePost(props.post)
    toast(t.remove.done)
    // Primero la vuelta a la lista y después se quita: así el registro no muestra «No encontramos».
    const filtro = posts.lastFilter.value
    await router.push({ path: '/busqueda/publicaciones', query: filtro ? { filtro } : {} })
    posts.drop(props.post.id)
  }
  catch (err) {
    toast(failureText(err, t.remove.failed), { tone: 'error' })
  }
  finally {
    busy.value = false
  }
}

function onSelect(id: string): void {
  if (id === 'remove') void remove()
  else void setStatus(id as PostStatus)
}
</script>

<template>
  <Menu :items="items" @select="onSelect" />
</template>
