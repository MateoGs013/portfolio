/**
 * Metadatos de cada página desde la base: título, descripción, canonical (lista blanca: `lang` y las
 * facetas de /projects y /articles), hreflang recíproco es/en/x-default, Open Graph con imagen medida y
 * JSON-LD (Person y WebSite desde about + contact, BreadcrumbList por ruta). El CreativeWork de cada
 * obra (`ld-case`) y los del blog (`ld-blog`, `ld-article`) los arman sus páginas y apuntan a la misma
 * Person. El origen absoluto sale solo de `runtimeConfig.public.siteUrl`.
 */
import type { MaybeRefOrGetter } from 'vue'
import type { LocationQuery } from 'vue-router'
import type { Media } from '~/lib/api'
import type { DictKey } from '~/lib/dict'
import { apiParams, type ApiCollection } from './useApi'
import { langFrom, withLang } from './useLocale'
import { docList, docText, useDoc } from './useSiteContent'

export interface PageSeo {
  /** Título propio de la página; sin él (el inicio) se usa el nombre del sitio. */
  title?: string | null
  description?: string | null
  /** Portada de la obra; sin ella (o sin medidas), la imagen OG por defecto. */
  image?: Pick<Media, 'src' | 'alt' | 'width' | 'height' | 'kind' | 'poster'> | null
  type?: 'website' | 'article' | 'profile'
}

interface OgImage {
  url: string
  width: number
  height: number
  alt: string | undefined
}

const ogLocale = { es: 'es_AR', en: 'en_US' } as const

/** La imagen OG por defecto: la genera scripts/og-default.mjs desde about (1200 x 630). */
const OG_DEFAULT = { src: '/og/default.png', width: 1200, height: 630 } as const

/** Colecciones cuyas facetas forman parte de la dirección canónica de su página. */
const FACETED: Record<string, ApiCollection> = { '/projects': 'projects', '/articles': 'articles' }

/** Rótulo de cada sección para las migas de pan (el primer segmento de la ruta). */
const SECTIONS: Record<string, DictKey> = { projects: 'nav.work', about: 'nav.about', articles: 'nav.articles' }

/**
 * La query pública de la página, por lista blanca: `lang=en` y, en una página con facetas, sus filtros
 * normalizados (apiParams). Todo lo demás (vista, cv, foco, utm_*, fbclid, basura) queda afuera.
 */
function publicQuery(path: string, query: LocationQuery): Record<string, string> {
  const collection = FACETED[path]
  const out: Record<string, string> = collection ? { ...apiParams(collection, query) } as Record<string, string> : {}
  if (langFrom(query) === 'en') out.lang = 'en'
  return Object.fromEntries(Object.keys(out).sort().map(k => [k, out[k]!]))
}

/** Escapa `<` para que el JSON no pueda cerrar el `<script>` que lo contiene. */
const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
const ldScript = (key: string, data: unknown) => ({ key, type: 'application/ld+json' as const, innerHTML: jsonLd(data) })

