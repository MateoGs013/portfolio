/**
 * Las publicaciones de Eros, una sola copia para la lista, el registro y la paleta. Cada cambio
 * (estado, borrar, despachar) va a Eros y la lista se actualiza con lo que respondió; nada cambia
 * acá si Eros no lo hizo.
 */
import type { ContentPost, PostStatus, PublishChannel } from '@shared/contentContracts'
import { contentApi } from './api'
import { erosList, isSampleRow, newestFirst } from './erosList'

export const posts = erosList<ContentPost>(
  () => contentApi.posts(),
  newestFirst(post => post.created_at ?? post.updated_at),
)

/** Se puede cambiar: Eros respondió y no es la muestra. */
export function canChangePost(post: ContentPost): boolean {
  return !isSampleRow(post) && !posts.offline.value
}

export async function changePostStatus(post: ContentPost, status: PostStatus): Promise<ContentPost> {
  const result = await contentApi.setStatus(post.id, status)
  const next: ContentPost = { ...post, ...(result.post ?? {}), status: result.post?.status ?? status }
  posts.upsert(next)
  return next
}

/** La borra en Eros. Quitarla de la lista (posts.drop) queda para quien la borra, después de salir del registro. */
export async function removePost(post: ContentPost): Promise<void> {
  await contentApi.remove(post.id)
}

/**
 * n8n la despachó: se vuelve a leer de Eros para mostrar su estado real. Si esa lectura falla, queda
 * la hora que dio el despacho (sin inventar una si no la dio).
 */
export async function dispatchPost(post: ContentPost, channel: PublishChannel): Promise<ContentPost> {
  const result = await contentApi.publish(post.id, channel)
  const fresh = await contentApi.post(post.id).catch(() => null)
  const next: ContentPost = fresh ?? { ...post, dispatched_at: result.dispatched_at ?? post.dispatched_at }
  posts.upsert(next)
  return next
}

/** Lee la publicación de Eros (GET /content/posts/:id) y la deja al día en la lista. */
export async function refreshPost(id: string): Promise<ContentPost> {
  const fresh = await contentApi.post(id)
  posts.upsert(fresh)
  return fresh
}
