/**
 * Idioma de la página: vive en la URL (`?lang=en`; sin parámetro es español), así el SSR lo resuelve
 * sin parpadeo y cada idioma tiene su propia dirección indexable. `<html lang>` lo pone prefs.ts.
 */
import type { LocationQuery, RouteLocationRaw } from 'vue-router'
import { translate, type DictKey, type DictParams, type Lang } from '~/lib/dict'
import type { Translatable } from '~/lib/api'

export type { Lang } from '~/lib/dict'

/** `?lang=en` → 'en'; cualquier otro valor, o ninguno, es español. */
export function langFrom(query: LocationQuery): Lang {
  const raw = query.lang
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === 'en' ? 'en' : 'es'
}

/** La query con el idioma escrito como corresponde: `lang=en` o nada. */
export function withLang(query: LocationQuery, lang: Lang): LocationQuery {
  const { lang: _drop, ...rest } = query
  return lang === 'en' ? { ...rest, lang: 'en' } : rest
}

export function useLocale() {
  const route = useRoute()
  const router = useRouter()
  const lang = computed<Lang>(() => langFrom(route.query))

  /** Rótulo de interfaz en el idioma activo. */
  const t = (key: DictKey, params?: DictParams) => translate(key, lang.value, params)

  /** Un destino interno que conserva `?lang=en`. */
  function localeRoute(to: RouteLocationRaw): RouteLocationRaw {
    if (lang.value === 'es') return to
    const target = router.resolve(to)
    return { path: target.path, hash: target.hash, query: withLang(target.query, 'en') }
  }

  function setLang(next: Lang) {
    if (next === lang.value) return
    return router.replace({ path: route.path, hash: route.hash, query: withLang(route.query, next) })
  }

  /** `lang="es"` en un campo que no tiene traducción, para que el lector lo pronuncie bien. */
  function langAttr(record: Translatable | null | undefined, field: string): Lang | undefined {
    return lang.value !== 'es' && record?.untranslated.includes(field) ? 'es' : undefined
  }

  return { lang, t, localeRoute, setLang, langAttr }
}
