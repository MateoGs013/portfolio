/**
 * Los pedidos de Publicaciones a /api/admin/content/*, con el contrato de @shared/contentContracts.
 * Todo pasa por Eros salvo «Publicar en el blog», que además escribe un artículo en borrador en la
 * base. El carrusel se abre en un iframe o en otra pestaña con un ticket (sin la clave).
 */
import type {
  BlogDraft,
  ContentPost,
  DispatchResult,
  GenerateRequest,
  PostResult,
  PostStatus,
  PublishChannel,
} from '@shared/contentContracts'
import { api, type RequestOptions } from '../../api/client'

const path = (id: string, rest = '') => `/content/posts/${encodeURIComponent(id)}${rest}`
const carousel = (id: string) => `/content/carousel/${encodeURIComponent(id)}`

export const contentApi = {
  posts: (options?: RequestOptions) => api.get<ContentPost[]>('/content/posts', options),
  post: (id: string, options?: RequestOptions) => api.get<ContentPost>(path(id), options),
  generate: (request: GenerateRequest) => api.post<PostResult>('/content/generate', request),
  setStatus: (id: string, status: PostStatus) => api.patch<PostResult>(path(id, '/status'), { status }),
  remove: (id: string) => api.delete<{ ok: true }>(path(id)),
  publish: (id: string, channel: PublishChannel) => api.post<DispatchResult>(path(id, '/publish'), { channel }),
  publishToBlog: (id: string) => api.post<BlogDraft>(path(id, '/publish-to-blog')),
}

/**
 * La dirección del carrusel con un ticket de una hora: `print` suma auto_print para que la pestaña
 * abra el diálogo de impresión apenas carga.
 */
export async function carouselUrl(id: string, mode: 'view' | 'print' = 'view'): Promise<string> {
  const { ticket } = await api.post<{ ticket: string }>(`${carousel(id)}/ticket`)
  const params = new URLSearchParams({ ticket })
  if (mode === 'print') params.set('auto_print', 'true')
  return `/api/admin${carousel(id)}/html?${params.toString()}`
}
