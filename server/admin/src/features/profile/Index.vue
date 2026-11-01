<script setup lang="ts">
/**
 * Perfil (#/perfil/sobre-mi y #/perfil/contacto): una cosa por pantalla. Arriba «Perfil», el documento
 * en display, qué dice de vos en el sitio y las pestañas Sobre mí y Contacto (enlaces, la ruta es el
 * estado); abajo el formulario del documento, que se monta de nuevo al cambiar de pestaña.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRecordTitle } from '../../shell/title'
import Button from '../../ui/Button.vue'
import { collections } from '../collections/dict'
import { DOC_ROUTES, profile, type DocRoute } from './dict'
import DocNav from './DocNav.vue'
import DocView from './DocView.vue'

const route = useRoute()
const current = computed<DocRoute>(() => (route.params['doc'] === 'contacto' ? 'contacto' : 'sobre-mi'))
const key = computed(() => DOC_ROUTES[current.value])
const doc = computed(() => profile.docs[key.value])
useRecordTitle(() => doc.value.title)

const pad = 'px-4 md:px-10 xl:px-16'
</script>

<template>
  <section class="flex min-h-full flex-col">
    <header :class="pad" class="pt-8 md:pt-9">
      <p class="m-0 text-row font-[420] text-faint">
        {{ profile.area }}
      </p>
      <div :key="key" class="mt-3.5 flex max-w-[1080px] flex-wrap items-end gap-x-6 gap-y-4">
        <div class="grid min-w-0 flex-[1_1_28rem] gap-3.5">
          <h1 class="m-0 animate-rise text-heading text-balance">
            {{ doc.title }}
          </h1>
          <p class="m-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:1]">
            {{ doc.lead }}
          </p>
        </div>
        <Button variant="ghost" href="/about" external class="animate-rise stagger [--i:2] max-sm:-ml-3">
          {{ collections.editor.viewSite }}
        </Button>
      </div>
      <DocNav :current="current" class="mt-8" />
    </header>
    <DocView :key="key" :doc-key="key" />
  </section>
</template>
