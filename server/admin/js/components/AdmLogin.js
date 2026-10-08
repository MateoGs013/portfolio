// Componente Estructural: AdmLogin
// Consola de autenticación y seguridad para el panel de administración

import { store } from '../store.js'
import { api } from '../api.js'
import { ICONS } from '../config.js'

export const AdmLogin = {
  name: 'AdmLogin',
  setup() {
    async function login() {
      const val = store.tokenInput.trim()
      if (!val) {
        store.toast('err', 'Ingresá el token de administrador para continuar.')
        return
      }
      api.setToken(val)
      store.token = val
      await store.initSession()
    }

    function useDevToken() {
      store.tokenInput = 'dev-token'
      login()
    }

    return {
      store,
      icons: ICONS,
      login,
      useDevToken,
    }
  },
  template: `
    <div class="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <div class="max-w-sm w-full bg-[#101114] border border-white/10 rounded-xl p-7 shadow-2xl space-y-6">
        <!-- Logo y Monograma -->
        <div class="text-center space-y-2">
          <div class="w-10 h-10 rounded-lg bg-[#ff3e00] text-[#09090b] flex items-center justify-center font-bold text-sm mx-auto font-mono-code tracking-tighter shadow-lg shadow-[#ff3e00]/20">
            MS
          </div>
          <h1 class="text-sm font-bold text-white tracking-tight">Consola de Administración</h1>
          <p class="text-[11px] text-zinc-400 font-mono-code">Acceso restringido para el portafolio 2026</p>
        </div>

        <form @submit.prevent="login" class="space-y-4">
          <div class="space-y-1.5">
            <label class="field-label !mb-0">Token de Acceso (ADMIN_TOKEN)</label>
            <div class="relative">
              <input
                :type="store.passwordVisible ? 'text' : 'password'"
                v-model="store.tokenInput"
                placeholder="Ingresá tu clave secreta..."
                class="text-input font-mono-code pr-9"
                autofocus
              />
              <button
                type="button"
                @click="store.passwordVisible = !store.passwordVisible"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                title="Alternar visibilidad"
              >
                <span v-if="store.passwordVisible" v-html="icons.eyeOff"></span>
                <span v-else v-html="icons.eye"></span>
              </button>
            </div>
            <span class="field-hint">Token definido en las variables de entorno del servidor.</span>
          </div>

          <button
            type="submit"
            class="btn-primary w-full !h-[36px] !text-xs cursor-pointer"
          >
            Ingresar a la Consola
          </button>
        </form>

        <div class="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono-code text-zinc-500">
          <span>Ambiente Local</span>
          <button
            type="button"
            @click="useDevToken"
            class="hover:text-white underline cursor-pointer"
          >
            Usar dev-token
          </button>
        </div>
      </div>
    </div>
  `,
}
