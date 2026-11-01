/**
 * Lo que cuelga de /admin/ (los assets del build y cualquier dirección sin extensión) pasa tal cual a
 * la API, que decide: asset, index o 404. No es una routeRule `/admin/**` porque esas corren antes que
 * las rutas y también toman `/admin`, que tiene que responder 301 (app/nitro/routes/admin.ts).
 */
import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const { public: { apiBase } } = useRuntimeConfig(event)
  return proxyRequest(event, `${new URL(apiBase).origin}${url.pathname}${url.search}`)
})
