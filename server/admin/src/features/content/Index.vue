<script setup lang="ts">
/**
 * #/busqueda/publicaciones[/:id]: la lista como pantalla o una publicación con sus cuatro formatos.
 * La lista se pide una vez al entrar (y a lo sumo una vez por minuto) y queda para volver.
 */
import { computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { registerContentPalette } from './palette'
import PostDetail from './PostDetail.vue'
import PostList from './PostList.vue'
import { posts } from './store'

const route = useRoute()
const id = computed(() => (typeof route.params['id'] === 'string' && route.params['id'] ? route.params['id'] : null))

onMounted(() => {
  // Después del shell: en la primera carga el shell registra sus fuentes después de esta vista.
  void nextTick().then(registerContentPalette)
  void posts.load(false)
})
</script>

<template>
  <PostDetail v-if="id" :id="id" :key="id" />
  <PostList v-else />
</template>
