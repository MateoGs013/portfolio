/**
 * Diccionario de la interfaz del admin: todo texto fijo de los componentes base sale de acá, en
 * español claro y en minúscula de oración. Los rótulos de los datos (estados, tipos, campos) vienen
 * de la API (/meta); esto es solo la herramienta.
 */
export const ui = {
  app: {
    name: 'Mateo Sonzogni',
    area: 'Administración',
    title: 'Admin',
  },
  actions: {
    cancel: 'Cancelar',
    close: 'Cerrar',
    confirm: 'Confirmar',
    retry: 'Reintentar',
    save: 'Guardar',
    discard: 'Descartar',
    copy: 'Copiar',
    copied: 'Copiado',
    more: 'Más acciones',
    dismiss: 'Cerrar aviso',
  },
  states: {
    loading: 'Cargando…',
    loadingLabel: 'Cargando contenido',
    errorTitle: 'No se pudo cargar',
    emptyTitle: 'Todavía no hay nada acá',
  },
  field: {
    required: 'Obligatorio',
    optional: 'Opcional',
    counter: (count: number, max: number) => `${count} de ${max}`,
    over: (extra: number) => `${extra} de más`,
    selectPlaceholder: 'Elegí una opción',
  },
  tabs: {
    markError: ', con errores',
    markChanged: ', con cambios sin guardar',
  },
  toasts: {
    region: 'Avisos',
  },
  confirm: {
    impactTitle: 'Esto afecta a:',
    destructiveHint: 'No se puede deshacer.',
  },
  copy: {
    ok: 'Copiado al portapapeles',
    error: 'No se pudo copiar. Seleccioná el texto y copialo a mano.',
  },
} as const
