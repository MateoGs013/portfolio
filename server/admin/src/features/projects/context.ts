/**
 * La obra abierta para sus secciones: el formulario que se edita y lo último guardado (las imágenes
 * se leen de ahí). ProjectEditor lo provee; Lo esencial, Relato, Pasos y los provisorios lo toman sin
 * recibirlo de mano en mano ni mutar props.
 */
import { inject, type InjectionKey, type Ref, type ShallowRef } from 'vue'
import type { AdminProject, ProjectForm } from './types'

export interface ProjectContext {
  form: Ref<ProjectForm>
  record: ShallowRef<AdminProject | null>
}

export const projectKey: InjectionKey<ProjectContext> = Symbol('project')

export function useProject(): ProjectContext {
  const context = inject(projectKey, null)
  if (!context) throw new Error('Las secciones de la obra van dentro de ProjectEditor.')
  return context
}
