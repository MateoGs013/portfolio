// Componente UI Reutilizable: AdmTextarea
// Entrada multilínea con contador reactivo de caracteres y soporte para texto técnico

export const AdmTextarea = {
  name: 'AdmTextarea',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    hint: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    rows: {
      type: [Number, String],
      default: 3,
    },
    mono: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    max: {
      type: Number,
      default: null,
    },
  },
  emits: ['update:modelValue', 'input'],
  template: `
    <div class="space-y-1">
      <div v-if="label" class="flex items-center justify-between">
        <label class="field-label !mb-0">
          {{ label }} <span v-if="required" class="text-[#ff3e00]">*</span>
        </label>
        <span class="text-[10px] font-mono-code text-zinc-500">
          {{ (modelValue || '').length }}<span v-if="max"> / {{ max }}</span> caracteres
        </span>
      </div>

      <textarea
        :rows="rows"
        :value="modelValue"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value); $emit('input', $event)"
        class="textarea-input"
        :class="[mono && 'font-mono-code text-xs']"
      ></textarea>

      <span v-if="hint" class="field-hint">{{ hint }}</span>
    </div>
  `,
}
