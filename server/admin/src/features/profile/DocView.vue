<script setup lang="ts">
/**
 * Un documento de Perfil abierto: mientras carga, la forma de lo que viene; si no carga, el motivo y
 * Reintentar; después, el borrador que quedó, lo que hay que revisar, el formulario de hasta 760 px
 * (de solo lectura y con aria-busy mientras guarda) y el pie anclado abajo con el estado del guardado,
 * Descartar y Guardar (Ctrl/⌘S). Sin Nuevo, Duplicar ni Eliminar: los documentos son dos y fijos.
 */
import type { DocKey } from '@shared/docSchema'
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'
import ErrorState from '../../ui/ErrorState.vue'
import Skeleton from '../../ui/Skeleton.vue'
import DraftNotice from '../collections/DraftNotice.vue'
import ErrorSummary from '../collections/ErrorSummary.vue'
import SaveState from '../collections/SaveState.vue'
import { collections } from '../collections/dict'
import AboutForm from './AboutForm.vue'
import ContactForm from './ContactForm.vue'
import { profile } from './dict'
import { useDocEditor } from './useDocEditor'

const props = defineProps<{ docKey: DocKey }>()

const editor = useDocEditor(props.docKey)
const title = profile.docs[props.docKey].title
const pad = 'px-4 md:px-10 xl:px-16'
</script>

<template>
  <div class="flex flex-1 flex-col">
    <div :class="pad" class="flex-1 pt-10 pb-20">
      <Skeleton v-if="editor.loading.value" variant="form" :count="5" />
      <ErrorState
        v-else-if="editor.loadError.value"
        :message="editor.loadError.value.message"
        @retry="editor.load()"
      />
      <template v-else-if="editor.ready.value">
        <div v-if="editor.draftOffer.value || editor.errors.issues.value.length" class="mb-10 grid gap-4">
          <DraftNotice
            v-if="editor.draftOffer.value"
            :offer="editor.draftOffer.value"
            @recover="editor.recoverDraft()"
            @dismiss="editor.dismissDraft()"
          />
          <ErrorSummary
            v-if="editor.errors.issues.value.length"
            :issues="editor.errors.issues.value"
            @go="editor.errors.focusField($event)"
          />
        </div>
        <form
          novalidate
          :aria-label="collections.editor.form(title)"
          :aria-busy="editor.busy.value"
          class="max-w-[760px]"
          @submit.prevent="editor.save()"
        >
          <AboutForm v-if="docKey === 'about'" :editor="editor" />
          <ContactForm v-else :editor="editor" />
        </form>
      </template>
    </div>

    <footer
      v-if="editor.ready.value"
      :class="pad"
      class="sticky bottom-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule bg-bg py-3.5"
    >
      <SaveState :status="editor.status.value" :saved-at="editor.savedAt.value" />
      <div class="ml-auto flex items-center gap-2">
        <Button variant="ghost" :disabled="!editor.dirty.value || editor.busy.value" @click="editor.discard()">
          {{ ui.actions.discard }}
        </Button>
        <Button
          variant="primary"
          size="lg"
          shortcut="mod+s"
          :loading="editor.busy.value"
          :loading-label="collections.save.savingLabel"
          @click="editor.save()"
        >
          {{ ui.actions.save }}
        </Button>
      </div>
    </footer>
  </div>
</template>
