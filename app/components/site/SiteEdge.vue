<script setup lang="ts">
// Borde de lectura: un desenfoque progresivo fijo arriba (debajo de la cabecera) y abajo de la pantalla.
// No es un bloque: cuatro capas con desenfoque creciente (2, 4, 8 y 16 px), cada una recortada por un
// gradiente más corto que la anterior, más un velo del fondo de la página (con su temperatura) que se
// disuelve hacia el centro. Arriba, la franja del menú (el primer 40 %) va entera y recién después se
// disuelve; abajo es más liviano, solo acompaña. Así el texto de la cabecera conserva contraste y lo que
// pasa por los bordes se desvanece en vez de cortarse.
//
// Arriba aparece apenas la página se mueve (arriba de todo no hay nada debajo que tapar). Abajo está
// mientras quede página por leer y se va al llegar al final, para no desenfocar el pie. Sin JS no se
// muestra ninguno. Cada capa se apaga con su propia opacidad: una opacidad en el contenedor lo volvería
// raíz del fondo y las capas no tendrían qué desenfocar. Por lo mismo no lleva nombre de view transition
// (un elemento nombrado también es raíz del fondo): viaja con la foto de la página. El de abajo es
// ornamento: el Hiperfoco lo oculta.
const props = defineProps<{ side: 'top' | 'bottom' }>()

const shown = ref(false)

const BLUR = ['backdrop-blur-[2px]', 'backdrop-blur-[4px]', 'backdrop-blur-[8px]', 'backdrop-blur-[16px]']
const MASK = {
  top: [
    '[mask-image:linear-gradient(to_bottom,#000_0%,#000_60%,transparent_100%)]',
    '[mask-image:linear-gradient(to_bottom,#000_0%,#000_50%,transparent_85%)]',
    '[mask-image:linear-gradient(to_bottom,#000_0%,#000_42%,transparent_70%)]',
    '[mask-image:linear-gradient(to_bottom,#000_0%,#000_36%,transparent_56%)]',
  ],
  bottom: [
    '[mask-image:linear-gradient(to_top,#000_0%,#000_55%,transparent_100%)]',
    '[mask-image:linear-gradient(to_top,#000_0%,#000_35%,transparent_75%)]',
    '[mask-image:linear-gradient(to_top,#000_0%,#000_18%,transparent_50%)]',
    '[mask-image:linear-gradient(to_top,#000_0%,transparent_32%)]',
  ],
}
const VEIL = {
  top: 'bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--edge)_88%,transparent)_0%,color-mix(in_oklab,var(--edge)_80%,transparent)_40%,color-mix(in_oklab,var(--edge)_30%,transparent)_72%,transparent_100%)]',
  bottom: 'bg-[linear-gradient(to_top,color-mix(in_oklab,var(--edge)_55%,transparent)_0%,color-mix(in_oklab,var(--edge)_25%,transparent)_50%,transparent_100%)]',
}

const layers = computed(() => [...BLUR.map((blur, i) => `${blur} ${MASK[props.side][i]}`), VEIL[props.side]])

let frame = 0
function update() {
  frame = 0
  const y = window.scrollY
  const end = document.documentElement.scrollHeight - window.innerHeight
  shown.value = props.side === 'top' ? y > 4 : end - y > 24
}
function onScroll() {
  if (!frame) frame = requestAnimationFrame(update)
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  cancelAnimationFrame(frame)
})
// Una página nueva puede ser más corta: se vuelve a medir cuando ya está montada.
const nuxtApp = useNuxtApp()
const stop = nuxtApp.hook('page:finish', () => {
  requestAnimationFrame(update)
})
onBeforeUnmount(stop)
</script>

<template>
  <div
    aria-hidden="true"
    :data-ornament="side === 'bottom' ? '' : undefined"
    class="pointer-events-none fixed inset-x-0 z-30 [--edge:color-mix(in_oklab,var(--bg),var(--tint)_var(--tint-amt))] print:hidden"
    :class="side === 'top'
      ? 'top-0 h-44 md:h-36'
      : 'bottom-0 h-24 md:h-28'"
  >
    <div
      v-for="(layer, i) in layers"
      :key="i"
      class="absolute inset-0 transition-opacity duration-500 ease-expo motion-reduce:transition-none"
      :class="[layer, shown ? 'opacity-100' : 'opacity-0']"
    />
  </div>
</template>
