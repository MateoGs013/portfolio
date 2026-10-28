declare global {
  interface Window {
    __ROUTE_LOADER__?: {
      startLoading: (path: string) => void
      finishLoading: () => void
    }
  }
}

export default defineNuxtPlugin(() => {
  const { startLoading, finishLoading } = useRouteLoader()

  // Estándar Awwwards 2026: Cero bloqueo visual (0ms) en carga inicial y navegación entre rutas.
  // Exponemos la API programática en window.__ROUTE_LOADER__ para telemetría / tests E2E.
  if (typeof window !== 'undefined') {
    window.__ROUTE_LOADER__ = { startLoading, finishLoading }
  }
})
