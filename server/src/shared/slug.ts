/**
 * La dirección pública de un registro (`/projects/la-rucula`). Se arma una vez, al crear, y después
 * solo cambia con «Cambiar dirección»: los enlaces viejos dejan de andar y no hay tabla de alias.
 *
 * Vive en shared/ porque el admin la usa para proponer la dirección mientras se escribe el título.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const SLUG_MAX = 80

/** Minúsculas, números y guiones simples, sin guiones en los bordes. */
export function isSlug(value: string): boolean {
  return value.length <= SLUG_MAX && SLUG_PATTERN.test(value)
}

/**
 * Dirección a partir de un título: sin acentos (la ñ queda en n), en minúsculas y con guiones entre
 * palabras. `La Rúcula · Gastrobar` → `la-rucula-gastrobar`. Puede quedar vacía si el texto no tiene
 * letras ni números.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/, '')
}
