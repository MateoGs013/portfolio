<script setup lang="ts">
/**
 * El editor de cualquier colección, una cosa por pantalla (dirección elegida en la demo):
 * - encabezado con «← Empresas», el título humano en display (viaja desde la fila tocada), la
 *   publicación (slot), «Ver en el sitio» y «Más acciones»;
 * - las secciones como pestañas atadas a la ruta y el formulario de hasta 760 px, de solo lectura y
 *   con aria-busy mientras guarda;
 * - el pie anclado abajo con el estado del guardado, Descartar y Guardar (Ctrl/⌘S).
 * Mientras carga, la forma de lo que viene; si no carga, el motivo y Reintentar, sin nada que guardar.
 */
import type { DeleteResult } from '@shared/adminContracts'
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { EditorView } from '../../composables/useEditor'
import { phrases } from '../../models/labels'
import { TRAVEL_NAME } from '../../shell/transition'
import { useRecordTitle } from '../../shell/title'
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'
import ErrorState from '../../ui/ErrorState.vue'
import Icon from '../../ui/Icon.vue'
import Menu, { type MenuItem } from '../../ui/Menu.vue'
import Skeleton from '../../ui/Skeleton.vue'
import DeleteDialog from './DeleteDialog.vue'
import DraftNotice from './DraftNotice.vue'
import ErrorSummary from './ErrorSummary.vue'
import SaveState from './SaveState.vue'
import SectionTabs from './SectionTabs.vue'
import { collections } from './dict'

const props = withDefaults(defineProps<{
  editor: EditorView
  /** Acciones propias del área en «Más acciones» (Eliminar se suma solo si `removable`). */
  actions?: MenuItem[]
  removable?: boolean
  /** Cifras al lado de cada sección («Relato 4»). */
  counts?: Readonly<Record<string, number>>
}>(), { actions: () => [], removable: true })

const emit = defineEmits<{ action: [id: string], deleted: [result: DeleteResult | null] }>()

const router = useRouter()
const model = computed(() => props.editor.model)
const say = computed(() => phrases(model.value.noun))
const back = computed(() => model.value.noun.many.charAt(0).toLocaleUpperCase('es') + model.value.noun.many.slice(1))

const title = computed(() => {
  const { form, record, ready } = props.editor
  if (ready.value) return model.value.formTitle(form.value).trim() || (record.value ? model.value.title(record.value) : say.value.create)
  return record.value ? model.value.title(record.value) : props.editor.isNew.value ? say.value.create : ''
})
useRecordTitle(title)

const publicUrl = computed(() => {
  const record = props.editor.record.value
  return record && model.value.publicUrl ? model.value.publicUrl(record) : null
})

const removing = ref(false)
const menu = computed<MenuItem[]>(() => [
  ...props.actions,
  ...(props.removable && props.editor.record.value ? [{ id: 'remove', label: say.value.remove, icon: 'trash' as const, danger: true }] : []),
])

function onMenu(id: string): void {
  if (id === 'remove') removing.value = true
  else emit('action', id)
}

function onDeleted(result: DeleteResult | null): void {
  // El registro ya no existe: lo escrito se olvida para que salir no pregunte por él.
  props.editor.forget()
  emit('deleted', result)
  void router.push(model.value.routes.list)
}

const pad = 'px-4 md:px-10 xl:px-16'
</script>

<template>
  <section class="flex min-h-full flex-col">
    <header :class="pad" class="pt-8 md:pt-9">
      <RouterLink
        :to="model.routes.list"
        class="inline-flex items-center gap-2 rounded-control text-row font-[420] text-faint no-underline transition-colors duration-120 ease-e hover:text-ink"
      >
        <Icon name="arrow-left" :size="14" />
        {{ back }}
      </RouterLink>
      <div class="mt-3.5 flex max-w-[1080px] flex-wrap items-end gap-x-6 gap-y-4">
        <h1
          class="m-0 min-w-0 flex-[1_1_28rem] animate-rise text-heading text-balance wrap-break-word"
          :style="{ viewTransitionName: TRAVEL_NAME }"
        >
          {{ title || ui.states.loading }}
        </h1>
        <div v-if="editor.ready.value" class="flex flex-wrap items-center gap-2 pb-1">
          <slot name="publish" />
          <Button v-if="publicUrl" variant="ghost" :href="publicUrl" external>
            {{ collections.editor.viewSite }}
          </Button>
          <Menu v-if="menu.length" :items="menu" @select="onMenu" />
        </div>
      </div>
    </header>

    <div :class="pad" class="flex-1 pt-8.5 pb-16">
      <Skeleton v-if="editor.loading.value" variant="form" :count="4" />
      <ErrorState
        v-else-if="editor.loadError.value"
        :message="editor.loadError.value.message"
        :retry="editor.loadError.value.status !== 404"
        @retry="editor.load()"
      >
        <Button :href="router.resolve(model.routes.list).href">
          {{ back }}
        </Button>
      </ErrorState>
      <template v-else-if="editor.ready.value">
        <div v-if="editor.draftOffer.value || editor.errors.issues.value.length" class="mb-9 grid gap-4">
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
          class="max-w-[1080px]"
          @submit.prevent="editor.save()"
        >
          <SectionTabs
            :sections="editor.section.sections.value"
            :current="editor.section.current.value"
            :errors="editor.errors.sectionsWithErrors.value"
            :changed="editor.changedSections.value"
            :counts="counts"
            @go="editor.section.go($event)"
          >
            <div class="max-w-[760px] pt-10">
              <slot :section="editor.section.current.value" :busy="editor.busy.value" />
            </div>
          </SectionTabs>
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

    <DeleteDialog
      v-if="editor.record.value"
      v-model:open="removing"
      :model="model"
      :record="editor.record.value"
      @deleted="onDeleted"
    />
  </section>
</template>
