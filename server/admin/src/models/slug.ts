/**
 * La dirección pública de un registro, con las mismas reglas que el servidor: shared/slug.ts es la
 * única fuente (no importa nada, así que el admin la puede llevar en su build tal cual).
 */
export { isSlug, slugify, SLUG_MAX, SLUG_PATTERN } from '@shared/slug'
