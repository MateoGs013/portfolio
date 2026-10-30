// Formulario Especializado: DocsForm (AdmDocsForm)
// Editor de páginas estáticas y bloques de texto (about, contact).
// Cada bloque es un DocField: el español en `value` y el inglés en `en`. En modo EN, cada bloque de
// texto, url o lista muestra su español de referencia y un input para el inglés; vaciarlo lo borra.

import { store } from '../../store.js'
import { DOC_EN_TYPES, asText } from '../../translations.js'
import { EnField } from './EnField.js'

const NL = '\n'

/** Al cambiar el tipo, el valor pasa de texto a lista o al revés sin perderse. */
function convert(value, toList) {
  if (value === undefined) return undefined
  if (toList) return Array.isArray(value) ? value : String(value || '').split(NL).map(x => x.trim()).filter(Boolean)
  return Array.isArray(value) ? value.join(NL) : value
}

export const DocsForm = {
  name: 'AdmDocsForm',
  components: { EnField },
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

    function changeType(b, type) {
      b.type = type
      b.value = convert(b.value, type === 'list')
      if (b.en !== undefined) b.en = convert(b.en, type === 'list')
      store.checkDirty()
    }

    function setValue(b, raw) {
      b.value = b.type === 'list' ? raw.split(NL) : raw
      store.checkDirty()
    }

    /** Inglés del bloque: una lista se edita un ítem por renglón; '' (o lista vacía) lo borra al guardar. */
    function setEn(b, raw) {
      b.en = b.type === 'list' ? raw.split(NL) : raw
    }

    function removeBlock(idx) {
      if (!store.form || !Array.isArray(store.form.fields)) return
      store.form.fields.splice(idx, 1)
      store.checkDirty()
    }

    return {
      store,
      addBlock,
      changeType,
      setValue,
      setEn,
      removeBlock,
      shown: b => (Array.isArray(b.value) ? b.value.join(NL) : b.value),
      asText,
      hasEn: b => DOC_EN_TYPES.includes(b.type),
      enRows: b => (b.type === 'list' ? 4 : b.type === 'string' || b.type === 'url' ? 0 : 3),
      singleLine: type => type === 'string' || type === 'url' || type === 'email',
    }
  },
  template: `
    <div class="max-w-2xl space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="block">
          <span class="field-label">Clave del documento (identificador) *</span>
          <input
            type="text"
            v-model="store.form.key"
            :readonly="!store.isNew"
            placeholder="about"
            class="text-input font-mono-code"
          />
          <span class="field-hint">Clave única del sistema (about, contact).</span>
        </label>
        <label class="block">
          <span class="field-label">Título de la página *</span>
          <input
            type="text"
            v-model="store.form.title"
            @input="store.checkDirty()"
            placeholder="Sobre Mí"
            class="text-input"
          />
          <span class="field-hint">Título principal de la sección.</span>
        </label>
      </div>

      <!-- Inglés de cada bloque, con el español de referencia -->
      <div v-if="store.editingEn" class="space-y-3 pt-2">
        <div>
          <h4 class="text-xs font-bold text-white uppercase font-mono-code">Bloques en inglés ({{ (store.form.fields || []).length }})</h4>
          <p class="text-[11px] text-zinc-400">Un bloque vacío se publica en español. Email y otros datos sin texto son iguales en los dos idiomas.</p>
        </div>
        <div
          v-for="(b, idx) in (store.form.fields || [])"
          :key="idx"
          class="p-3.5 bg-[#0d0e12] border border-white/10 rounded"
        >
          <EnField
            v-if="hasEn(b)"
            :id="'doc-en-' + idx"
            :label="b.name"
            :es="b.value"
            :model-value="asText(b.en)"
            @update:model-value="setEn(b, $event)"
            :rows="enRows(b)"
            :type="b.type === 'url' ? 'url' : 'text'"
            :hint="b.type === 'list' ? 'Un ítem por renglón.' : ''"
          />
          <div v-else class="space-y-1">
            <span class="field-label !mb-0">{{ b.name }}</span>
            <p class="text-[11.5px] text-zinc-300 font-mono-code break-words">{{ shown(b) }}</p>
            <p class="text-[11px] text-zinc-400">No se traduce ({{ b.type }}): es el mismo valor en los dos idiomas.</p>
          </div>
        </div>
      </div>

      <!-- Subfilas de Bloques de Contenido -->
      <div v-else class="space-y-3 pt-2">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold text-white uppercase font-mono-code">Bloques de contenido ({{ (store.form.fields || []).length }})</h4>
            <p class="text-[11px] text-zinc-400">Secciones de texto editables para esta página. El inglés de cada bloque se conserva al guardar.</p>
          </div>
          <button
            type="button"
            @click="addBlock"
            class="btn-secondary !h-[28px] !text-[11px] cursor-pointer"
          >
            + Agregar bloque
          </button>
        </div>

        <div
          v-for="(b, idx) in (store.form.fields || [])"
          :key="idx"
          class="p-3.5 bg-[#0d0e12] border border-white/10 rounded space-y-2"
        >
          <div class="flex flex-wrap items-center gap-2">
            <input
              type="text"
              v-model="b.name"
              @input="store.checkDirty()"
              placeholder="Nombre (ej: bio)"
              :aria-label="'Nombre del bloque ' + (idx + 1)"
              class="text-input !h-[30px] w-40 font-mono-code"
              title="Identificador del bloque"
            />
            <select
              :value="b.type"
              @change="changeType(b, $event.target.value)"
              :aria-label="'Tipo del bloque ' + (b.name || idx + 1)"
              class="select-input !h-[30px] w-32 font-mono-code"
            >
              <option value="text">text</option>
              <option value="string">string</option>
              <option value="markdown">markdown</option>
              <option value="url">url</option>
              <option value="email">email</option>
              <option value="list">list (uno por renglón)</option>
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
            <span v-if="b.en !== undefined" class="text-[10px] font-mono-code px-1.5 rounded border border-white/10 text-zinc-400" title="Tiene traducción al inglés">EN</span>
            <button
              type="button"
              @click="removeBlock(idx)"
              class="icon-btn danger"
              :aria-label="'Quitar el bloque ' + (b.name || idx + 1)"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <input
            v-if="singleLine(b.type)"
            :type="b.type === 'string' ? 'text' : b.type"
            :value="b.value"
            @input="setValue(b, $event.target.value)"
            :aria-label="'Contenido de ' + (b.name || 'el bloque')"
            class="text-input font-mono-code"
          />
          <textarea
            v-else
            :value="shown(b)"
            @input="setValue(b, $event.target.value)"
            rows="4"
            placeholder="Contenido textual del bloque..."
            :aria-label="'Contenido de ' + (b.name || 'el bloque')"
            class="textarea-input"
          ></textarea>
        </div>
      </div>
    </div>
  `,
}
