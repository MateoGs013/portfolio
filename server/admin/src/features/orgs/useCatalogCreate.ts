/**
 * Abrir el alta de un catálogo desde su lista: el botón, la tecla N y `?nueva=1` (lo que manda la
 * paleta), que abre el diálogo y deja la dirección limpia. Al entrar a cualquiera de los dos catálogos
 * la paleta suma «Nueva empresa» y «Nueva tecnología» y las conserva desde cualquier pantalla.
 */
import { ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { registerPaletteSource } from '../../composables/usePalette'
import { onShortcut } from '../../composables/useShortcuts'
import { catalog } from './dict'

export function registerCatalogPalette(): void {
  registerPaletteSource({
    id: 'catalog-actions',
    group: 'actions',
    items: () => [
      { id: 'new-org', label: catalog.palette.org, keywords: 'crear empresa cliente', to: { path: '/empresas', query: { nueva: '1' } } },
      { id: 'new-tech', label: catalog.palette.tech, keywords: 'crear tecnologia stack', to: { path: '/tecnologias', query: { nueva: '1' } } },
    ],
  })
}

/** Si el diálogo de alta está abierto, mientras dure la lista. */
export function useCatalogCreate(): Ref<boolean> {
  const route = useRoute()
  const router = useRouter()
  const open = ref(false)

  watch(() => route.query['nueva'], (value) => {
    if (value === undefined) return
    open.value = true
    const { nueva: _drop, ...rest } = route.query
    void router.replace({ query: rest })
  }, { immediate: true })

  onShortcut('new', () => {
    open.value = true
  })
  registerCatalogPalette()
  return open
}
