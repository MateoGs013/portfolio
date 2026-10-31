// Pestaña Multimedia & Portada: subida de imagen o video (con WebM y póster opcionales),
// tinte calculado en el navegador y la lista de tarjetas de media de la obra.

import { store } from '../../../store.js'
import { api } from '../../../api.js'
import { tintFromBlob, tintFromUrl } from '../../../tint.js'
import { MEDIA_ROLE_LABELS, MEDIA_VIEWPORT_LABELS, fileName, sortMedia } from '../../../fields.js'
import { MediaCard } from './MediaCard.js'

const { computed, reactive, ref } = window.Vue

const ACCEPT_MAIN = 'image/png,image/jpeg,image/webp,video/mp4,video/webm'
const ACCEPT_IMAGE = 'image/png,image/jpeg,image/webp'

const emptyDraft = () => ({ file: null, webm: null, poster: null, alt: '', caption: '', role: 'GALLERY', viewport: 'DESKTOP' })

export const ProjectMedia = {
  name: 'AdmProjectMedia',
  components: { MediaCard },
  setup() {
    const draft = reactive(emptyDraft())
    const busyId = ref(null)
    const inputs = { file: ref(null), webm: ref(null), poster: ref(null) }
    const media = computed(() => store.form?.media || [])
    const isVideo = computed(() => !!draft.file && draft.file.type.startsWith('video/'))

    /** Guarda la lista en el formulario sin marcarlo como pendiente: el server ya la tiene. */
    function commit(rows) {
      const sorted = sortMedia(rows)
      store.applySaved((f) => { f.media = JSON.parse(JSON.stringify(sorted)) })
    }

    /** Después de marcar una portada, la anterior del mismo tipo pasa a la galería (como en el server). */
    /** Igual que el servidor: la portada anterior del mismo tipo pasa al final de la galería. */
    function withRow(row) {
      const rest = media.value.filter(m => m.id !== row.id)
      let next = Math.max(-1, ...rest.filter(m => m.role === 'GALLERY').map(m => m.order)) + 1
      return rest
        .map(m => (row.role === 'COVER' && m.role === 'COVER' && m.kind === row.kind ? { ...m, role: 'GALLERY', order: next++ } : m))
        .concat(row)
    }

    function pick(kind, event) {
      draft[kind] = event.target.files?.[0] || null
      if (kind === 'file' && draft.file && !draft.alt) draft.alt = draft.file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ')
      if (kind === 'file' && !isVideo.value) {
        draft.webm = null
        draft.poster = null
      }
    }

    function resetDraft() {
      Object.assign(draft, emptyDraft())
      for (const r of Object.values(inputs)) if (r.value) r.value.value = ''
    }

    async function upload() {
      if (!draft.file || !store.form?.id) return
      const fd = new FormData()
      fd.append('projectId', String(store.form.id))
      fd.append('alt', draft.alt.trim() || fileName(draft.file.name))
      if (draft.caption.trim()) fd.append('caption', draft.caption.trim())
      fd.append('role', draft.role)
      fd.append('viewport', draft.viewport)
      fd.append('order', String(media.value.filter(m => m.role === draft.role).length))

      store.uploading = true
      try {
        const source = isVideo.value ? draft.poster : draft.file
        const tint = source ? await tintFromBlob(source).catch(() => null) : null
        if (tint) fd.append('tint', tint)
        fd.append('file', draft.file)
        if (isVideo.value && draft.webm) fd.append('webm', draft.webm)
        if (isVideo.value && draft.poster) fd.append('poster', draft.poster)
        const row = await api.uploadMedia(fd)
        commit(withRow(row))
        store.toast('ok', row.kind === 'VIDEO' ? 'Video subido' : 'Imagen subida')
        resetDraft()
      }
      catch (err) {
        store.toast('err', `No se pudo subir: ${err.message}`)
      }
      finally {
        store.uploading = false
      }
    }

    async function run(m, task, okText) {
      busyId.value = m.id
      try {
        await task()
        if (okText) store.toast('ok', okText)
      }
      catch (err) {
        store.toast('err', `No se pudo guardar: ${err.message}`)
      }
      finally {
        busyId.value = null
      }
    }

    const patch = (m, fields) => run(m, async () => commit(withRow(await api.updateMedia(m.id, fields))), 'Cambio guardado')

    const retint = m => run(m, async () => {
      const tint = await tintFromUrl(m.kind === 'VIDEO' ? m.poster : m.src)
      if (!tint) throw new Error('la imagen no tiene píxeles visibles')
      commit(withRow(await api.updateMedia(m.id, { tint })))
    }, 'Tinte recalculado')

    const uploadPoster = (m, file) => run(m, async () => {
      const fd = new FormData()
      const tint = await tintFromBlob(file).catch(() => null)
      if (tint) fd.append('tint', tint)
      fd.append('poster', file)
      commit(withRow(await api.uploadMediaPoster(m.id, fd)))
    }, 'Póster guardado')

    /** Sube o baja dentro de su rol y renumera ese grupo 0..n-1, con PATCH solo donde cambió. */
    const move = (m, dir) => run(m, async () => {
      const group = media.value.filter(x => x.role === m.role)
      const from = group.findIndex(x => x.id === m.id)
      const to = from + dir
      if (to < 0 || to >= group.length) return
      group.splice(to, 0, ...group.splice(from, 1))
      const changed = group.map((x, order) => ({ x, order })).filter(({ x, order }) => x.order !== order)
      const saved = await Promise.all(changed.map(({ x, order }) => api.updateMedia(x.id, { order })))
      const byId = new Map(saved.map(r => [r.id, r]))
      commit(media.value.map(x => byId.get(x.id) || x))
    })

    async function remove(m) {
      const confirmed = await store.requestConfirm({
        title: m.kind === 'VIDEO' ? 'Eliminar video' : 'Eliminar imagen',
        message: '¿Querés quitar esta pieza de la obra?',
        targetName: fileName(m.src),
        detail: 'Se borra el archivo (y su póster o versión WebM, si tiene). Si un paso la usaba, el paso queda sin imagen.',
        confirmText: 'Eliminar',
        kind: 'danger',
      })
      if (!confirmed) return
      await run(m, async () => {
        await api.deleteMedia(m.id)
        commit(media.value.filter(x => x.id !== m.id))
        store.applySaved((f) => {
          for (const s of f.steps || []) if (s.mediaId === m.id) s.mediaId = null
        })
      }, 'Pieza eliminada')
    }

    const siblings = m => media.value.filter(x => x.role === m.role)

    return {
      store, draft, inputs, media, isVideo, busyId, pick, resetDraft, upload, patch, retint, uploadPoster, move, remove,
      ACCEPT_MAIN, ACCEPT_IMAGE,
      roles: computed(() => store.meta.enums.MediaRole || []),
      viewports: computed(() => store.meta.enums.MediaViewport || []),
      roleLabel: r => MEDIA_ROLE_LABELS[r] || r,
      viewportLabel: v => MEDIA_VIEWPORT_LABELS[v] || v,
      canUp: m => siblings(m)[0]?.id !== m.id,
      canDown: m => siblings(m).at(-1)?.id !== m.id,
    }
  },
  template: `
    <div class="space-y-4">
      <div v-if="store.isNew" class="p-4 bg-[#121318] border border-white/10 rounded text-xs text-zinc-400">
        Guardá la obra primero para poder subir imágenes y videos.
      </div>

      <template v-else>
        <section class="p-4 bg-[#0d0e12] border border-white/10 rounded space-y-3" aria-labelledby="media-upload-title">
          <h3 id="media-upload-title" class="text-xs font-bold text-white uppercase font-mono-code">Subir imagen o video</h3>
          <label class="relative block border-2 border-dashed border-white/10 hover:border-[#ff3e00] focus-within:border-[#ff3e00] rounded-lg p-5 text-center cursor-pointer transition-colors">
            <input :ref="inputs.file" type="file" :accept="ACCEPT_MAIN" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" @change="pick('file', $event)" />
            <span class="block text-xs font-semibold text-white">{{ draft.file ? draft.file.name : 'Elegí o arrastrá un archivo' }}</span>
            <span class="block text-[11px] font-mono-code text-zinc-500 mt-1">Imagen WebP, PNG o JPG hasta 10MB · Video MP4 o WebM hasta 20MB</span>
          </label>

          <div v-if="draft.file" class="space-y-3">
            <div v-if="isVideo" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="block">
                <span class="field-label">Póster (primer cuadro)</span>
                <input :ref="inputs.poster" type="file" :accept="ACCEPT_IMAGE" @change="pick('poster', $event)" class="text-[11px] text-zinc-400 w-full" />
                <span class="field-hint">Se muestra con movimiento reducido y da el tinte.</span>
              </label>
              <label class="block">
                <span class="field-label">Versión WebM (opcional)</span>
                <input :ref="inputs.webm" type="file" accept="video/webm" @change="pick('webm', $event)" class="text-[11px] text-zinc-400 w-full" />
              </label>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="block">
                <span class="field-label">Texto alternativo *</span>
                <input type="text" v-model="draft.alt" class="text-input !h-[30px]" maxlength="300" />
              </label>
              <label class="block">
                <span class="field-label">Pie en la galería</span>
                <input type="text" v-model="draft.caption" class="text-input !h-[30px]" maxlength="300" placeholder="Opcional" />
              </label>
              <label class="block">
                <span class="field-label">Rol</span>
                <select v-model="draft.role" class="select-input !h-[30px] font-mono-code">
                  <option v-for="r in roles" :key="r" :value="r">{{ roleLabel(r) }}</option>
                </select>
              </label>
              <label class="block">
                <span class="field-label">Pantalla</span>
                <select v-model="draft.viewport" class="select-input !h-[30px] font-mono-code">
                  <option v-for="v in viewports" :key="v" :value="v">{{ viewportLabel(v) }}</option>
                </select>
              </label>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="btn-primary" :disabled="store.uploading || !draft.alt.trim()" @click="upload">
                {{ store.uploading ? 'Subiendo…' : (isVideo ? 'Subir video' : 'Subir imagen') }}
              </button>
              <button type="button" class="btn-secondary" :disabled="store.uploading" @click="resetDraft">Cancelar</button>
            </div>
          </div>
        </section>

        <p v-if="!media.length" class="text-xs text-zinc-500 font-mono-code">Esta obra todavía no tiene imágenes ni videos.</p>
        <div class="space-y-3">
          <MediaCard
            v-for="m in media"
            :key="m.id"
            :media="m"
            :can-up="canUp(m)"
            :can-down="canDown(m)"
            :busy="busyId === m.id"
            @patch="patch(m, $event)"
            @move="move(m, $event)"
            @remove="remove(m)"
            @retint="retint(m)"
            @poster="uploadPoster(m, $event)"
          />
        </div>
      </template>
    </div>
  `,
}
