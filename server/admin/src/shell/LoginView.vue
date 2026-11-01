<script setup lang="ts">
/**
 * #/ingresar: la clave de acceso y nada más. Con la clave buena vuelve a donde se quería ir
 * (?volver=) reemplazando esta entrada, así Atrás no trae de vuelta el ingreso.
 */
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../stores/session'
import Button from '../ui/Button.vue'
import { ui } from '../ui/dict'
import { shell } from './dict'
import KeyField from './KeyField.vue'

const route = useRoute()
const router = useRouter()
const key = ref('')
const error = ref<string | null>(null)
const pending = ref(false)
const field = ref<InstanceType<typeof KeyField> | null>(null)

/** Solo rutas del propio admin: nada de saltar a otro origen por la consulta. */
function destination(): string {
  const back = route.query['volver']
  return typeof back === 'string' && back.startsWith('/') && !back.startsWith('//') ? back : '/inicio'
}

async function submit(): Promise<void> {
  if (pending.value) return
  if (!key.value.trim()) {
    error.value = shell.login.empty
    field.value?.focus()
    return
  }
  pending.value = true
  error.value = null
  const result = await login(key.value)
  pending.value = false
  if (result.ok) {
    await router.replace(destination())
    return
  }
  error.value = result.message
  field.value?.select()
}

onMounted(() => field.value?.focus())
</script>

<template>
  <main id="main" class="grid min-h-dvh content-center px-4 py-14 sm:px-16">
    <div class="grid w-full max-w-[1080px] gap-5">
      <p class="m-0 text-label text-faint">
        {{ ui.app.name }} · {{ ui.app.area }}
      </p>
      <h1 class="m-0 animate-rise text-display">
        {{ shell.login.title }}
      </h1>
      <p class="m-0 max-w-[52ch] animate-rise text-lead text-dim stagger [--i:2]">
        {{ shell.login.lead }}
      </p>
      <form class="mt-6 grid max-w-[420px] animate-rise gap-8 stagger [--i:4]" novalidate @submit.prevent="submit">
        <KeyField ref="field" v-model="key" :error="error" :disabled="pending" />
        <div>
          <Button type="submit" variant="primary" size="lg" :loading="pending" :loading-label="shell.login.checking">
            {{ shell.login.submit }}
          </Button>
        </div>
      </form>
    </div>
  </main>
</template>
