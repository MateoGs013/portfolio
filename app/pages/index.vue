<script setup lang="ts">
// Página provisoria. El umbral real (pantalla partida) es Fase 2.
// Por ahora prueba el cableado front → API.
const { public: { apiBase } } = useRuntimeConfig()
const { data, error } = await useFetch<{ data: { ok: boolean, db: boolean, version: string } }>(
  `${apiBase}/health`,
  { server: false, lazy: true },
)
</script>

<template>
  <main class="boot">
    <h1>Dos Mundos</h1>
    <dl>
      <dt>api</dt>
      <dd>{{ error ? 'sin respuesta' : data ? 'ok' : '…' }}</dd>
      <dt>db</dt>
      <dd>{{ data ? (data.data.db ? 'ok' : 'sin conexión') : '…' }}</dd>
      <dt>postgres</dt>
      <dd>{{ data?.data.version ?? '…' }}</dd>
    </dl>
  </main>
</template>

<style scoped>
.boot { padding: 2rem; font-family: var(--font-mono); font-size: 0.875rem; }
h1 { font-family: var(--font-display); font-weight: 400; font-size: 2rem; margin: 0 0 1.5rem; }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1.5rem; }
dt { opacity: 0.6; }
dd { margin: 0; }
</style>
