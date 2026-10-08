// Componente Modal: LightboxModal (AdmLightboxModal)
// Visor de pantalla completa para capturas y assets multimedia

export const LightboxModal = {
  name: 'AdmLightboxModal',
  props: {
    src: {
      type: String,
      required: true,
    },
  },
  emits: ['close'],
  template: `
    <div
      class="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-6 select-none"
      @click="$emit('close')"
    >
      <div class="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
        <img
          :src="src"
          alt="Vista previa ampliada"
          class="max-w-full max-h-[85vh] object-contain rounded-lg border border-white/20 shadow-2xl"
          @click.stop
        />
        <div class="mt-3 flex items-center gap-3 text-xs font-mono-code text-zinc-400">
          <span class="truncate max-w-md">{{ src }}</span>
          <button
            type="button"
            @click="$emit('close')"
            class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            Cerrar (ESC)
          </button>
        </div>
      </div>
    </div>
  `,
}
