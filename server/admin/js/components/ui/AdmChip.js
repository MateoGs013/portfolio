// Componente UI Reutilizable: AdmChip
// Chip interactivo para tecnologías, categorías o tags

export const AdmChip = {
  name: 'AdmChip',
  props: {
    selected: {
      type: Boolean,
      default: false,
    },
    removable: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click', 'remove'],
  template: `
    <span
      @click="$emit('click', $event)"
      class="tech-chip"
      :class="{ selected }"
    >
      <slot></slot>
      <button
        v-if="removable"
        type="button"
        @click.stop="$emit('remove', $event)"
        class="text-zinc-500 hover:text-red-400 ml-0.5 text-xs inline-flex items-center"
      >
        ✕
      </button>
    </span>
  `,
}
