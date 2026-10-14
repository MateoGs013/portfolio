// Componente Modal: ConfirmModal (AdmConfirmModal)
// Dialogo de confirmacion accesible con lenguaje claro y tranquilizador

const { onMounted, onBeforeUnmount, ref } = window.Vue

export const ConfirmModal = {
  name: 'AdmConfirmModal',
  props: {
    dialog: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const confirmBtnRef = ref(null)

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        props.dialog.onCancel()
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', onKeyDown)
      confirmBtnRef.value?.focus()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', onKeyDown)
    })

    return {
      confirmBtnRef,
    }
  },
  template: `
    <div
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="dialog.onCancel()"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="dialog.title"
        class="bg-[#121318] border border-white/15 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        <div>
          <div class="flex items-center gap-2">
            <span
              class="status-dot shrink-0"
              :class="dialog.kind === 'danger' ? 'sig' : 'wip'"
            ></span>
            <h3 class="text-sm font-bold text-white tracking-tight">
              {{ dialog.title }}
            </h3>
          </div>
          <p class="text-xs text-zinc-300 mt-2 leading-relaxed">
            {{ dialog.message }}
          </p>
        </div>

        <div
          v-if="dialog.targetName"
          class="p-2.5 bg-[#09090b] rounded border border-white/10 text-xs font-mono-code text-zinc-200 truncate select-all"
        >
          {{ dialog.targetName }}
        </div>

        <p v-if="dialog.detail" class="text-[11px] text-zinc-500 leading-relaxed font-mono-code">
          {{ dialog.detail }}
        </p>

        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
          <button
            type="button"
            @click="dialog.onCancel()"
            class="btn-secondary !h-[30px] !text-xs cursor-pointer"
          >
            {{ dialog.cancelText || 'Cancelar' }}
          </button>
          <button
            ref="confirmBtnRef"
            type="button"
            @click="dialog.onConfirm()"
            class="!h-[30px] !text-xs cursor-pointer"
            :class="dialog.kind === 'danger' ? 'btn-danger' : 'btn-primary'"
          >
            {{ dialog.confirmText || 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
}
