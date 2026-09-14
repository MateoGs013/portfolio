import { experienceTranslations, projectTranslations, translations, type LocaleContent } from '~/lib/i18n'

export type PortfolioLocale = 'es' | 'en'

const currentLocale = ref<PortfolioLocale>('es')

export function usePortfolioLocale() {
  function toggleLocale() {
    currentLocale.value = currentLocale.value === 'es' ? 'en' : 'es'
    if (import.meta.client) {
      localStorage.setItem('portfolio-locale', currentLocale.value)
      document.documentElement.setAttribute('lang', currentLocale.value)
    }
  }

  function setLocale(loc: PortfolioLocale) {
    currentLocale.value = loc
    if (import.meta.client) {
      localStorage.setItem('portfolio-locale', loc)
      document.documentElement.setAttribute('lang', loc)
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('portfolio-locale') as PortfolioLocale | null
      if (saved === 'es' || saved === 'en') {
        currentLocale.value = saved
        document.documentElement.setAttribute('lang', saved)
      }
    }
  })

  function t(es: string, en: string): string {
    return currentLocale.value === 'es' ? es : en
  }

  function localizeFieldLabel(name: string, fallback?: string): string {
    const loc = currentLocale.value
    return translations[loc].detail.fieldLabels[name] ?? fallback ?? name
  }

  function getProjectLocalization(slug: string) {
    const p = projectTranslations[slug]
    if (!p) return null
    const loc = currentLocale.value
    return {
      summary: p.summary[loc],
      orgDesc: p.orgDesc ? p.orgDesc[loc] : undefined,
      brief: p.brief ? p.brief[loc] : undefined,
      outcome: p.outcome ? p.outcome[loc] : undefined,
    }
  }

  function getExperienceLocalization(slug: string) {
    const e = experienceTranslations[slug]
    if (!e) return null
    const loc = currentLocale.value
    return {
      role: e.role[loc],
      summary: e.summary[loc],
    }
  }

  const tr = computed<LocaleContent>(() => translations[currentLocale.value])

  return {
    locale: currentLocale,
    toggleLocale,
    setLocale,
    isEs: computed(() => currentLocale.value === 'es'),
    isEn: computed(() => currentLocale.value === 'en'),
    t,
    tr,
    localizeFieldLabel,
    getProjectLocalization,
    getExperienceLocalization,
  }
}
