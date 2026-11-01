<script setup lang="ts">
/**
 * «Ver el sitio» y «Salir», al pie de la columna y en el menú del celular. Salir pregunta antes si
 * hay cambios sin guardar.
 */
import { useRouter } from 'vue-router'
import { confirmLeave } from '../composables/useLeaveGuards'
import { logout } from '../stores/session'
import Icon from '../ui/Icon.vue'
import { shell } from './dict'

defineEmits<{ navigate: [] }>()

const router = useRouter()

async function leave(): Promise<void> {
  if (!(await confirmLeave())) return
  logout()
  await router.replace({ name: 'ingresar' })
}

const link = 'inline-flex h-8 items-center gap-1.5 rounded-control border-0 bg-transparent p-0 text-label text-dim no-underline transition-colors duration-120 ease-e hover:text-ink'
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4.5">
    <a href="/" target="_blank" rel="noopener noreferrer" :class="link">
      {{ shell.header.site }}
      <Icon name="external" :size="14" />
    </a>
    <button type="button" :class="link" @click="$emit('navigate'); leave()">
      {{ shell.header.logout }}
    </button>
  </div>
</template>
