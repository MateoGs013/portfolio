// Componente Estructural: AdmLogin
// Consola de autenticación y seguridad para el panel de administración Linear 2026
// Cero emojis, telemetría de seguridad y micro-interacciones táctiles

import { store } from '../store.js'
import { api } from '../api.js'
import { ICONS } from '../config.js'

const { ref } = window.Vue

export const AdmLogin = {
  name: 'AdmLogin',
  setup() {
    const isAuthenticating = ref(false)

    async function login() {
      if (isAuthenticating.value) return
      const val = store.tokenInput.trim()
      if (!val) {
        store.toast('err', 'Ingresá el token de administrador para continuar.')
        return
      }
      isAuthenticating.value = true
      try {
        api.setToken(val)
        store.token = val
        await store.initSession()
      } finally {
        isAuthenticating.value = false
      }
    }

    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

    function useDevToken() {
      store.tokenInput = 'dev-token'
      login()
    }

    return {
      store,
      icons: ICONS,
      login,
      useDevToken,
      isLocal,
      isAuthenticating,
    }
  },
  template: `
    <div class="min-h-screen bg-[#080808] blueprint-grid flex flex-col items-center justify-center p-4 relative select-none">
      <!-- Top Pill de Seguridad -->
      <div class="mb-6 inline-flex items-center gap-2 h-7 px-3 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm font-mono-code text-[11px] text-zinc-400">
        <span class="status-dot live"></span>
        <span>PG-17 ACID</span>
        <span class="text-zinc-600">·</span>
        <span class="text-white font-medium">CONSOLA PRIVADA</span>
      </div>

      <!-- Tarjeta de Acceso Linear -->
      <div class="max-w-sm w-full bg-[#0c0d10]/95 backdrop-blur-md border border-white/12 rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-6">
        <!-- Logo y Monograma -->
        <div class="text-center space-y-2.5">
          <div class="w-11 h-11 rounded-xl bg-[#ff3e00] text-[#09090b] flex items-center justify-center font-bold text-sm mx-auto font-mono-code tracking-tight shadow-lg shadow-[#ff3e00]/25 ring-1 ring-white/20">
            MS
          </div>
          <div>
            <h1 class="text-base font-bold text-white tracking-tight">Consola de Administración</h1>
            <p class="text-[11px] text-zinc-400 font-mono-code mt-0.5">CMS y Suite Eros · v2026.2</p>
          </div>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="login" class="space-y-4">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="field-label !mb-0">Token de Acceso</label>
              <span class="text-[10px] font-mono-code text-zinc-500">ADMIN_TOKEN</span>
            </div>
            <div class="relative">
              <input
                :type="store.passwordVisible ? 'text' : 'password'"
                v-model="store.tokenInput"
                placeholder="Ingresá la clave de acceso..."
                class="text-input !h-10 pl-3 pr-10 text-xs font-mono-code bg-black/40 border-white/15 focus:border-[#ff3e00]"
                :disabled="isAuthenticating"
                autofocus
              />
              <button
                type="button"
                @click="store.passwordVisible = !store.passwordVisible"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer transition-colors"
                title="Alternar visibilidad"
                tabindex="-1"
              >
                <span v-if="store.passwordVisible" v-html="icons.eyeOff"></span>
                <span v-else v-html="icons.eye"></span>
              </button>
            </div>
            <span class="field-hint">Token criptográfico configurado en el entorno del servidor.</span>
          </div>

          <button
            type="submit"
            :disabled="isAuthenticating"
            class="btn-primary w-full !h-10 !text-xs cursor-pointer flex items-center justify-center gap-2 font-mono-code tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isAuthenticating" class="inline-block w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
            <span>{{ isAuthenticating ? 'Autenticando...' : 'Ingresar a la Consola' }}</span>
          </button>
        </form>

        <!-- Ambiente Local / Dev Helper -->
        <div v-if="isLocal" class="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono-code text-zinc-400">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Localhost</span>
          </span>
          <button
            type="button"
            @click="useDevToken"
            :disabled="isAuthenticating"
            class="h-6 px-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 hover:text-white font-mono-code text-[10px] active:scale-[0.96] transition-all cursor-pointer disabled:opacity-50"
          >
            dev-token rápido
          </button>
        </div>
      </div>

      <!-- Enlace al Portafolio Público -->
      <a
        href="/"
        class="mt-6 inline-flex items-center gap-1.5 text-xs font-mono-code text-zinc-500 hover:text-zinc-300 transition-colors no-underline"
      >
        <span>← Volver al Portafolio</span>
      </a>
    </div>
  `,
}
