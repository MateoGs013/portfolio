// Componente Raíz: AdmApp
// Layout elástico desktop con arquitectura 240px 1fr y 240px 320px 1fr

import { store } from '../store.js'
import { AdmLogin } from './AdmLogin.js'
import { AdmHeader } from './AdmHeader.js'
import { AdmSidebar } from './AdmSidebar.js'
import { AdmExplorer } from './AdmExplorer.js'
import { AdmEditor } from './AdmEditor.js'
import { AdmDashboard } from './AdmDashboard.js'
import { AdmJobHunter } from './AdmJobHunter.js'
import { AdmBottomNav } from './ui/AdmBottomNav.js'
import { CommandPalette } from './modals/CommandPalette.js'
import { ConfirmModal } from './modals/ConfirmModal.js'
import { HelpModal } from './modals/HelpModal.js'
import { LightboxModal } from './modals/LightboxModal.js'
import { AdmToast } from './ui/AdmToast.js'

export const AdmApp = {
  name: 'AdmApp',
  components: {
    AdmLogin,
    AdmHeader,
    AdmSidebar,
    AdmExplorer,
    AdmEditor,
    AdmDashboard,
    AdmJobHunter,
    AdmBottomNav,
    CommandPalette,
    ConfirmModal,
    HelpModal,
    LightboxModal,
    AdmToast,
  },
  setup() {
    return {
      store,
    }
  },
  template: `
    <div class="h-screen w-screen overflow-hidden bg-[#08090a] text-[#f4f4f6] font-sans antialiased flex flex-col select-none">
      
      <!-- PANTALLA DE LOGIN -->
      <AdmLogin v-if="!store.token" />

      <!-- CONSOLA PRINCIPAL AUTENTICADA -->
      <div v-else class="h-screen w-screen overflow-hidden flex flex-col">
        <!-- 1. Cabecera Global Fija -->
        <AdmHeader
          @openPalette="store.modals.commandPalette = true"
          @openHelp="store.modals.help = true"
        />

        <!-- 2. Cuerpo Principal con Navegación y Lienzo -->
        <div class="flex-1 flex overflow-hidden">
          <!-- Sidebar Fijo (240px) en Desktop -->
          <AdmSidebar />

          <!-- Lienzo Principal Dinámico con padding inferior en móvil para bottom nav -->
          <main class="flex-1 flex overflow-hidden bg-[#08090a] pb-[62px] md:pb-0">
            <!-- A. Modo Dashboard: Contenedor fluido completo -->
            <AdmDashboard v-if="store.section === 'dashboard'" />

            <!-- B. Modo Job Hunter: Consola IA dedicada -->
            <AdmJobHunter v-else-if="store.section === 'hunter'" />

            <!-- C. Modo Colecciones: Rejilla Explorador (320px) + Editor Flex (1fr) con Master-Detail en móvil -->
            <div v-else class="flex-1 flex overflow-hidden">
              <AdmExplorer :class="store.mobileView === 'list' ? 'flex' : 'hidden md:flex'" />
              <AdmEditor :class="store.mobileView === 'detail' ? 'flex' : 'hidden md:flex'" />
            </div>
          </main>
        </div>

        <!-- 3. Barra de Navegación Inferior Móvil (Redes Sociales Style) -->
        <AdmBottomNav />
      </div>

      <!-- ════════════════════════════════════════════════════════════════════ -->
      <!-- MODALES GLOBALES Y NOTIFICACIONES                                    -->
      <!-- ════════════════════════════════════════════════════════════════════ -->
      
      <!-- Modal: Command Palette (Ctrl+K) -->
      <CommandPalette
        v-if="store.modals.commandPalette"
        @close="store.modals.commandPalette = false"
      />

      <!-- Modal: Confirmación Accesible -->
      <ConfirmModal
        v-if="store.modals.confirm"
        :dialog="store.modals.confirm"
      />

      <!-- Modal: Guía para Asistentes -->
      <HelpModal
        v-if="store.modals.help"
        @close="store.modals.help = false"
      />

      <!-- Modal: Lightbox de Imágenes -->
      <LightboxModal
        v-if="store.modals.lightbox"
        :src="store.modals.lightbox"
        @close="store.modals.lightbox = null"
      />

      <!-- Toast Container Flotante -->
      <AdmToast
        :toasts="store.toasts"
        @dismiss="store.removeToast"
      />

    </div>
  `,
}
