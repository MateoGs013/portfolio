<script setup lang="ts">
/**
 * El carrusel de LinkedIn (4:5, 1080 × 1350) tal como lo arma el servidor: en un iframe aislado
 * (sandbox, sin allow-same-origin) con un ticket de una hora, porque el iframe no lleva la clave.
 * «Abrir en otra pestaña» e «Imprimir o guardar como PDF» abren la pestaña en el mismo gesto (si no,
 * el navegador la bloquea) y le dan la dirección con su ticket cuando está lista.
 */
import type { ContentPost } from '@shared/contentContracts'
import { onMounted, ref } from 'vue'
import { announce } from '../../../ui/announce'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import ErrorState from '../../../ui/ErrorState.vue'
import Skeleton from '../../../ui/Skeleton.vue'
import { failureText } from '../../hunter/adapter'
import { carouselUrl } from '../api'
import { post as t } from '../dict'

const props = defineProps<{ post: ContentPost }>()

const url = ref<string | null>(null)
const loadError = ref<string | null>(null)
const loading = ref(false)
const loaded = ref(false)

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  loaded.value = false
  try {
    url.value = await carouselUrl(props.post.id)
  }
  catch (err) {
    loadError.value = failureText(err, t.carousel.failed)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.post.carousel_slides.length) void load()
})

/* ── Otra pestaña ──────────────────────────────────────── */

const opening = ref<'view' | 'print' | null>(null)
const blockedLink = ref<string | null>(null)

async function openTab(mode: 'view' | 'print'): Promise<void> {
  if (opening.value) return
  blockedLink.value = null
  // En el gesto: después de un await el navegador ya no la deja abrir.
  const win = window.open('', '_blank')
  opening.value = mode
  try {
    const target = await carouselUrl(props.post.id, mode)
    if (win && !win.closed) {
      win.opener = null
      win.location.href = target
    }
    else {
      blockedLink.value = target
      announce(`${t.carousel.blocked} ${t.carousel.link}.`)
    }
  }
  catch (err) {
    win?.close()
    toast(failureText(err, t.carousel.failed), { tone: 'error' })
  }
  finally {
    opening.value = null
  }
}
</script>

<template>
  <div class="grid gap-7 pt-8">
    <p v-if="!post.carousel_slides.length" class="m-0 text-body text-faint">
      {{ t.carousel.empty }}
    </p>
    <template v-else>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
        <p class="m-0 text-body text-dim tabular-nums">
          {{ t.carousel.slides(post.carousel_slides.length) }}
        </p>
        <div class="flex flex-wrap gap-2 md:ml-auto">
          <Button variant="ghost" icon="external" :loading="opening === 'view'" @click="openTab('view')">
            {{ t.carousel.open }}
          </Button>
          <Button variant="secondary" :loading="opening === 'print'" @click="openTab('print')">
            {{ t.carousel.print }}
          </Button>
        </div>
      </div>
      <p v-if="blockedLink" class="m-0 text-body text-dim" role="status">
        {{ t.carousel.blocked }}
        <a :href="blockedLink" target="_blank" rel="noopener noreferrer" class="text-ink underline underline-offset-4">{{ t.carousel.link }}</a>
      </p>

      <ErrorState v-if="loadError" :title="t.carousel.failed" :message="loadError" :retrying="loading" @retry="load" />
      <div v-else class="w-full max-w-[640px] rounded-dialog bg-surface p-3 sm:p-5" :aria-busy="loading || !loaded || undefined">
        <Skeleton v-if="!url" variant="text" :count="6" />
        <iframe
          v-else
          :key="url"
          :src="url"
          :title="t.carousel.frame"
          sandbox="allow-scripts allow-modals"
          referrerpolicy="no-referrer"
          class="block h-[860px] w-full rounded-media border-0 transition-opacity duration-200 ease-e"
          :class="loaded ? 'opacity-100' : 'opacity-0'"
          data-carousel
          @load="loaded = true"
        />
      </div>
    </template>
  </div>
</template>
