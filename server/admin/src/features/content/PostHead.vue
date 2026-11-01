<script setup lang="ts">
/**
 * El encabezado de una publicación: enfoque, obra de la base y fecha arriba; el título en display (el
 * que viajó desde la fila); y a la derecha su estado, «Publicar por n8n» (el primario), «Publicar en
 * el blog» y Más acciones. «Publicar en el blog» arma un artículo en borrador en la base y lo abre en
 * Artículos para revisarlo antes de publicarlo.
 */
import type { ContentPost } from '@shared/contentContracts'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { options } from '../../stores/meta'
import { toast } from '../../stores/toasts'
import { TRAVEL_NAME } from '../../shell/transition'
import Button from '../../ui/Button.vue'
import StatusDot from '../../ui/StatusDot.vue'
import { failureText } from '../hunter/adapter'
import { contentApi } from './api'
import { content, post as t } from './dict'
import { longDay, pillarOf, postStatusOf, postTitle, projectOf } from './model'
import PostMenu from './PostMenu.vue'
import PublishDialog from './PublishDialog.vue'

const props = defineProps<{
  post: ContentPost
  /** Por qué no se puede cambiar (sin Eros, muestra), o null. */
  locked: string | null
  lockedId: string
}>()

const router = useRouter()

const context = computed(() => {
  const created = longDay(props.post.created_at)
  return [
    pillarOf(props.post),
    projectOf(props.post.project_slug, options.value?.projects)?.title,
    created ? content.created(created) : null,
  ].filter(Boolean).join(' · ')
})
const dispatched = computed(() => {
  const day = longDay(props.post.dispatched_at)
  return day ? content.dispatched(day) : null
})

const publishOpen = ref(false)
const toBlog = ref(false)

function startPublish(): void {
  if (!props.locked) publishOpen.value = true
}

async function publishToBlog(): Promise<void> {
  if (props.locked || toBlog.value) return
  toBlog.value = true
  try {
    const { article } = await contentApi.publishToBlog(props.post.id)
    await router.push(`/articulos/${article.id}`)
    toast(t.blog.done, { duration: 0 })
  }
  catch (err) {
    toast(failureText(err, t.blog.failed), { tone: 'error' })
  }
  finally {
    toBlog.value = false
  }
}

const lockAttrs = computed(() => (props.locked
  ? { 'aria-disabled': 'true' as const, 'aria-describedby': props.lockedId, 'class': 'aria-disabled:opacity-45' }
  : {}))
</script>

<template>
  <header class="grid max-w-[1080px] gap-4">
    <p v-if="context" class="m-0 animate-rise text-body text-dim">
      {{ context }}
    </p>
    <div class="flex flex-wrap items-end gap-x-8 gap-y-5">
      <h1
        class="m-0 min-w-0 flex-1 basis-[min(100%,560px)] animate-rise text-heading text-balance wrap-break-word"
        :style="{ viewTransitionName: TRAVEL_NAME }"
      >
        {{ postTitle(post) }}
      </h1>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-3 pb-1">
        <StatusDot :tone="postStatusOf(post).tone" :label="postStatusOf(post).label" strong />
        <span v-if="dispatched" class="text-body text-dim">{{ dispatched }}</span>
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="primary" v-bind="lockAttrs" @click="startPublish">
            {{ t.publish.action }}
          </Button>
          <Button variant="secondary" v-bind="lockAttrs" :loading="toBlog" :loading-label="t.blog.running" @click="publishToBlog">
            {{ t.blog.action }}
          </Button>
          <PostMenu :post="post" />
        </div>
      </div>
    </div>
  </header>
  <PublishDialog v-model:open="publishOpen" :post="post" />
</template>
