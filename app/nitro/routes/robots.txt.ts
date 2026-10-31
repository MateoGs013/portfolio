/**
 * robots.txt desde `runtimeConfig.public.siteUrl`, la misma fuente que el canonical y el sitemap: la
 * URL del sitemap nunca queda escrita a mano ni apunta a otro entorno. El admin y su API no se indexan.
 */
import { defineEventHandler, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  const { public: { siteUrl } } = useRuntimeConfig(event)
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/admin',
    '',
    `Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}`,
    '',
  ].join('\n')
})
