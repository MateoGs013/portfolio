/**
 * Entrada del admin (/admin), que sirve la API. Su base de Vite es absoluta y necesita la barra
 * final: sin ella el navegador resolvería mal lo relativo. Las routeRules no distinguen `/admin` de
 * `/admin/` (el matcher ignora la barra final) y una regla de redirect en `/admin` vuelve sobre sí
 * misma, así que se decide acá con la ruta cruda: sin barra, 301; con barra, el index de la API. Lo
 * que cuelga de `/admin/` va por admin/[...].ts.
 */
import { defineEventHandler, getRequestURL, proxyRequest, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (!url.pathname.endsWith('/')) return sendRedirect(event, `/admin/${url.search}`, 301)
  const { public: { apiBase } } = useRuntimeConfig(event)
  return proxyRequest(event, `${new URL(apiBase).origin}/admin/${url.search}`)
})
