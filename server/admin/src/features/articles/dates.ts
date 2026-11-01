/**
 * La fecha de publicación en el formulario es un día (YYYY-MM-DD, el del campo de fecha) en la hora
 * local; la base guarda un instante. Pasar de uno al otro sin correrse un día por la zona horaria.
 */
const two = (n: number) => String(n).padStart(2, '0')

/** El día local de un instante ISO. */
export function toDay(iso: string): string {
  const at = new Date(iso)
  return `${at.getFullYear()}-${two(at.getMonth() + 1)}-${two(at.getDate())}`
}

/** La medianoche local de un día, como instante ISO. */
export function fromDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toISOString()
}

export function sameDay(day: string, iso: string): boolean {
  return toDay(iso) === day
}
