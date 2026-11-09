/**
 * Cómo entra una pieza (`Media`) en su marco. Una captura es una pantalla: recortarla para llenar un
 * marco ajeno corta texto y bordes de la obra. Si la pieza tiene (casi) la proporción del marco lo
 * llena (`object-cover` desde arriba, donde una captura tiene su cabecera: el recorte no se nota); si
 * no, entra entera y centrada sobre el fondo del marco.
 */

/** El marco de las portadas: tarjetas, filas, vista previa, captura que crece y registro. */
export const COVER_RATIO = 16 / 10

/** Cuánto puede diferir la proporción de la pieza de la del marco y seguir llenándolo (4 %). */
const TOLERANCE = 0.04

export function fitClass(media: { width: number, height: number }, frame = COVER_RATIO): string {
  if (!media.width || !media.height) return 'object-cover object-top'
  return Math.abs(media.width / media.height / frame - 1) <= TOLERANCE ? 'object-cover object-top' : 'object-contain'
}
