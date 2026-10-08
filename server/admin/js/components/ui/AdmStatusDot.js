// Componente UI Reutilizable: AdmStatusDot
// Micro-dot geométrico de 6px estricto (Invariante 2026: Cero Emojis)

export const AdmStatusDot = {
  name: 'AdmStatusDot',
  props: {
    status: {
      type: String,
      default: 'live', // 'live' | 'wip' | 'archived' | 'danger' | 'sig'
    },
  },
  template: `
    <span
      class="status-dot inline-block shrink-0"
      :class="[
        status === 'LIVE' || status === 'live' ? 'live' : '',
        status === 'WIP' || status === 'wip' ? 'wip' : '',
        status === 'ARCHIVED' || status === 'archived' ? 'archived' : '',
        status === 'sig' ? 'sig' : '',
        status === 'danger' ? '!bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' : '',
      ]"
    ></span>
  `,
}
