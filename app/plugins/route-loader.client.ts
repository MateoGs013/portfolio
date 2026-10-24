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

  router.beforeEach((to, from) => {
    // Si la ruta cambia, iniciar carga con metadata contextual
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
