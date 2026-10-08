// Componente UI Reutilizable: AdmButton
// Estándar Linear / Vercel con micro-interacciones hover y soporte de hotkeys

export const AdmButton = {
  name: 'AdmButton',
  props: {
    variant: {
      type: String,
      default: 'secondary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'pill'
    },
    size: {
      type: String,
      default: 'md', // 'xs' | 'sm' | 'md' | 'lg'
    },
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    kbd: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'button',
    },
  },
  emits: ['click'],
  template: `
    <button
      :type="type"
      :disabled="disabled || loading"
      @click="$emit('click', $event)"
      class="inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      :class="[
        // Variantes
        variant === 'primary' && 'bg-[#ff3e00] text-[#09090b] font-bold hover:bg-[#ff551c] shadow-[0_1px_3px_rgba(0,0,0,0.5)]',
        variant === 'secondary' && 'bg-[#15161b] hover:bg-[#1e2028] text-zinc-300 hover:text-white border border-white/10 hover:border-white/20',
        variant === 'danger' && 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25',
        variant === 'ghost' && 'bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white',
        variant === 'pill' && 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full border border-white/10',

        // Tamaños
        size === 'xs' && 'h-[24px] px-2 text-[10.5px] rounded',
        size === 'sm' && 'h-[28px] px-2.5 text-[11px] rounded',
        size === 'md' && 'h-[32px] px-3.5 text-xs rounded',
        size === 'lg' && 'h-[36px] px-4 text-xs rounded-md',
      ]"
    >
      <span v-if="loading" class="animate-spin inline-block text-[11px]">↻</span>
      <slot></slot>
      <kbd 
        v-if="kbd" 
        class="text-[9.5px] font-mono-code bg-black/40 px-1 py-0.2 rounded border border-white/10 text-zinc-400 ml-1"
      >
        {{ kbd }}
      </kbd>
    </button>
  `,
}
