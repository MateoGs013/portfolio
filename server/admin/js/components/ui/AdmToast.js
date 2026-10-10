// Componente UI Reutilizable: AdmToast
// Notificaciones flotantes tipo Vercel con micro-indicadores y desvanecimiento suave

export const AdmToast = {
  name: 'AdmToast',
  props: {
    toasts: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['dismiss'],
  template: `
    <div class="fixed bottom-20 md:bottom-5 right-3 md:right-5 left-3 sm:left-auto z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      <transition-group
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform translate-y-3 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto p-3.5 rounded-lg border text-xs shadow-2xl flex items-start gap-2.5 backdrop-blur-md"
          :class="[
            t.kind === 'ok' && 'bg-[#0f1914]/90 border-emerald-500/30 text-emerald-300',
            t.kind === 'err' && 'bg-[#1a0f0f]/90 border-red-500/30 text-red-300',
            t.kind !== 'ok' && t.kind !== 'err' && 'bg-[#121318]/90 border-white/15 text-zinc-200',
          ]"
        >
          <span 
            class="status-dot mt-1 shrink-0" 
            :class="t.kind === 'ok' ? 'live' : t.kind === 'err' ? 'sig' : 'wip'"
          ></span>

          <div class="flex-1 font-mono-code text-[11.5px] leading-relaxed">
            {{ t.text }}
          </div>

          <button
            type="button"
            @click="$emit('dismiss', t.id)"
            class="text-zinc-500 hover:text-white shrink-0 ml-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </transition-group>
    </div>
  `,
}
