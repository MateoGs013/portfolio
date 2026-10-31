<script setup lang="ts">
/**
 * Diálogo modal sobre <dialog> con showModal: el resto de la página queda inerte, Tab no sale de
 * adentro y Esc cierra. Al abrir el foco va a `initialFocus` (un selector) o al primer control; al
 * cerrar vuelve a donde estaba. Entra y sale en 200 ms con opacidad y 6 px.
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useId } from '../composables/useId'
import { ui } from './dict'
import IconButton from './IconButton.vue'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  /** Selector del control que recibe el foco al abrir (`[data-initial]`, `#nombre`). */
  initialFocus?: string
  size?: 'sm' | 'md' | 'lg'
  /** Tocar el fondo cierra. Apagalo si cerrar puede perder lo escrito. */
  dismissible?: boolean
  /** Muestra la cruz de cerrar en el encabezado. */
  closeButton?: boolean
}>(), { size: 'md', dismissible: true, closeButton: true })

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement | null>(null)
const closing = ref(false)
const titleId = useId('dlg')
const descId = `${titleId}-desc`
let opener: HTMLElement | null = null
let timer: ReturnType<typeof setTimeout> | undefined

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

async function show(): Promise<void> {
  const el = dialog.value
  if (!el || el.open) return
  clearTimeout(timer)
  closing.value = false
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  el.showModal()
  await nextTick()
  focusInitial(el)
}

/** El pedido, o lo primero para completar del cuerpo, o la primera acción del pie; la cruz, al final. */
const FOCUSABLE = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex="0"]'
function focusInitial(el: HTMLDialogElement): void {
  const target = (props.initialFocus && el.querySelector<HTMLElement>(props.initialFocus))
    || el.querySelector<HTMLElement>('[autofocus]')
    || el.querySelector<HTMLElement>(`[data-dialog-body] :is(${FOCUSABLE})`)
    || el.querySelector<HTMLElement>(`[data-dialog-footer] :is(${FOCUSABLE})`)
  target?.focus()
}

function finish(): void {
  const el = dialog.value
  closing.value = false
  if (el?.open) el.close()
  emit('close')
  // Si quien abrió ya no está (la fila se borró), el foco queda en el documento.
  if (opener?.isConnected) opener.focus()
  opener = null
}

function hide(): void {
  const el = dialog.value
  if (!el?.open || closing.value) return
  if (reduced()) return finish()
  closing.value = true
  timer = setTimeout(finish, 200)
}

watch(open, (value) => {
  if (value) void show()
  else hide()
}, { flush: 'post' })

watch(dialog, (el) => {
  if (el && open.value) void show()
})

/** Esc: el navegador cerraría solo; se cierra por el estado para animar y devolver el foco. */
function onCancel(event: Event): void {
  event.preventDefault()
  open.value = false
}

/**
 * Tab da la vuelta adentro: sin esto el foco del <dialog> modal sale a la barra del navegador.
 * Esc también se atiende acá, porque Chrome puede saltear el evento cancel en un segundo Esc.
 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    open.value = false
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return
  const items = [...dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement)
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

let downOnBackdrop = false
function onPointerDown(event: PointerEvent): void {
  downOnBackdrop = event.target === dialog.value
}
function onClick(event: MouseEvent): void {
  if (props.dismissible && downOnBackdrop && event.target === dialog.value) open.value = false
  downOnBackdrop = false
}

onBeforeUnmount(() => {
  clearTimeout(timer)
  if (dialog.value?.open) dialog.value.close()
})

const widths = { sm: 'w-[min(420px,calc(100vw-32px))]', md: 'w-[min(560px,calc(100vw-32px))]', lg: 'w-[min(760px,calc(100vw-32px))]' }
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descId : undefined"
    class="m-auto max-h-[calc(100dvh-32px)] overflow-visible border-0 bg-transparent p-0 text-ink backdrop:transition-opacity backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0"
    :class="[widths[size], closing ? 'backdrop:opacity-0' : '']"
    @cancel="onCancel"
    @keydown="onKeydown"
    @pointerdown="onPointerDown"
    @click="onClick"
  >
    <div
      class="flex max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-dialog border border-rule-strong bg-surface-2 shadow-dialog transition-[opacity,transform] duration-200 ease-e starting:translate-y-1.5 starting:opacity-0"
      :class="closing ? 'translate-y-1.5 opacity-0' : ''"
    >
      <header class="flex items-start gap-4 px-6 pt-5.5">
        <div class="grid min-w-0 flex-1 gap-1.5">
          <h2 :id="titleId" class="m-0 text-title">
            {{ title }}
          </h2>
          <p v-if="description" :id="descId" class="m-0 text-body text-dim">
            {{ description }}
          </p>
        </div>
        <IconButton v-if="closeButton" icon="close" :label="ui.actions.close" class="-mt-1 -mr-2" @click="open = false" />
      </header>
      <div class="min-h-0 flex-1 overflow-auto px-6 pt-5 pb-6" data-dialog-body>
        <slot />
      </div>
      <footer v-if="$slots.footer" data-dialog-footer class="flex flex-wrap items-center justify-end gap-2 border-t border-rule px-6 py-3.5">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>
