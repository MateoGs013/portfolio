/**
 * Redirección de compatibilidad canónica.
 * Redirige rutas obsoletas (/datos, /diseno, /umbral) a las rutas limpias directas.
 */
export default defineNuxtRouteMiddleware((to) => {
  const segs = to.path.split('/').filter(Boolean)
  const first = segs[0]

  if (first === 'datos' || first === 'diseno' || first === 'umbral') {
    const rest = segs.slice(1)
    const targetPath = rest.length ? `/${rest.join('/')}` : '/'
    return navigateTo({ path: targetPath, query: to.query }, { redirectCode: 301 })
  }
})
