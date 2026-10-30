/**
 * Scroll entre rutas. Si solo cambia la query en la misma página (idioma, `?vista=registro`, filtros
 * de Obra), el scroll se queda donde está: el morph de R ancla la página por su cuenta. Al cambiar de
 * página se espera a que la nueva esté montada (después de la view transition) para subir o ir al ancla.
 */
import type { RouterConfig } from '@nuxt/schema'

export default {
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) return to.hash && to.hash !== from.hash ? { el: to.hash, top: 0 } : false
    const nuxtApp = useNuxtApp()
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce('page:finish', () => {
        if (savedPosition) return resolve(savedPosition)
        if (to.hash) return resolve({ el: to.hash, top: 0 })
        resolve({ top: 0 })
      })
    })
  },
} satisfies RouterConfig
