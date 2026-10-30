/**
 * Metadatos de cada página desde la base: título, descripción, canonical (lista blanca: `lang` y
 * las facetas de /projects y /articles), hreflang recíproco es/en/x-default, Open Graph y JSON-LD Person (about + contact). El
 * origen absoluto sale solo de `runtimeConfig.public.siteUrl`. X3 lo completa (imagen OG por defecto).
 */
import type { MaybeRefOrGetter } from 'vue'
import type { LocationQuery } from 'vue-router'
import type { Media } from '~/lib/api'
import { apiParams, type ApiCollection } from './useApi'
import { langFrom, withLang } from './useLocale'
import { docList, docText, useDoc } from './useSiteContent'

export interface PageSeo {
  /** Título propio de la página; sin él (el inicio) se usa el nombre del sitio. */
  title?: string | null
  description?: string | null
  /** Portada de la obra; sin ella, el retrato de about. */
  image?: Pick<Media, 'src' | 'alt' | 'width' | 'height' | 'kind' | 'poster'> | null
  type?: 'website' | 'article' | 'profile'
}

const ogLocale = { es: 'es_AR', en: 'en_US' } as const

/** Colecciones cuyas facetas forman parte de la dirección canónica de su página. */
const FACETED: Record<string, ApiCollection> = { '/projects': 'projects', '/articles': 'articles' }

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
  const urlFor = (query: LocationQuery) => {
    const search = new URLSearchParams(publicQuery(route.path, query)).toString()
    return absolute(`${route.path}${search ? `?${search}` : ''}`)
  }

  const seo = computed(() => toValue(input))
  const site = computed(() => docText(about.value, 'display_name') ?? docText(about.value, 'name') ?? '')
  const title = computed(() => {
    const page = seo.value.title
    return page ? t('seo.title', { page, site: site.value }) : site.value
  })
  const description = computed(() => seo.value.description ?? docText(about.value, 'headline') ?? '')
  const canonical = computed(() => urlFor(withLang(route.query, lang.value)))
  const image = computed(() => {
    const cover = seo.value.image
    const src = cover?.kind === 'VIDEO' ? cover.poster : cover?.src
    const fallback = docText(about.value, 'portrait')
    return src ? { url: absolute(src), alt: cover?.alt } : fallback ? { url: absolute(fallback), alt: docText(about.value, 'portrait_alt') ?? undefined } : null
  })

  const person = computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': docText(about.value, 'name') ?? undefined,
    'jobTitle': docText(about.value, 'role') ?? undefined,
    'description': docText(about.value, 'headline') ?? undefined,
    'url': absolute('/'),
    'image': docText(about.value, 'portrait') ? absolute(docText(about.value, 'portrait')!) : undefined,
    'email': docText(contact.value, 'email') ? `mailto:${docText(contact.value, 'email')}` : undefined,
    'homeLocation': docText(contact.value, 'location') ? { '@type': 'Place', 'name': docText(contact.value, 'location') } : undefined,
    'knowsLanguage': docList(about.value, 'languages'),
    'sameAs': ['github', 'linkedin'].map(name => docText(contact.value, name)).filter((u): u is string => !!u),
  }))

  useHead({
    title,
    link: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', hreflang: 'es', href: computed(() => urlFor(withLang(route.query, 'es'))) },
      { rel: 'alternate', hreflang: 'en', href: computed(() => urlFor(withLang(route.query, 'en'))) },
      { rel: 'alternate', hreflang: 'x-default', href: computed(() => urlFor(withLang(route.query, 'es'))) },
    ],
    script: [{ key: 'ld-person', type: 'application/ld+json', innerHTML: computed(() => jsonLd(person.value)) }],
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
    ogImage: computed(() => image.value?.url),
    ogImageAlt: computed(() => image.value?.alt),
    twitterCard: 'summary_large_image',
  })

  // El SSR espera los documentos antes de escribir el <head>; en el cliente ya vienen del payload.
  await Promise.all([aboutDoc, contactDoc])
}
