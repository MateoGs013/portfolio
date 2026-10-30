<script setup lang="ts">
// La hora de Mateo, al minuto, en la zona IANA de contact.time_zone. Solo en el cliente: el SSR entrega
// «--:--» (la hora del servidor no es la del lector) y el reloj se ajusta al cambio de minuto.
const props = defineProps<{ timeZone: string }>()

const { t, lang } = useLocale()
const time = ref<string | null>(null)

let align: ReturnType<typeof setTimeout> | undefined
let every: ReturnType<typeof setInterval> | undefined

function update() {
  try {
    time.value = new Intl.DateTimeFormat(lang.value === 'en' ? 'en-GB' : 'es-AR', {
      timeZone: props.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date())
  }
  catch {
    // Una zona inválida en la base deja el reloj vacío en lugar de romper el pie.
    time.value = null
  }
}

onMounted(() => {
  update()
  align = setTimeout(() => {
    update()
    every = setInterval(update, 60_000)
  }, 60_000 - (Date.now() % 60_000))
})

onBeforeUnmount(() => {
  clearTimeout(align)
  clearInterval(every)
})

watch(() => [props.timeZone, lang.value], update)
</script>

<template>
  <span>
    <span class="sr-only">{{ t('shell.localTime') }}</span>
    <time :datetime="time ?? undefined" class="tabular-nums">{{ time ?? '--:--' }}</time>
  </span>
</template>
