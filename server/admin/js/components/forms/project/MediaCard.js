// Tarjeta de una pieza de media: miniatura o póster, alt y pie editables, rol, pantalla,
// orden, tinte, dimensiones y peso. Cada cambio se guarda solo (PATCH parcial) al salir del campo.

import { store } from '../../../store.js'
import { MEDIA_ROLE_LABELS, MEDIA_VIEWPORT_LABELS, fileName, formatBytes } from '../../../fields.js'

const { computed, ref } = window.Vue

export const MediaCard = {
  name: 'AdmMediaCard',
  props: {
    media: { type: Object, required: true },
    canUp: { type: Boolean, default: false },
    canDown: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
  },
  emits: ['patch', 'move', 'remove', 'retint', 'poster'],
  setup(props, { emit }) {
    const posterInput = ref(null)
    const isVideo = computed(() => props.media.kind === 'VIDEO')
    const thumb = computed(() => (isVideo.value ? props.media.poster : props.media.src))
    const name = computed(() => fileName(props.media.src))
    const tintSource = computed(() => (isVideo.value ? props.media.poster : props.media.src))

    /** Guarda un texto solo si cambió (alt es obligatorio; el pie vacío queda en NULL). */
    function saveText(field, event) {
      const value = event.target.value.trim()
      if (value === (props.media[field] || '')) return
      if (field === 'alt' && !value) {
        event.target.value = props.media.alt
        store.toast('err', 'El texto alternativo no puede quedar vacío: describe la imagen para quien no la ve.')
        return
      }
      emit('patch', { [field]: value || null })
    }

    function onPoster(event) {
      const file = event.target.files?.[0]
      if (file) emit('poster', file)
      event.target.value = ''
    }

    return {
      store, posterInput, isVideo, thumb, name, tintSource, saveText, onPoster,
      roles: computed(() => store.meta.enums.MediaRole || []),
      viewports: computed(() => store.meta.enums.MediaViewport || []),
      roleLabel: r => MEDIA_ROLE_LABELS[r] || r,
      viewportLabel: v => MEDIA_VIEWPORT_LABELS[v] || v,
      size: computed(() => [`${props.media.width}×${props.media.height}`, formatBytes(props.media.bytes)].filter(Boolean).join(' · ')),
    }
  },
  template: `
    <article class="p-3 bg-[#121318] border border-white/10 rounded flex gap-3" :aria-label="'Media ' + name">
      <div class="relative w-32 h-20 shrink-0">
        <button
          v-if="thumb"
          type="button"
          @click="store.modals.lightbox = thumb"
          class="block w-full h-full rounded overflow-hidden border border-white/10 hover:border-[#ff3e00] bg-black cursor-pointer"
          :aria-label="'Ampliar ' + name"
        >
          <img :src="thumb" :alt="media.alt" class="w-full h-full object-cover" loading="lazy" />
        </button>
        <div v-else class="w-full h-full rounded border border-dashed border-white/15 bg-black flex items-center justify-center text-[10px] font-mono-code text-zinc-500 text-center px-1">
          Sin póster
        </div>
        <span v-if="isVideo" class="absolute left-1 bottom-1 text-[9px] font-mono-code font-bold tracking-wide px-1 rounded bg-black/80 text-white border border-white/20">VIDEO</span>
      </div>

      <div class="flex-1 min-w-0 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-xs font-medium text-white truncate font-mono-code" :title="media.src">{{ name }}</div>
            <div class="text-[10.5px] font-mono-code text-zinc-500">{{ size }}<span v-if="media.srcWebm"> · con WebM</span></div>
          </div>
          <div class="flex items-center gap-0.5 shrink-0">
            <button type="button" class="icon-btn" :disabled="!canUp || busy" @click="$emit('move', -1)" :aria-label="'Subir ' + name + ' en el orden'">
              <svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" class="icon-btn" :disabled="!canDown || busy" @click="$emit('move', 1)" :aria-label="'Bajar ' + name + ' en el orden'">
              <svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" class="icon-btn danger" :disabled="busy" @click="$emit('remove')" :aria-label="'Eliminar ' + name">
              <svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <label class="block">
          <span class="field-label !mb-1">Texto alternativo *</span>
          <input type="text" :value="media.alt" @change="saveText('alt', $event)" class="text-input !h-[28px]" maxlength="300" />
        </label>
        <label class="block">
          <span class="field-label !mb-1">Pie en la galería</span>
          <input type="text" :value="media.caption || ''" @change="saveText('caption', $event)" class="text-input !h-[28px]" maxlength="300" placeholder="Opcional" />
        </label>

        <div class="grid grid-cols-2 gap-2">
          <label class="block">
            <span class="field-label !mb-1">Rol</span>
            <select :value="media.role" @change="$emit('patch', { role: $event.target.value })" class="select-input !h-[28px] !text-[11px] font-mono-code" :disabled="busy">
              <option v-for="r in roles" :key="r" :value="r">{{ roleLabel(r) }}</option>
            </select>
          </label>
          <label class="block">
            <span class="field-label !mb-1">Pantalla</span>
            <select :value="media.viewport" @change="$emit('patch', { viewport: $event.target.value })" class="select-input !h-[28px] !text-[11px] font-mono-code" :disabled="busy">
              <option v-for="v in viewports" :key="v" :value="v">{{ viewportLabel(v) }}</option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono-code text-zinc-400">
          <span class="w-4 h-4 rounded-sm border border-white/20 shrink-0" :style="{ backgroundColor: media.tint || 'transparent' }" aria-hidden="true"></span>
          <span>{{ media.tint || 'sin tinte' }}</span>
          <button
            type="button"
            class="btn-secondary !h-[24px] !px-2 !text-[10.5px]"
            :disabled="!tintSource || busy"
            :title="tintSource ? '' : 'Subí un póster para calcular el tinte del video'"
            @click="$emit('retint')"
          >Recalcular tinte</button>
          <template v-if="isVideo">
            <button type="button" class="btn-secondary !h-[24px] !px-2 !text-[10.5px]" :disabled="busy" @click="posterInput && posterInput.click()">
              {{ media.poster ? 'Cambiar póster' : 'Subir póster' }}
            </button>
            <input ref="posterInput" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" tabindex="-1" aria-hidden="true" @change="onPoster" />
          </template>
        </div>
      </div>
    </article>
  `,
}
