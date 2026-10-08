// Componente UI Reutilizable: AdmInput
// Entrada de datos de alta densidad con soporte para candado, prefijos y tipografía mono

export const AdmInput = {
  name: 'AdmInput',
  props: {
    modelValue: {
      type: [String, Number],
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
    type: {
      type: String,
      default: 'text',
    },
    mono: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    lockable: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    prefix: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'toggleLock', 'input'],
  template: `
    <div class="space-y-1">
      <div v-if="label || lockable" class="flex items-center justify-between">
        <label v-if="label" class="field-label !mb-0">
          {{ label }} <span v-if="required" class="text-[#ff3e00]">*</span>
        </label>
        <button
          v-if="lockable"
          type="button"
          @click="$emit('toggleLock')"
          class="text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-colors cursor-pointer"
          :class="locked 
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 font-semibold' 
            : 'text-zinc-400 bg-white/5 border-white/10 hover:text-white'"
          :title="locked ? 'Modo automático vinculado' : 'Modo manual desbloqueado'"
        >
          {{ locked ? '[BLOQUEADO] Auto' : '[MANUAL] Desbloqueado' }}
        </button>
      </div>

      <div class="relative flex items-center">
        <span 
          v-if="prefix" 
          class="absolute left-2.5 text-zinc-500 text-xs font-mono-code pointer-events-none select-none"
        >
          {{ prefix }}
        </span>

        <input
          :type="type"
          :value="modelValue"
          :placeholder="placeholder"
          :readonly="readonly || (lockable && locked)"
          @input="$emit('update:modelValue', $event.target.value); $emit('input', $event)"
          class="text-input"
          :class="[
            mono && 'font-mono-code',
            prefix && '!pl-7',
            (readonly || (lockable && locked)) && '!bg-[#0c0d11] !text-zinc-400 !cursor-not-allowed',
          ]"
        />
      </div>

      <span v-if="hint" class="field-hint">{{ hint }}</span>
    </div>
  `,
}
