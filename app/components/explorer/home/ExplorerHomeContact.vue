<script setup lang="ts">
import UiDotGlobe from '~/components/ui/UiDotGlobe.vue'
import UiCopyPill from '~/components/ui/UiCopyPill.vue'

const { isEs } = usePortfolioLocale()
</script>

<template>
  <footer class="pt-14 sm:pt-20 pb-12 border-t border-rule flex flex-col gap-14 sm:gap-20" aria-label="Contacto directo">
    <!-- Fila Superior: Titular Monumental Hablemos. -->
    <div class="flex flex-col gap-2">
      <span class="font-mono text-[10.5px] text-dim uppercase tracking-[0.14em]">
        03 / {{ isEs ? 'CONTACTO DIRECTO & DISPONIBILIDAD 2026' : 'DIRECT CONTACT & AVAILABILITY 2026' }}
      </span>
      <h2 class="m-0 font-sans text-[clamp(56px,9.2vw,128px)] font-semibold tracking-[-0.045em] text-ink leading-[0.88] select-none">
        {{ isEs ? 'Hablemos' : 'Say Hello' }}<span class="inline-block w-3 h-3 sm:w-4 sm:h-4 bg-sig ml-1.5 align-baseline" aria-hidden="true" />
      </h2>
    </div>

    <!-- Fila Inferior Asimétrica: Invitación Editorial + Email & Enlaces -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-6 border-t border-rule/60">
      <!-- Columna 1: Invitación & Ubicación Espacial -->
      <div class="lg:col-span-6 flex flex-col justify-between gap-5 min-w-0">
        <div class="flex flex-col gap-2.5">
          <div class="inline-flex items-center gap-2 font-mono text-[clamp(0.65rem,0.75vw,0.75rem)] text-green tracking-wider uppercase">
            <span class="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span>{{ isEs ? 'DISPONIBLE PARA NUEVOS PROYECTOS · 2026' : 'AVAILABLE FOR NEW PROJECTS · 2026' }}</span>
          </div>
          <p class="m-0 font-sans text-[clamp(0.9rem,1.1vw,1.05rem)] text-dim leading-[1.55] max-w-[46ch]">
            <template v-if="isEs">
              Si tenés un proyecto en mente, buscás sumar ingeniería de producto a tu equipo o querés conversar sobre arquitectura de software, escribime directamente.
            </template>
            <template v-else>
              If you have a project in mind, are looking to add product engineering to your team, or simply want to connect, feel free to reach out directly.
            </template>
          </p>
        </div>

        <!-- Lockup Espacial: Mini Globo 3D Relativo + Coordenadas -->
        <div class="flex items-center gap-3.5 pt-1">
          <UiDotGlobe :size="84" class="shrink-0 cursor-grab active:cursor-grabbing" />
          <div class="flex flex-col gap-0.5 font-mono text-[clamp(0.65rem,0.78vw,0.8rem)] text-dim">
            <span class="text-ink font-semibold">PARANÁ, ARGENTINA</span>
            <span>31.73° S · 60.52° W</span>
            <span class="text-faint">UTC-3 · {{ isEs ? 'RESPUESTA HABITUAL < 24H' : 'RESPONSE TIME < 24H' }}</span>
          </div>
        </div>
      </div>

      <!-- Columna 2: Email Monumental & Acciones Directas -->
      <div class="lg:col-span-6 flex flex-col lg:items-end justify-between gap-4 min-w-0">
        <a
          href="mailto:mateogabus@gmail.com"
          class="font-sans text-[clamp(1.05rem,2.8vw,2.5rem)] font-medium tracking-[-0.03em] text-ink hover:text-sig no-underline transition-colors leading-tight whitespace-nowrap inline-block max-w-full"
        >
          mateogabus@gmail.com
        </a>
        <div class="flex flex-wrap items-center lg:justify-end gap-x-4 gap-y-2 font-sans text-[clamp(0.75rem,0.85vw,0.875rem)] text-dim">
          <UiCopyPill
            text="mateogabus@gmail.com"
            :label="isEs ? 'Copiar correo' : 'Copy email'"
            :copied-label="isEs ? 'Copiado' : 'Copied'"
          />
          <a
            href="https://www.linkedin.com/in/mateo-sonzogni"
            target="_blank"
            rel="noopener noreferrer"
            class="text-dim hover:text-ink no-underline transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/MateoGs013"
            target="_blank"
            rel="noopener noreferrer"
            class="text-dim hover:text-ink no-underline transition-colors"
          >
            GitHub
          </a>
          <NuxtLink
            to="/about"
            class="text-dim hover:text-ink no-underline transition-colors"
          >
            {{ isEs ? 'CV Harvard ATS' : 'Harvard ATS Resume' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
