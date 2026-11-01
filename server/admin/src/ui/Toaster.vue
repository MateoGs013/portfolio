<script setup lang="ts">
/**
 * Los avisos al pie, centrados. Entran con 200 ms de opacidad y 6 px. El texto ya se anunció por la
 * región viva; acá se ve, se puede accionar y se cierra. Un error queda hasta que se cierra.
 */
import { dismissToast, holdToast, toasts, type ToastTone } from '../stores/toasts'
import { ui } from './dict'
import IconButton from './IconButton.vue'
import StatusDot from './StatusDot.vue'
import type { StatusTone } from './StatusDot.vue'
import { layerTarget } from './topLayer'

const tones: Record<ToastTone, StatusTone> = { ok: 'ok', info: 'neutral', error: 'danger' }
</script>

<template>
  <!-- Con un diálogo modal abierto, los avisos se muestran adentro para poder tocarlos. -->
  <Teleport :to="layerTarget">
    <section :aria-label="ui.toasts.region" class="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <TransitionGroup
        tag="ol"
        class="m-0 grid w-full max-w-[520px] list-none justify-items-center gap-2 p-0"
        enter-active-class="transition-[opacity,transform] duration-200 ease-e"
        enter-from-class="translate-y-1.5 opacity-0"
        leave-active-class="transition-opacity duration-200 ease-e"
        leave-to-class="opacity-0"
      >
        <li
          v-for="item in toasts.items"
          :key="item.id"
          class="pointer-events-auto flex max-w-full items-center gap-3 rounded-[8px] border border-rule-strong bg-surface-2 py-2 pr-2 pl-3.5 text-label text-ink shadow-dialog"
          :data-tone="item.tone"
          @pointerenter="holdToast(item.id, true)"
          @pointerleave="holdToast(item.id, false)"
          @focusin="holdToast(item.id, true)"
          @focusout="holdToast(item.id, false)"
        >
          <StatusDot :tone="tones[item.tone]" :label="item.message" strong class="min-w-0" />
          <button
            v-if="item.action"
            type="button"
            class="h-7 shrink-0 rounded-control border-0 bg-transparent px-2 text-label font-[560] text-ink underline decoration-rule-hover underline-offset-4 transition-colors duration-120 ease-e hover:decoration-ink"
            @click="item.action.run(); dismissToast(item.id)"
          >
            {{ item.action.label }}
          </button>
          <IconButton icon="close" size="sm" :label="ui.actions.dismiss" @click="dismissToast(item.id)" />
        </li>
      </TransitionGroup>
    </section>
  </Teleport>
</template>
