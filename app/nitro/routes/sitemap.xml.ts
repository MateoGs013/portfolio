import { defineEventHandler, setResponseHeader } from 'h3'

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: string
}

interface ApiItem {
  slug: string
  updatedAt?: string | Date
  publishedAt?: string | Date
}

interface ApiResponse<T> {
  data?: T[]
}

const STATIC_ROUTES: SitemapUrl[] = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/projects', changefreq: 'daily', priority: '0.9' },
  { loc: '/experience', changefreq: 'weekly', priority: '0.8' },
  { loc: '/stack', changefreq: 'weekly', priority: '0.8' },
  { loc: '/orgs', changefreq: 'weekly', priority: '0.7' },
  { loc: '/articles', changefreq: 'daily', priority: '0.9' },
  { loc: '/about', changefreq: 'monthly', priority: '0.7' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
  { loc: '/lab', changefreq: 'weekly', priority: '0.8' },
]

function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return new Date().toISOString().split('T')[0]!
  try {
    const d = new Date(dateInput)
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0]! : d.toISOString().split('T')[0]!
  }
  catch {
    return new Date().toISOString().split('T')[0]!
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=14400')

  const siteUrl = 'https://mateogs.tech'
  const config = useRuntimeConfig(event)
  const apiBase = (config.public?.apiBase as string) || 'http://localhost:3001/api'

  async function fetchCollection(endpoint: string): Promise<ApiItem[]> {
    try {
      const res = await $fetch<ApiResponse<ApiItem>>(`${apiBase}${endpoint}`, {
        timeout: 3000,
      })
      if (res && Array.isArray(res.data)) {
        return res.data
      }
    }
    catch {
      // Si la API falla o está offline, degradar limpiamente
    }
    return []
  }

  const [projects, experiences, stack, orgs, articles] = await Promise.all([
    fetchCollection('/projects'),
    fetchCollection('/experience'),
    fetchCollection('/stack'),
    fetchCollection('/orgs'),
    fetchCollection('/articles'),
  ])

  const dynamicUrls: SitemapUrl[] = [
    ...projects.map(p => ({
      loc: `/projects/${p.slug}`,
      lastmod: formatDate(p.updatedAt),
      changefreq: 'weekly' as const,
      priority: '0.8',
    })),
    ...experiences.map(e => ({
      loc: `/experience/${e.slug}`,
      lastmod: formatDate(e.updatedAt),
      changefreq: 'monthly' as const,
      priority: '0.7',
    })),
    ...stack.map(s => ({
      loc: `/stack/${s.slug}`,
      lastmod: formatDate(s.updatedAt),
      changefreq: 'monthly' as const,
      priority: '0.7',
    })),
    ...orgs.map(o => ({
      loc: `/orgs/${o.slug}`,
      lastmod: formatDate(o.updatedAt),
      changefreq: 'monthly' as const,
      priority: '0.6',
    })),
    ...articles.map(a => ({
      loc: `/articles/${a.slug}`,
      lastmod: formatDate(a.updatedAt || a.publishedAt),
      changefreq: 'weekly' as const,
      priority: '0.8',
    })),
  ]

  const allUrls = [...STATIC_ROUTES, ...dynamicUrls]

  const xmlEntries = allUrls
    .map((url) => {
      const loc = escapeXml(`${siteUrl}${url.loc}`)
      const lastmod = formatDate(url.lastmod)
      const changefreq = url.changefreq || 'weekly'
      const priority = url.priority || '0.5'

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`
})
