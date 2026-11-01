<script setup lang="ts">
/**
 * Los formatos de texto de una publicación: LinkedIn (el texto y el primer comentario), el hilo de X
 * parte por parte con su tope de 280 y Dev.to (título, etiquetas y el artículo en Markdown). Cada
 * texto se copia por separado; el hilo, también entero.
 */
import type { ContentPost } from '@shared/contentContracts'
import { computed } from 'vue'
import { useClipboard } from '../../../composables/useClipboard'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import { ui } from '../../../ui/dict'
import Mono from '../../../ui/Mono.vue'
import CopyBlock from '../CopyBlock.vue'
import { post as t } from '../dict'

const props = defineProps<{
  post: ContentPost
  format: 'linkedin' | 'hilo' | 'devto'
}>()

const thread = computed(() => props.post.twitter_thread.filter(part => part.trim()))
const { copy, copied } = useClipboard()

async function copyThread(): Promise<void> {
  const result = await copy(thread.value.join('\n\n'))
  if (result === 'ok') toast(ui.copy.ok, { tone: 'info', duration: 2000 })
  else toast(ui.copy.error, { tone: 'error' })
}
</script>

<template>
  <div class="grid max-w-[880px] gap-10 pt-8">
    <template v-if="format === 'linkedin'">
      <CopyBlock v-if="post.linkedin_text.trim()" :label="t.linkedin.body" :what="t.linkedin.bodyWhat" :text="post.linkedin_text" />
      <p v-else class="m-0 text-body text-faint">
        {{ t.linkedin.empty }}
      </p>
      <CopyBlock
        v-if="post.first_comment?.trim()"
        :label="t.linkedin.comment"
        :what="t.linkedin.commentWhat"
        :text="post.first_comment"
        :hint="t.linkedin.commentHint"
      />
    </template>

    <template v-else-if="format === 'hilo'">
      <template v-if="thread.length">
        <div>
          <Button variant="secondary" icon="copy" @click="copyThread">
            {{ copied ? ui.actions.copied : t.thread.all }}
          </Button>
        </div>
        <ol class="m-0 grid list-none gap-10 p-0">
          <li v-for="(part, index) in thread" :key="index" class="animate-rise stagger" :style="{ '--i': Math.min(index, 8) }">
            <CopyBlock :label="t.thread.part(index + 1, thread.length)" :what="t.thread.partWhat(index + 1)" :text="part" :limit="280" />
          </li>
        </ol>
      </template>
      <p v-else class="m-0 text-body text-faint">
        {{ t.thread.empty }}
      </p>
    </template>

    <template v-else>
      <template v-if="post.devto_markdown.trim()">
        <CopyBlock v-if="post.devto_title" :label="t.devto.title" :what="t.devto.titleWhat" :text="post.devto_title" short />
        <div v-if="post.devto_tags.length" class="grid gap-3">
          <h3 class="m-0 text-label font-[420] text-dim">
            {{ t.devto.tags }}
          </h3>
          <ul class="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
            <li v-for="tag in post.devto_tags" :key="tag" class="text-dim">
              <Mono size="label">#{{ tag }}</Mono>
            </li>
          </ul>
        </div>
        <CopyBlock :label="t.devto.body" :what="t.devto.bodyWhat" :text="post.devto_markdown" code />
      </template>
      <p v-else class="m-0 text-body text-faint">
        {{ t.devto.empty }}
      </p>
    </template>
  </div>
</template>
