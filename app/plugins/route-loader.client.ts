declare global {
  interface Window {
    __ROUTE_LOADER__?: {
      startLoading: (path: string) => void
      finishLoading: () => void
    }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const { startLoading, finishLoading } = useRouteLoader()

  // 1. Estado de arranque inicial en frío / F5 / recarga directa
  startLoading(router.currentRoute.value.path || '/')
  nuxtApp.hook('app:mounted', () => {
    finishLoading()
  })

  // 2. Navegación reactiva entre rutas del portafolio
  router.beforeEach((to, from) => {
    if (to.fullPath !== from.fullPath) {
      startLoading(to.path)
    }
  })

  router.afterEach(() => {
    finishLoading()
  })

  router.onError(() => {
    finishLoading()
  })

  nuxtApp.hook('page:start', () => {
    startLoading(router.currentRoute.value.path)
  })

  nuxtApp.hook('page:finish', () => {
    finishLoading()
  })

  if (typeof window !== 'undefined') {
    window.__ROUTE_LOADER__ = { startLoading, finishLoading }
  }
})
