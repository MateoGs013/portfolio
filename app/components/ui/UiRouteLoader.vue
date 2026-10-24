<script setup lang="ts">
import { useRouteLoader } from '~/composables/useRouteLoader'

const {
  visible,
  progress,
  elapsedMs,
  isResolved,
  routeMeta,
  isHyperfocus,
} = useRouteLoader()
</script>

<template>
  <Teleport to="body">
    <Transition name="route-loader">
      <div
        v-if="visible"
        class="route-loader-backdrop fixed inset-0 z-[150] flex flex-col items-center justify-center p-4 select-none pointer-events-auto"
        :class="isHyperfocus ? 'bg-paper' : 'bg-paper/85 backdrop-blur-md'"
        role="progressbar"
        :aria-valuenow="Math.round(progress)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="routeMeta.title"
      >
        <!-- 1. Láser Cenital Superior (Linear 2026 1.5px Laser Beam) -->
        <div
          v-if="!isHyperfocus"
          class="route-loader-laser absolute top-0 left-0 right-0 h-[2px] bg-rule/30 overflow-hidden pointer-events-none"
        >
          <div
            class="h-full bg-sig transition-all duration-150 ease-out shadow-[0_0_12px_var(--d-sig,#ff3e00)]"
            :style="{ width: `${progress}%` }"
          />
        </div>

        <!-- 2. Retícula Milimétrica Arquitectónica CAD en el fondo -->
        <div
          v-if="!isHyperfocus"
          class="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(var(--d-grid-cross,rgba(255,255,255,0.12))_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />

        <!-- 3. HUD Flotante Central (Specular Dynamic Island Capsule) -->
        <div
          class="route-loader-hud relative w-[min(94vw,430px)] rounded-2xl border bg-surface/90 backdrop-blur-xl p-4 sm:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] flex flex-col gap-3.5 transition-all duration-200"
          :class="[
            isResolved ? 'border-green/60 scale-[1.01]' : 'border-rule-strong scale-100',
            isHyperfocus ? 'border-ink bg-paper shadow-none' : '',
          ]"
        >
          <!-- Fila Superior: Monograma MS, Dot de Estado, Tag y Latencia -->
          <div class="flex items-center justify-between gap-2 border-b border-rule/70 pb-3">
            <div class="flex items-center gap-2 min-w-0">
              <span class="px-1.5 py-0.5 rounded border border-rule bg-paper font-mono text-[10px] font-bold text-ink">
                MS
              </span>
              <span
                class="w-2 h-2 rounded-full transition-colors duration-200"
                :class="isResolved ? 'bg-green shadow-[0_0_8px_var(--d-green,#22c55e)]' : 'bg-sig animate-pulse shadow-[0_0_8px_var(--d-sig,#ff3e00)]'"
                aria-hidden="true"
              />
              <span class="font-mono text-[10px] uppercase tracking-wider text-dim truncate">
                {{ isResolved ? 'RESOLVED · 200 OK' : routeMeta.tag }}
              </span>
            </div>

            <div class="flex items-center gap-2 shrink-0 font-mono text-[10.5px]">
              <span class="text-dim tabular-nums">{{ elapsedMs }}ms</span>
              <span class="text-faint">·</span>
              <span class="text-sig font-bold">{{ Math.round(progress) }}%</span>
            </div>
          </div>

          <!-- Bloque Central: Título Dinámico Contextual y Consulta Relacional -->
          <div class="flex flex-col gap-1.5 min-w-0">
            <div class="flex items-center gap-1.5 font-mono text-[12.5px] sm:text-[13px] font-semibold text-ink tracking-tight truncate">
              <span class="text-sig">&gt;</span>
              <span class="truncate">{{ routeMeta.title }}</span>
            </div>

            <!-- Caja de Código / Consulta SQL en vivo -->
            <div class="rounded-lg border border-rule/80 bg-paper/75 p-2.5 font-mono text-[10px] leading-relaxed text-dim overflow-hidden truncate">
              <code class="text-ink/80 block truncate">{{ routeMeta.query }}</code>
            </div>
          </div>

          <!-- Fila Inferior: Micro-barras Cinéticas y Estado de Hidratación -->
          <div class="flex items-center justify-between gap-3 pt-0.5">
            <!-- Micro-barras cinéticas estilo Bencho UI -->
            <div v-if="!isHyperfocus" class="flex items-center gap-1 h-3.5" aria-hidden="true">
              <span
                v-for="b in 8"
                :key="b"
                class="w-[2.5px] rounded-full bg-sig transition-all duration-200"
                :style="{
                  height: isResolved ? '4px' : `${Math.sin((elapsedMs / 120) + b) * 5 + 8}px`,
                  opacity: isResolved ? 0.35 : 0.85
                }"
              />
            </div>
            <div v-else class="font-mono text-[9.5px] text-dim">
              [HYPERFOCUS]
            </div>

            <span class="font-mono text-[9.5px] text-faint tracking-wider uppercase truncate">
              {{ isResolved ? 'DOM HYDRATED · MOUNTED' : 'POSTGRESQL 17 · RELATIONAL CORE' }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Transición óptica de entrada y salida (Bencho Spring Crossfade) */
.route-loader-enter-active,
.route-loader-leave-active {
  transition: opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.route-loader-enter-active .route-loader-hud,
.route-loader-leave-active .route-loader-hud {
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.route-loader-enter-from,
.route-loader-leave-to {
  opacity: 0;
}

.route-loader-enter-from .route-loader-hud {
  transform: scale(0.95) translateY(6px);
  filter: blur(4px);
}

.route-loader-leave-to .route-loader-hud {
  transform: scale(0.97) translateY(-4px);
  filter: blur(4px);
}

@media (prefers-reduced-motion: reduce) {
  .route-loader-enter-active,
  .route-loader-leave-active,
  .route-loader-hud {
    transition: none !important;
    animation: none !important;
  }
}

@media print {
  .route-loader-backdrop {
    display: none !important;
  }
}
</style>
