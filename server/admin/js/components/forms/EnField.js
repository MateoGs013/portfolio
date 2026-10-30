// Campo en inglés con el español como referencia encima del input (modo EN del editor).
// La referencia es solo lectura y queda ligada al input con aria-describedby.

import { store } from '../../store.js'
import { asText } from '../../translations.js'

const { computed } = window.Vue

export const EnField = {
  name: 'AdmEnField',
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    es: { type: [String, Array], default: '' },
    modelValue: { type: String, default: '' },
    rows: { type: Number, default: 0 },
    maxlength: { type: Number, default: 0 },
    type: { type: String, default: 'text' },
    hint: { type: String, default: '' },
    dense: { type: Boolean, default: false },
  },
  // update:modelValue en cada tecla (formularios con «Guardar»); commit al salir del campo (media, que guarda sola).
  emits: ['update:modelValue', 'commit'],
  setup(props, { emit }) {
    const esText = computed(() => asText(props.es).trim())
    const length = computed(() => (props.modelValue || '').length)

    function onInput(event) {
      emit('update:modelValue', event.target.value)
      store.checkDirty()
    }

    return { esText, length, onInput, onChange: e => emit('commit', e.target.value) }
  },
  template: `
    <div class="space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <label :for="id" class="field-label !mb-0 flex items-center gap-1.5">
          <span>{{ label }}</span>
          <span class="text-[9.5px] font-mono-code font-bold px-1 rounded border border-[#ff3e00]/40 text-[#ff8a5c] normal-case tracking-normal">EN</span>
          <span class="sr-only">(inglés)</span>
        </label>
        <span
          v-if="maxlength"
          class="text-[10px] font-mono-code"
          :class="length >= maxlength ? 'text-amber-400' : 'text-zinc-500'"
          aria-hidden="true"
        >{{ length }}/{{ maxlength }}</span>
      </div>
      <p
        :id="id + '-es'"
        lang="es"
        class="border-l-2 border-white/15 bg-white/[0.02] pl-2.5 pr-2 text-[11.5px] leading-relaxed text-zinc-400 whitespace-pre-line break-words"
        :class="dense ? 'py-1' : 'py-1.5'"
      ><span class="font-mono-code text-[9.5px] text-zinc-400 mr-1.5 select-none" aria-hidden="true">ES</span><span class="sr-only">Español de referencia: </span><span v-if="esText">{{ esText }}</span><span v-else class="italic text-zinc-400">Vacío en español</span></p>
      <textarea
        v-if="rows"
        :id="id"
        lang="en"
        :value="modelValue"
        @input="onInput"
        @change="onChange"
        :rows="rows"
        :maxlength="maxlength || null"
        :aria-describedby="id + '-es'"
        class="textarea-input"
      ></textarea>
      <input
        v-else
        :id="id"
        lang="en"
        :type="type"
        :value="modelValue"
        @input="onInput"
        @change="onChange"
        :maxlength="maxlength || null"
        :aria-describedby="id + '-es'"
        class="text-input"
        :class="{ '!h-[28px]': dense }"
      />
      <span v-if="hint" class="field-hint">{{ hint }}</span>
    </div>
  `,
}
