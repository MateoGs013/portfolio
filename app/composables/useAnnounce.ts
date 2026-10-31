/**
 * La única región `aria-live` del sitio (la dibuja layouts/default.vue). Copiar el email, cambiar el
 * tema, el sonido, los atajos o el Hiperfoco se anuncian por acá, nunca con una región propia.
 */
export function useAnnounce() {
  const message = useState('site-announce', () => '')

  /** Vacía la región y escribe en el cuadro siguiente: así se repite un anuncio igual al anterior. */
  function announce(text: string) {
    message.value = ''
    if (import.meta.client) requestAnimationFrame(() => { message.value = text })
  }

  return { message: readonly(message), announce }
}
