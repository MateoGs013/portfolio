<script setup lang="ts">
/**
 * Imágenes: la zona de subida y las piezas de la obra en una grilla de miniaturas, en el orden del
 * sitio (portadas y después la galería), para ver la obra entera de un vistazo. Abrir una pieza
 * despliega su formulario a todo el ancho; quedan abiertas solas las nuevas, las que tienen un error
 * y la que pide ?campo=. Se ordenan arrastrando el asa o con Subir y Bajar, dentro de su grupo. Eliminar pregunta
 * y deja la pieza fuera hasta Guardar; Descartar la recupera. Todo se guarda con el mismo Guardar de
 * la obra, también en una obra nueva.
 */
import { computed, nextTick, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { requestConfirm } from '../../../stores/dialogs'
import { toast } from '../../../stores/toasts'
import { announce } from '../../../ui/announce'
import { useEditorContext } from '../../collections/context'
import { useProject } from '../context'
import { mediaText } from '../media/dict'
import MediaCard from '../media/MediaCard.vue'
import MediaDrop from '../media/MediaDrop.vue'
import MediaTile from '../media/MediaTile.vue'
import { coversFirst, pieceName } from '../media/mediaForm'
import { useMediaQueue } from '../media/mediaQueue'
import { moveItem, useDragSort } from '../reorder'

const t = mediaText
const { form } = useProject()
const queue = useMediaQueue()
const editor = useEditorContext()
const locked = computed(() => queue.running.value || (editor?.busy.value ?? false))

/** Las piezas que se abrieron a mano. */
const opened = reactive(new Set<string>())
const PIECE_FIELDS = ['alt', 'caption', 'tint', 'role', 'viewport', 'translations.en.alt', 'translations.en.caption']
const hasIssue = (index: number) => !!editor && PIECE_FIELDS.some(f => editor.messageFor(`media[${index}].${f}`))

function isOpen(index: number): boolean {
  const piece = form.value.media[index]
  if (!piece) return false
  return piece.id === null || opened.has(piece.key) || hasIssue(index) || queue.states.value[piece.key]?.phase === 'error'
}
/** Se puede cerrar la que está abierta a mano; las que piden atención quedan a la vista. */
const closable = (index: number) => isOpen(index) && !(form.value.media[index]?.id === null || hasIssue(index) || queue.states.value[form.value.media[index]!.key]?.phase === 'error')

function open(index: number): void {
  const piece = form.value.media[index]
  if (!piece) return
  opened.add(piece.key)
  void focusIn(piece.key, '[data-move="close"]')
}

function close(index: number): void {
  const piece = form.value.media[index]
  if (!piece) return
  opened.delete(piece.key)
  void focusIn(piece.key, '[data-move="open"]')
}

// ?campo=media[3].alt abre esa pieza antes de que el editor busque el campo.
const route = useRoute()
watch(() => [route.query['campo'], form.value.media.length] as const, ([campo]) => {
  const at = typeof campo === 'string' ? /^media\[(\d+)\]/.exec(campo) : null
  const piece = at ? form.value.media[Number(at[1])] : undefined
  if (piece) opened.add(piece.key)
}, { immediate: true })

const sameGroup = (a: number, b: number) => form.value.media[a]?.role === form.value.media[b]?.role

async function focusIn(key: string, selector: string): Promise<void> {
  await nextTick()
  const root = document.querySelector<HTMLElement>(`[data-media-key="${key}"]`)
  const target = root?.querySelector<HTMLButtonElement>(selector)
  if (target && !target.disabled) target.focus()
  else root?.querySelector<HTMLElement>('[data-move]:not(:disabled), button')?.focus()
}

function move(from: number, to: number, focus?: 'up' | 'down'): void {
  const list = form.value.media
  const piece = list[from]
  if (!piece || locked.value || !sameGroup(from, to)) return
  moveItem(list, from, to)
  const group = list.filter(m => m.role === piece.role)
  announce(t.card.moved(pieceName(list, piece), group.indexOf(piece) + 1, group.length))
  if (focus) void focusIn(piece.key, `[data-move="${focus}"]`)
}

async function remove(index: number): Promise<void> {
  const list = form.value.media
  const piece = list[index]
  if (!piece || locked.value) return
  const name = pieceName(list, piece)
  if (piece.id !== null) {
    const steps = form.value.steps.filter(s => s.mediaId === piece.id).length
    const ok = await requestConfirm({
      title: t.remove.title,
      message: t.remove.message(name),
      impact: steps ? [t.remove.steps(steps)] : undefined,
      confirmLabel: t.remove.confirm,
      destructive: true,
    })
    if (!ok) return
  }
  const at = form.value.media.indexOf(piece)
  if (at === -1) return
  form.value.media.splice(at, 1)
  if (piece.id === null) {
    announce(t.remove.dropped(name))
  }
  else {
    // Descartar la recupera igual; el aviso lo ofrece a mano mientras se sigue en esta obra.
    toast(t.remove.removed(name), {
      tone: 'info',
      action: {
        label: t.card.undo,
        run: () => {
          if (form.value.media.some(m => m.key === piece.key)) return
          form.value.media.splice(Math.min(at, form.value.media.length), 0, piece)
          coversFirst(form.value.media)
          announce(t.remove.undone)
        },
      },
    })
  }
  const next = form.value.media[Math.min(at, form.value.media.length - 1)]
  if (next) void focusIn(next.key, '[data-move]')
  else void nextTick(() => document.querySelector<HTMLElement>('[data-field="media"] button')?.focus())
}

const drag = useDragSort((from, to) => move(from, to), () => !locked.value)
</script>

<template>
  <section class="grid gap-8" aria-labelledby="imagenes-titulo">
    <div class="grid gap-1.5">
      <h2 id="imagenes-titulo" class="m-0 text-title">
        {{ t.title }}
      </h2>
      <p class="m-0 max-w-[60ch] text-body text-dim">
        {{ form.media.length ? t.lead : t.empty }}
      </p>
    </div>

    <MediaDrop />

    <ol
      v-if="form.media.length"
      class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-3.5 gap-y-7 p-0"
      :aria-label="t.list"
    >
      <li
        v-for="(piece, index) in form.media"
        :key="piece.key"
        class="animate-rise stagger transition-[background-color,opacity] duration-200 ease-e"
        :class="[
          isOpen(index) ? 'col-span-full border-y border-rule' : 'rounded-media',
          drag.over.value === index && drag.dragging.value !== index && sameGroup(index, drag.dragging.value ?? -1) ? 'bg-surface' : '',
          drag.dragging.value === index ? 'opacity-45' : '',
        ]"
        :style="{ '--i': Math.min(index, 8) }"
        v-bind="drag.row(index)"
      >
        <MediaCard
          v-if="isOpen(index)"
          :index="index"
          :can-up="index > 0 && sameGroup(index, index - 1)"
          :can-down="index < form.media.length - 1 && sameGroup(index, index + 1)"
          :locked="locked"
          :handle="drag.handle(index)"
          :closable="closable(index)"
          @up="move(index, index - 1, 'up')"
          @down="move(index, index + 1, 'down')"
          @remove="remove(index)"
          @close="close(index)"
        />
        <MediaTile v-else :index="index" :handle="drag.handle(index)" @open="open(index)" />
      </li>
    </ol>
  </section>
</template>
