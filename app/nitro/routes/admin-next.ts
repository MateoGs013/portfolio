/**
 * Entrada del admin nuevo (/admin-next), que sirve la API. Su base de Vite es absoluta y necesita la
 * barra final: sin ella el navegador resolvería mal lo relativo. Las routeRules no distinguen
 * `/admin-next` de `/admin-next/` (el matcher ignora la barra final), así que se decide acá con la
 * ruta cruda: sin barra, 301; con barra, el index de la API. Los assets van por la routeRule
 * `/admin-next/assets/**` de nuxt.config.ts.
 */
import { defineEventHandler, getRequestURL, proxyRequest, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (!url.pathname.endsWith('/')) return sendRedirect(event, `/admin-next/${url.search}`, 301)
  const { public: { apiBase } } = useRuntimeConfig(event)
  return proxyRequest(event, `${new URL(apiBase).origin}/admin-next/${url.search}`)
})
