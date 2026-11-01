/**
 * Lo que el editor abierto les cuenta a sus campos (BilingualField, SlugField y los de cada área) sin
 * pasarlo de mano en mano: si está guardando (los campos quedan de solo lectura), el error de cada
 * ruta y si el registro es nuevo.
 */
import { inject, type ComputedRef, type InjectionKey } from 'vue'

export interface EditorContext {
  /** Guardando este registro: el formulario es de solo lectura y avisa aria-busy. */
  busy: ComputedRef<boolean>
  isNew: ComputedRef<boolean>
  messageFor: (path: string) => string | null
}

export const editorKey: InjectionKey<EditorContext> = Symbol('editor')

/** El editor de alrededor, o null si el campo se usa suelto (Muestrario, un diálogo). */
export function useEditorContext(): EditorContext | null {
  return inject(editorKey, null)
}
