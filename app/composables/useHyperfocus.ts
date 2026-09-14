// Composable para Modo Hiperfoco (Zen / Ultraminimalista)
// Elimina todo ruido ornamental, retícula y marcas para ofrecer lectura técnica concentrada.

const hyperfocusState = ref(false)

export function useHyperfocus() {
  function toggleHyperfocus() {
    hyperfocusState.value = !hyperfocusState.value
    if (import.meta.client) {
      localStorage.setItem('portfolio-hyperfocus', String(hyperfocusState.value))
      if (hyperfocusState.value) {
        document.documentElement.setAttribute('data-hyperfocus', 'true')
      }
      else {
        document.documentElement.removeAttribute('data-hyperfocus')
      }
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('portfolio-hyperfocus')
      if (saved === 'true') {
        hyperfocusState.value = true
        document.documentElement.setAttribute('data-hyperfocus', 'true')
      }
    }
  })

  return {
    isHyperfocus: hyperfocusState,
    toggleHyperfocus,
  }
}
