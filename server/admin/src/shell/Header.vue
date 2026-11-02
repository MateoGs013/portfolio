<script setup lang="ts">
/**
 * La cabecera: el nombre visible de Sobre mí (/meta), el disparador de la paleta con su atajo y el estado solo si algo
 * anda mal. En la columna (`side`) va arriba de la navegación, como en la demo aprobada; en el
 * celular (`bar`) es una barra de 52 px con la paleta y el menú.
 */
import { computed } from 'vue'
import { SHORTCUT_KEYS } from '../composables/useShortcuts'
import Button from '../ui/Button.vue'
import { ui } from '../ui/dict'
import Icon from '../ui/Icon.vue'
import IconButton from '../ui/IconButton.vue'
import Kbd from '../ui/Kbd.vue'
import { usePlatform } from '../composables/usePlatform'
import { owner } from '../stores/meta'
import { shell } from './dict'
import StatusNotice from './StatusNotice.vue'

// En la columna el estado va en el pie (AppShell); en el celular, debajo de la barra.
defineProps<{ variant: 'side' | 'bar' }>()
defineEmits<{ palette: [], menu: [] }>()

const { modAria } = usePlatform()
const paletteKeys = `${modAria}+K`
const name = computed(() => owner.value ?? ui.app.name)
</script>

<template>
  <div v-if="variant === 'side'" class="grid gap-3.5">
    <div class="grid gap-0.5 px-2.5 pt-1">
      <span class="text-body font-[560] text-ink">{{ name }}</span>
      <span class="text-meta text-faint">{{ ui.app.area }}</span>
    </div>
    <button
      type="button"
      class="flex h-8 w-full items-center gap-2 rounded-control border border-rule-strong bg-surface px-2.5 text-body text-faint transition-colors duration-120 ease-e hover:border-rule-hover hover:text-dim"
      :aria-keyshortcuts="paletteKeys"
      aria-haspopup="dialog"
      data-palette-trigger
      @click="$emit('palette')"
    >
      <Icon name="search" :size="14" />
      <span>{{ shell.header.goto }}</span>
      <Kbd :keys="SHORTCUT_KEYS.palette" class="ml-auto" aria-hidden="true" />
    </button>
  </div>

  <header v-else class="border-b border-rule bg-bg">
    <div class="flex h-13 items-center gap-2 px-4">
      <span class="mr-auto min-w-0 truncate text-body font-[560] text-ink">{{ name }}</span>
      <IconButton icon="search" :label="shell.header.gotoLabel" aria-haspopup="dialog" :aria-keyshortcuts="paletteKeys" data-palette-trigger @click="$emit('palette')" />
      <Button variant="ghost" aria-haspopup="dialog" @click="$emit('menu')">
        {{ shell.header.menu }}
      </Button>
    </div>
    <StatusNotice class="px-4 [&>p]:pb-3" />
  </header>
</template>
