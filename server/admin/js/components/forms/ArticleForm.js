// Formulario Especializado: ArticleForm (AdmArticleForm)
// Editor de Artículos Técnicos del Blog del Portafolio (Markdown, SEO, Vínculo con Proyectos y Stack)

import { store } from '../../store.js'

const { computed } = window.Vue

export const ArticleForm = {
  name: 'AdmArticleForm',
  setup() {
    const isLocked = computed(() => store.slugLocked && store.isNew)

    function updateTitle(val) {
      if (!store.form) return
      store.form.title = val
      if (store.slugLocked && store.isNew) {
        store.form.slug = val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }
      store.checkDirty()
    }

    function toggleTech(id) {
      if (!store.form) return
      if (!Array.isArray(store.form.techIds)) store.form.techIds = []
      const numId = Number(id)
      const idx = store.form.techIds.indexOf(numId)
      if (idx === -1) {
        store.form.techIds.push(numId)
      } else {
        store.form.techIds.splice(idx, 1)
      }
      store.checkDirty()
    }

    function hasTech(id) {
      return (store.form?.techIds || []).includes(Number(id))
    }

    return {
      store,
      isLocked,
      updateTitle,
      toggleTech,
      hasTech,
    }
  },
  template: `
    <div class="max-w-4xl space-y-6">
      <!-- 1. IDENTIFICADOR Y TÍTULO -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="field-label !mb-0">Título del Artículo *</label>
            <span class="text-[10px] font-mono-code text-zinc-500">{{ (store.form.title || '').length }} chars</span>
          </div>
          <input
            type="text"
            :value="store.form.title"
            @input="updateTitle($event.target.value)"
            placeholder="Arquitectura RAG con PostgreSQL y pgvector..."
            class="text-input"
          />
          <span class="field-hint">Título principal visible en portada y listados.</span>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="field-label !mb-0">Slug URL *</label>
            <button
              v-if="store.isNew"
              type="button"
              @click="store.slugLocked = !store.slugLocked"
              class="text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-colors cursor-pointer"
              :class="store.slugLocked ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' : 'text-zinc-400 bg-white/5 border-white/10 hover:text-white'"
            >
              {{ store.slugLocked ? '[BLOQUEADO] Auto' : '[MANUAL] Desbloqueado' }}
            </button>
          </div>
          <input
            type="text"
            v-model="store.form.slug"
            :readonly="store.slugLocked && store.isNew"
            @input="store.checkDirty()"
            placeholder="arquitectura-rag-postgresql"
            class="text-input font-mono-code"
            :class="(store.slugLocked && store.isNew) && '!bg-[#0c0d11] !text-zinc-400 !cursor-not-allowed'"
          />
          <span class="field-hint">Ruta canónica: mateogs.tech/blog/{{ store.form.slug || 'slug' }}</span>
        </div>
      </div>

      <!-- 2. RESUMEN / BAJADA -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="field-label !mb-0">Resumen Ejecutivo (Deck / Meta Description) *</label>
          <span class="text-[10px] font-mono-code text-zinc-500">{{ (store.form.summary || '').length }} chars</span>
        </div>
        <textarea
          rows="2"
          v-model="store.form.summary"
          @input="store.checkDirty()"
          placeholder="Desglose técnico de la implementación de búsqueda semántica híbrida con scoring BM25 y embeddings vectoriales..."
          class="textarea-input"
        ></textarea>
        <span class="field-hint">Aparece en la tarjeta del blog y como meta-description para indexación técnica.</span>
      </div>

      <!-- 3. METADATOS EDITORIALES Y TIEMPO DE LECTURA -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[#0c0d10] border border-white/10 rounded-lg">
        <div>
          <label class="field-label">Estado de Publicación</label>
          <select
            v-model="store.form.status"
            @change="store.checkDirty()"
            class="select-input font-mono-code"
          >
            <option value="PUBLISHED">PUBLISHED (Público)</option>
            <option value="DRAFT">DRAFT (Borrador)</option>
            <option value="ARCHIVED">ARCHIVED (Oculto)</option>
          </select>
        </div>

        <div>
          <label class="field-label">Fecha de Publicación</label>
          <input
            type="datetime-local"
            v-model="store.form.publishedAt"
            @input="store.checkDirty()"
            class="text-input font-mono-code text-xs"
          />
        </div>

        <div>
          <label class="field-label">Lectura Estimada (Min)</label>
          <input
            type="number"
            min="1"
            max="120"
            v-model="store.form.readingTimeMin"
            @input="store.checkDirty()"
            class="text-input font-mono-code"
          />
        </div>

        <div>
          <label class="field-label">Orden / Prioridad</label>
          <input
            type="number"
            v-model="store.form.sortOrder"
            @input="store.checkDirty()"
            class="text-input font-mono-code"
          />
        </div>
      </div>

      <!-- 4. VÍNCULOS: PROYECTO RELACIONADO & CANONICAL -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="field-label">Proyecto del Portafolio Vinculado (Opcional)</label>
          <select
            v-model="store.form.projectId"
            @change="store.checkDirty()"
            class="select-input font-mono-code"
          >
            <option :value="null">Sin proyecto vinculado</option>
            <option
              v-for="p in store.meta.options.projects"
              :key="p.id"
              :value="p.id"
            >
              {{ p.title }} ({{ p.slug }})
            </option>
          </select>
          <span class="field-hint">Vincula el artículo con el caso de estudio correspondiente.</span>
        </div>

        <div>
          <label class="field-label">URL Canónica Externa (Dev.to / Medium / Personal)</label>
          <input
            type="url"
            v-model="store.form.canonicalUrl"
            @input="store.checkDirty()"
            placeholder="https://dev.to/mateogs/..."
            class="text-input font-mono-code text-xs"
          />
          <span class="field-hint">Si fue publicado previamente en otra plataforma para SEO rel=canonical.</span>
        </div>
      </div>

      <!-- 5. IMAGEN DE PORTADA & DESTACADO -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div class="md:col-span-2">
          <label class="field-label">URL Imagen de Portada (Cover)</label>
          <input
            type="text"
            v-model="store.form.coverImage"
            @input="store.checkDirty()"
            placeholder="/images/blog/rag-architecture.png o URL externa"
            class="text-input font-mono-code text-xs"
          />
        </div>

        <div class="pt-5">
          <label class="flex items-center gap-2 cursor-pointer text-xs font-mono-code">
            <input
              type="checkbox"
              v-model="store.form.featured"
              @change="store.checkDirty()"
              class="rounded bg-[#121318] border-white/20 text-[#ff3e00] focus:ring-0"
            />
            <span class="text-zinc-200">Destacar en Portada del Blog</span>
          </label>
        </div>
      </div>

      <!-- 6. CHIPS DE TECNOLOGÍAS ASOCIADAS -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="field-label !mb-0">
            Tecnologías del Stack Asociadas ({{ (store.form.techIds || []).length }})
          </label>
          <span class="text-[10px] font-mono-code text-zinc-500">Seleccioná las etiquetas técnicas</span>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap p-3 bg-[#0c0d10] border border-white/10 rounded-lg max-h-40 overflow-y-auto">
          <button
            v-for="t in store.allTechs"
            :key="t.id"
            type="button"
            @click="toggleTech(t.id)"
            class="px-2 py-0.5 rounded text-[10.5px] font-mono-code border transition-colors cursor-pointer"
            :class="hasTech(t.id) ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-bold' : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'"
          >
            {{ hasTech(t.id) ? '[✓]' : '[+]' }} {{ t.name }}
          </button>
        </div>
      </div>

      <!-- 7. CONTENIDO MARKDOWN PRINCIPAL -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="field-label !mb-0">Contenido Técnico del Artículo (Markdown) *</label>
          <span class="text-[10px] font-mono-code text-zinc-500">
            {{ (store.form.content || '').length }} caracteres · Soporta GFM, tablas y bloques de código
          </span>
        </div>
        <textarea
          rows="18"
          v-model="store.form.content"
          @input="store.checkDirty()"
          placeholder="## Introducción al Problema&#10;&#10;En entornos productivos con alta cardinalidad..."
          class="textarea-input font-mono-code text-xs leading-relaxed"
        ></textarea>
        <span class="field-hint">
          El artículo se renderiza dinámicamente con resaltado de sintaxis Shiki y KaTeX en /blog/{{ store.form.slug || 'articulo' }}.
        </span>
      </div>
    </div>
  `,
}
