// Componente UI Reutilizable: AdmSelect
// Selector desplegable estilizado según estándar Obsidian Dark

export const AdmSelect = {
  name: 'AdmSelect',
  props: {
    modelValue: {
      type: [String, Number, null],
      default: null,
    },
    label: {
      type: String,
      default: '',
    },
    hint: {
      type: String,
      default: '',
    },
    mono: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'change'],
  template: `
    <div class="space-y-1">
      <label v-if="label" class="field-label !mb-0">
        {{ label }} <span v-if="required" class="text-[#ff3e00]">*</span>
      </label>

      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value); $emit('change', $event)"
        class="select-input"
        :class="[mono && 'font-mono-code']"
      >
        <slot></slot>
      </select>

      <span v-if="hint" class="field-hint">{{ hint }}</span>
    </div>
  `,
}
