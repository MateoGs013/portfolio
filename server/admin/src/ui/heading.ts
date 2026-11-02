/**
 * El tamaño del título de un registro según su largo: hasta 40 caracteres va en `heading`; uno más
 * largo baja un escalón y se corta en dos líneas (el texto entero queda en `title`), así el
 * contenido no se va debajo del pliegue.
 */
export const LONG_TITLE = 40

export function headingClass(title: string | null | undefined): string {
  return (title ?? '').length > LONG_TITLE ? 'text-heading-long line-clamp-2' : 'text-heading'
}
