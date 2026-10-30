/** Cabecera, pie, paleta, atajos y página de error. F1 deja lo mínimo; dueño desde la ola 4: F3. */
import type { DictEntry } from './index'

export default {
  'nav.label': { es: 'Navegación principal', en: 'Main navigation' },
  'nav.home': { es: 'Inicio', en: 'Home' },
  'nav.work': { es: 'Obra', en: 'Work' },
  'nav.about': { es: 'Sobre mí', en: 'About' },
  'nav.contact': { es: 'Contacto', en: 'Contact' },
  'nav.cv': { es: 'CV', en: 'Résumé' },
  'nav.articles': { es: 'Artículos', en: 'Articles' },

  'shell.skip': { es: 'Saltar al contenido', en: 'Skip to content' },
  'shell.lang': { es: 'Idioma', en: 'Language' },
  'shell.theme': { es: 'Tema', en: 'Theme' },
  'shell.theme.dark': { es: 'Oscuro', en: 'Dark' },
  'shell.theme.light': { es: 'Claro', en: 'Light' },
  'shell.goto': { es: 'Ir a', en: 'Go to' },
  'shell.shortcuts': { es: 'Atajos de una tecla', en: 'Single-key shortcuts' },
  'shell.sound': { es: 'Sonido', en: 'Sound' },
  'shell.email': { es: 'Email', en: 'Email' },
  'shell.copyEmail': { es: 'Copiar email', en: 'Copy email' },
  'shell.copied': { es: 'Copiado', en: 'Copied' },

  'error.404.title': { es: 'Esta página no existe', en: 'This page does not exist' },
  'error.404.body': { es: 'La dirección no lleva a ninguna página publicada.', en: 'The address does not lead to any published page.' },
  'error.503.title': { es: 'El contenido no está disponible', en: 'The content is not available' },
  'error.503.body': { es: 'No se pudo leer la base en este momento. Probá de nuevo en unos minutos.', en: 'The database could not be read right now. Try again in a few minutes.' },
  'error.500.title': { es: 'Algo falló al armar esta página', en: 'Something went wrong building this page' },
  'error.500.body': { es: 'El error quedó registrado. Probá volver al inicio.', en: 'The error was logged. Try going back to home.' },
  'error.home': { es: 'Volver al inicio', en: 'Back to home' },
} satisfies Record<string, DictEntry>
