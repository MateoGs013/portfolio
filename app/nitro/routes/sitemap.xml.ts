/**
 * Sitemap: las páginas fijas, las obras y los artículos publicados (la visibilidad la resuelve la API), cada una con
 * su alternativa en inglés (`?lang=en`) y x-default. `lastmod` sale solo de `updatedAt` de la base.
 * Si la API no responde se devuelve 503 sin caché: nunca un sitemap incompleto.
 */
import { defineEventHandler, setResponseHeader, setResponseStatus } from 'h3'

interface Dated {
  slug?: string
  updatedAt: string
}

interface Entry {
  path: string
  lastmod?: string
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const latest = (dates: string[]) => dates.reduce<string | undefined>((max, d) => (!max || d > max ? d : max), undefined)

function urlXml(siteUrl: string, entry: Entry): string {
  const es = new URL(entry.path, siteUrl).toString()
  const en = new URL(`${entry.path}?lang=en`, siteUrl).toString()
  return [
    '  <url>',
    `    <loc>${escapeXml(es)}</loc>`,
    ...(entry.lastmod ? [`    <lastmod>${entry.lastmod.slice(0, 10)}</lastmod>`] : []),
    `    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(es)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(es)}"/>`,
    '  </url>',
  ].join('\n')
}

export default defineEventHandler(async (event) => {
  const { public: { apiBase, siteUrl } } = useRuntimeConfig(event)

  let projects: Dated[]
  let articles: Dated[]
  let about: Dated
  try {
    const [list, posts, doc] = await Promise.all([
      $fetch<{ data: Dated[] }>(`${apiBase}/projects`, { timeout: 5000 }),
      $fetch<{ data: Dated[] }>(`${apiBase}/articles`, { timeout: 5000 }),
      $fetch<{ data: Dated }>(`${apiBase}/docs/about`, { timeout: 5000 }),
    ])
    projects = list.data
    articles = posts.data
    about = doc.data
  }
  catch {
    setResponseStatus(event, 503)
    setResponseHeader(event, 'Cache-Control', 'no-store')
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'sitemap unavailable'
  }

  const workUpdated = latest(projects.map(p => p.updatedAt))
  const entries: Entry[] = [
    { path: '/', lastmod: latest([...(workUpdated ? [workUpdated] : []), about.updatedAt]) },
    { path: '/projects', lastmod: workUpdated },
    { path: '/about', lastmod: about.updatedAt },
    ...projects.map(p => ({ path: `/projects/${p.slug}`, lastmod: p.updatedAt })),
    { path: '/articles', lastmod: latest(articles.map(a => a.updatedAt)) },
    ...articles.map(a => ({ path: `/articles/${a.slug}`, lastmod: a.updatedAt })),
  ]

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(e => urlXml(siteUrl, e)),
    '</urlset>',
  ].join('\n')
})