export async function usePageSeo(input: MaybeRefOrGetter<PageSeo>) {
  const route = useRoute()
  const { lang, t } = useLocale()
  const { public: { siteUrl } } = useRuntimeConfig()
  // Todo lo que necesita el contexto de Nuxt va antes del await: después se pierde.
  const aboutDoc = useDoc('about')
  const contactDoc = useDoc('contact')
  const about = aboutDoc.data
  const contact = contactDoc.data

  const absolute = (path: string) => new URL(path, siteUrl).toString()
  const urlFor = (path: string, query: LocationQuery) => {
    const search = new URLSearchParams(publicQuery(path, query)).toString()
    return absolute(`${path}${search ? `?${search}` : ''}`)
  }
  const localized = (path: string) => absolute(lang.value === 'en' ? `${path}?lang=en` : path)

  const seo = computed(() => toValue(input))
  const site = computed(() => docText(about.value, 'display_name') ?? docText(about.value, 'name') ?? '')
  const headline = computed(() => docText(about.value, 'headline'))
  const title = computed(() => {
    const page = seo.value.title
    return page ? t('seo.title', { page, site: site.value }) : site.value
  })
  const description = computed(() => seo.value.description ?? headline.value ?? '')
  const canonical = computed(() => urlFor(route.path, withLang(route.query, lang.value)))

  /** La portada solo sirve de og:image si se conocen sus medidas; si no, la imagen por defecto. */
  const image = computed<OgImage>(() => {
    const cover = seo.value.image
    const src = cover?.kind === 'VIDEO' ? cover.poster : cover?.src
    if (cover && src && cover.width && cover.height) {
      return { url: absolute(src), width: cover.width, height: cover.height, alt: cover.alt ?? undefined }
    }
    // La imagen por defecto lleva el titular en castellano (scripts/og-default.mjs): en otro idioma el
    // alt no describe un texto que la imagen no tiene, se queda en el nombre.
    const alt = headline.value && lang.value === 'es' ? t('seo.ogAlt', { site: site.value, headline: headline.value }) : site.value
    return { url: absolute(OG_DEFAULT.src), width: OG_DEFAULT.width, height: OG_DEFAULT.height, alt: alt || undefined }
  })

  const personId = computed(() => absolute('/#person'))
  const person = computed(() => {
    const portrait = docText(about.value, 'portrait')
    const email = docText(contact.value, 'email')
    const location = docText(contact.value, 'location')
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': personId.value,
      'name': docText(about.value, 'name') ?? undefined,
      'alternateName': docText(about.value, 'display_name') ?? undefined,
      'jobTitle': docText(about.value, 'role') ?? undefined,
      'description': headline.value ?? undefined,
      'url': absolute('/'),
      'image': portrait ? { '@type': 'ImageObject', 'url': absolute(portrait), 'caption': docText(about.value, 'portrait_alt') ?? undefined } : undefined,
      'email': email ? `mailto:${email}` : undefined,
      'homeLocation': location ? { '@type': 'Place', 'name': location } : undefined,
      'knowsLanguage': docList(about.value, 'languages'),
      'sameAs': ['github', 'linkedin'].map(name => docText(contact.value, name)).filter((u): u is string => !!u),
    }
  })

  const website = computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absolute('/#website'),
    'name': site.value || undefined,
    'description': headline.value ?? undefined,
    'url': absolute('/'),
    'inLanguage': lang.value,
    'author': { '@id': personId.value },
    'publisher': { '@id': personId.value },
  }))

  /** Inicio › sección › página. El inicio no lleva migas: sería una lista de un solo elemento. */
  const breadcrumbs = computed(() => {
    const [section, ...rest] = route.path.split('/').filter(Boolean)
    if (!section) return null
    const label = SECTIONS[section]
    const crumbs = [{ name: t('nav.home'), url: localized('/') }]
    crumbs.push({ name: label ? t(label) : (seo.value.title ?? site.value), url: localized(`/${section}`) })
    if (rest.length && seo.value.title) crumbs.push({ name: seo.value.title, url: localized(route.path) })
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': crumbs.map((crumb, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': crumb.name, 'item': crumb.url })),
    }
  })

  useHead({
    title,
    link: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', hreflang: 'es', href: computed(() => urlFor(route.path, withLang(route.query, 'es'))) },
      { rel: 'alternate', hreflang: 'en', href: computed(() => urlFor(route.path, withLang(route.query, 'en'))) },
      { rel: 'alternate', hreflang: 'x-default', href: computed(() => urlFor(route.path, withLang(route.query, 'es'))) },
    ],
    script: computed(() => [
      ldScript('ld-person', person.value),
      ldScript('ld-website', website.value),
      ...(breadcrumbs.value ? [ldScript('ld-breadcrumbs', breadcrumbs.value)] : []),
    ]),
  })

  useSeoMeta({
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogType: computed(() => seo.value.type ?? 'website'),
    ogSiteName: site,
    ogLocale: computed(() => ogLocale[lang.value]),
    ogLocaleAlternate: computed(() => ogLocale[lang.value === 'es' ? 'en' : 'es']),
    ogImage: computed(() => image.value.url),
    ogImageWidth: computed(() => image.value.width),
    ogImageHeight: computed(() => image.value.height),
    ogImageAlt: computed(() => image.value.alt),
    twitterCard: 'summary_large_image',
    twitterImageAlt: computed(() => image.value.alt),
  })

  // El SSR espera los documentos antes de escribir el <head>; en el cliente ya vienen del payload.
  await Promise.all([aboutDoc, contactDoc])
}
