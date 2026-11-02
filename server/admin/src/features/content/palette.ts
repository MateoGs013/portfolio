/**
 * Publicaciones en la paleta Ctrl/⌘K: «Generar una publicación» se suma al grupo Acciones la primera
 * vez que se entra a Publicaciones o a Tendencias, y queda desde ahí. Abre el formulario
 * (#/busqueda/publicaciones?generar=1), que sin Eros dice por qué no se puede.
 */
import { registerPaletteSource } from '../../composables/usePalette'
import { content } from './dict'

export function registerContentPalette(): void {
  registerPaletteSource({
    id: 'content-actions',
    group: 'actions',
    items: () => [
      {
        id: 'generate-post',
        label: content.generate,
        keywords: 'eros linkedin hilo devto carrusel publicacion',
        to: { path: '/busqueda/publicaciones', query: { generar: '1' } },
      },
    ],
  })
}
