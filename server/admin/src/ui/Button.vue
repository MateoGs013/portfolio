<script setup lang="ts">
/**
 * Botón (o enlace con forma de botón si trae href). 32 px; el primario del pie mide 36 (size lg).
 * Cargando: el rótulo queda en su lugar sin verse, así el ancho no salta, y el botón avisa aria-busy.
 */
import { computed } from 'vue'
import { usePlatform } from '../composables/usePlatform'
import { controlBase, variantClass, type ButtonSize, type ButtonVariant } from './button'
import Icon from './Icon.vue'
import type { IconName } from './icons'
import Kbd from './Kbd.vue'
import Spinner from './Spinner.vue'

const props = withDefaults(defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  href?: string
  /** Abre en otra pestaña (enlace externo): suma el icono y rel. */
  external?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: IconName
  /** Atajo visible y en aria-keyshortcuts: «mod+s», «n». */
  shortcut?: string
  /** Lo que se anuncia mientras carga («Guardando…»). */
  loadingLabel?: string
}>(), { variant: 'secondary', size: 'md', type: 'button', external: false, loading: false, disabled: false })

defineEmits<{ click: [event: MouseEvent] }>()

const { modAria } = usePlatform()

const classes = computed(() => [
  controlBase,
  variantClass[props.variant],
  props.size === 'lg' ? 'h-9 px-4' : 'h-8 px-3',
])

const ariaShortcut = computed(() => props.shortcut
  ?.split('+')
  .map(k => (k === 'mod' ? modAria : k.length === 1 ? k.toUpperCase() : k))
  .join('+'))
</script>

<template>
  <a
    v-if="href && !disabled"
    :href="href"
    :class="classes"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    :aria-keyshortcuts="ariaShortcut"
    @click="$emit('click', $event)"
  >
    <Icon v-if="icon" :name="icon" />
    <slot />
    <Icon v-if="external" name="external" :size="14" />
    <Kbd v-if="shortcut" :keys="shortcut" :on-sig="variant === 'primary'" />
  </a>
  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="disabled"
    :aria-busy="loading || undefined"
    :aria-disabled="loading || undefined"
    :aria-keyshortcuts="ariaShortcut"
    @click="loading ? $event.preventDefault() : $emit('click', $event)"
  >
    <span class="inline-flex items-center gap-2" :class="loading ? 'invisible' : ''">
      <Icon v-if="icon" :name="icon" />
      <slot />
      <Kbd v-if="shortcut" :keys="shortcut" :on-sig="variant === 'primary'" />
    </span>
    <span v-if="loading" class="absolute inset-0 grid place-items-center">
      <Spinner :live="false" :label="loadingLabel" />
    </span>
  </button>
</template>
