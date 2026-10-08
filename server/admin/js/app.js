// Portfolio CMS 2026 · Punto de Entrada Principal (ES Module)
// Montaje de Vue 3, atajos globales y salvaguardas operativas

import { store } from './store.js'
import { AdmApp } from './components/AdmApp.js'

// Salvaguarda de Seguridad: Interceptar diálogos nativos bloqueantes
window.confirm = (msg) => {
  console.warn('[Admin Security Safeguard] Native window.confirm() interceptado:', msg)
  return false
}
window.alert = (msg) => {
  console.warn('[Admin Security Safeguard] Native window.alert() interceptado:', msg)
  store.toast('err', String(msg))
}
window.prompt = (msg) => {
  console.warn('[Admin Security Safeguard] Native window.prompt() interceptado:', msg)
  return null
}

const { createApp } = window.Vue

const app = createApp(AdmApp)

// Inicialización de la sesión si ya existía un token
if (store.token) {
  store.initSession()
}

// ─── ATAJOS DE TECLADO GLOBALES ─────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  // ESC: Cerrar modales abiertos
  if (e.key === 'Escape') {
    if (store.modals.commandPalette) {
      store.modals.commandPalette = false
      return
    }
    if (store.modals.help) {
      store.modals.help = false
      return
    }
    if (store.modals.lightbox) {
      store.modals.lightbox = null
      return
    }
    if (store.modals.confirm) {
      store.modals.confirm.onCancel()
      return
    }
  }

  // Ctrl+K / Cmd+K: Command Palette
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    store.modals.commandPalette = !store.modals.commandPalette
    return
  }

  // Ctrl+S / Cmd+S: Guardar cambios
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    // Trigger guardar a través del botón visible o directamente
    const saveBtn = document.querySelector('footer button.btn-primary')
    if (saveBtn) saveBtn.click()
    return
  }

  // Ctrl+N / Cmd+N: Crear nuevo registro
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    store.createRecord()
    return
  }

  // Ctrl+D / Cmd+D: Duplicar registro activo
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
    if (store.form || store.current) {
      e.preventDefault()
      const dupBtn = document.querySelector('button[title*="Ctrl+D"]')
      if (dupBtn) dupBtn.click()
    }
  }
})

// Guardia antes de recargar o cerrar pestaña con cambios sucios
window.addEventListener('beforeunload', (e) => {
  if (store.isDirty) {
    e.preventDefault()
    e.returnValue = ''
  }
})

app.mount('#app')

// Exportación global para depuración controlada
window.__adminStore = store
