// Formulario Especializado: DocsForm (AdmDocsForm)
// Editor de páginas estáticas y bloques de texto (about, contact)

import { store } from '../../store.js'

export const DocsForm = {
  name: 'AdmDocsForm',
  setup() {
    function addBlock() {
      if (!store.form) return
      if (!Array.isArray(store.form.fields)) store.form.fields = []
      store.form.fields.push({
        name: `bloque_${store.form.fields.length + 1}`,
        type: 'text',
        value: '',
        wide: false,
      })
      store.checkDirty()
    }

    function removeBlock(idx) {
      if (!store.form || !Array.isArray(store.form.fields)) return
      store.form.fields.splice(idx, 1)
      store.checkDirty()
    }

    return {
      store,
      addBlock,
      removeBlock,
    }
  },
  template: `
    <div class="max-w-2xl space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="field-label">Clave del Documento (Identificador) *</label>
          <input
            type="text"
            v-model="store.form.key"
            :readonly="!store.isNew"
            placeholder="about"
            class="text-input font-mono-code"
          />
          <span class="field-hint">Clave única del sistema (about, contact).</span>
        </div>
        <div>
          <label class="field-label">Título de la Página *</label>
          <input
            type="text"
            v-model="store.form.title"
            @input="store.checkDirty()"
            placeholder="Sobre Mí"
            class="text-input"
          />
          <span class="field-hint">Título principal de la sección.</span>
        </div>
      </div>

      <!-- Subfilas de Bloques de Contenido -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold text-white uppercase font-mono-code">Bloques de Contenido ({{ (store.form.fields || []).length }})</h4>
            <p class="text-[11px] text-zinc-400">Secciones de texto y biografías editables para esta página.</p>
          </div>
          <button
            type="button"
            @click="addBlock"
            class="btn-secondary !h-[28px] !text-[11px] cursor-pointer"
          >
            + Agregar Bloque
          </button>
        </div>

        <div
          v-for="(b, idx) in (store.form.fields || [])"
          :key="idx"
          class="p-3.5 bg-[#0d0e12] border border-white/10 rounded space-y-2"
        >
          <div class="flex items-center gap-2">
            <input
              type="text"
              v-model="b.name"
              @input="store.checkDirty()"
              placeholder="Nombre (ej: bio)"
              class="text-input !h-[30px] w-40 font-mono-code"
              title="Identificador del bloque"
            />
            <select
              v-model="b.type"
              @change="store.checkDirty()"
              class="select-input !h-[30px] w-32 font-mono-code"
            >
              <option value="text">text</option>
              <option value="string">string</option>
              <option value="markdown">markdown</option>
            </select>
            <label class="text-[11px] text-zinc-400 flex items-center gap-1.5 ml-auto cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="b.wide"
                @change="store.checkDirty()"
                class="accent-[#ff3e00]"
              />
              Destacado (Wide)
            </label>
            <button
              type="button"
              @click="removeBlock(idx)"
              class="text-zinc-500 hover:text-red-400 px-2 py-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <textarea
            v-model="b.value"
            @input="store.checkDirty()"
            rows="4"
            placeholder="Contenido textual del bloque..."
            class="textarea-input"
          ></textarea>
        </div>
      </div>
    </div>
  `,
}
