<script setup lang="ts">
import UiTextBlurReveal from '~/components/ui/UiTextBlurReveal.vue'
import UiClickSpark from '~/components/ui/UiClickSpark.vue'
import UiCopyPill from '~/components/ui/UiCopyPill.vue'
import AppIcon from '~/components/ui/AppIcon.vue'
import { useBenchoSound } from '~/composables/useBenchoSound'

defineProps<{
  homeProfileStatus: string
  projectCountBadge: string
}>()

const { playSound } = useBenchoSound()
const { isEs, tr } = usePortfolioLocale()
</script>

<template>
  <section class="flex flex-col gap-5 sm:gap-6 pt-1 sm:pt-3 border-b border-rule pb-6 sm:pb-7 w-full" aria-label="Introducción y arquitectura de producto">
    <!-- Bloque Tipográfico Monumental Escala 12:1 + Índice ’26 con Acento Quirúrgico #ff3e00 -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-end">
      <div class="lg:col-span-9 flex flex-col gap-2">
        <span class="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-green shrink-0 animate-pulse" />
          <span>{{ isEs ? 'CONSTRUIR CON PROPÓSITO · ' : 'PURPOSEFUL ENGINEERING · ' }}{{ homeProfileStatus }}</span>
        </span>
        <h1
          class="font-sans font-semibold tracking-[-0.044em] text-[clamp(38px,5.8vw,78px)] leading-[0.94] text-ink m-0 select-none"
          data-anchor
        >
          <span class="block">
            <UiTextBlurReveal
              :text="isEs ? 'Ingeniería creativa &' : 'Creative engineering &'"
              split="words"
              look="blur"
              :stagger-ms="48"
              :duration-ms="700"
            />
          </span>
          <span class="inline">
            <UiTextBlurReveal
              :text="isEs ? 'sistemas relacionales' : 'relational systems'"
              split="words"
              look="blur"
              :stagger-ms="48"
              :duration-ms="700"
            />
            <span
              class="inline-block w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-sig ml-1.5 align-baseline transition-transform duration-200 hover:scale-125 active:rotate-12 cursor-pointer shadow-xs hover:shadow-sig/30"
              aria-hidden="true"
              title="Sonzogni Swiss Mark"
              @click="playSound('pop')"
            />
          </span>
        </h1>
      </div>

      <!-- Índice Monumental ’26 (Daniele Buser Signature Mark) -->
      <div class="lg:col-span-3 flex lg:justify-end items-end">
        <div
          class="inline-flex items-baseline leading-none select-none group cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
          aria-hidden="true"
          title="Edición 2026"
          @click="playSound('press')"
        >
          <span class="w-2 sm:w-3.5 h-6 sm:h-11 bg-sig inline-block mr-1.5 self-end mb-1 sm:mb-2 shrink-0 transition-transform duration-200 group-hover:scale-y-110" />
          <span class="font-sans font-semibold tracking-[-0.05em] text-[38px] sm:text-[clamp(48px,6.8vw,92px)] text-ink leading-none">26</span>
        </div>
      </div>
    </div>

    <!-- Fila Inferior Compacta del Hero: Síntesis en 2 Líneas (Izquierda) + Acciones & Telemetría en Línea (Derecha) -->
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pt-4 border-t border-rule">
      <p class="font-sans text-[14.5px] sm:text-[15.5px] text-dim leading-[1.52] max-w-[60ch] m-0 font-normal">
        <template v-if="isEs">
          Desarrollador Full Stack y Creative Developer especializado en <strong class="text-ink font-medium">Vue 3 / Nuxt 4</strong>, arquitecturas tipadas sobre <strong class="text-ink font-medium">PostgreSQL 17</strong> y agentes de IA on-premise (<strong class="text-ink font-medium">382 commits</strong> en Tesis Da Vinci · <strong class="text-ink font-medium">Lighthouse 99/100</strong> en producción).
        </template>
        <template v-else>
          Full Stack &amp; Creative Developer specializing in <strong class="text-ink font-medium">Vue 3 / Nuxt 4</strong>, typed architectures on <strong class="text-ink font-medium">PostgreSQL 17</strong>, and on-premise AI agents (<strong class="text-ink font-medium">382 commits</strong> in Da Vinci Thesis · <strong class="text-ink font-medium">99/100 Lighthouse</strong> in production).
        </template>
      </p>

      <!-- Acciones Táctiles Concisas -->
      <div class="flex flex-wrap items-center gap-2.5 shrink-0">
        <UiClickSpark :spark-count="7" :spark-size="6" :spark-radius="22">
          <NuxtLink
            to="/projects"
            class="group inline-flex items-center gap-2 h-9 px-4 rounded-full bg-ink text-paper font-sans text-[12.5px] font-semibold tracking-[-0.01em] no-underline hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <span>{{ tr.home.btnProjects }}</span>
            <span class="font-mono text-[10.5px] opacity-70">({{ projectCountBadge }})</span>
            <AppIcon name="arrow-right" :size="12" class="transition-transform duration-200 group-hover:translate-x-0.5" />
          </NuxtLink>
        </UiClickSpark>

        <UiClickSpark :spark-count="7" :spark-size="6" :spark-radius="22">
          <NuxtLink
            to="/about"
            class="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full bg-surface hover:bg-hover border border-rule hover:border-rule-strong text-ink font-sans text-[12.5px] font-medium no-underline active:scale-[0.98] transition-all duration-150"
            :title="isEs ? 'Abrir currículum completo en formato Harvard ATS o Interactivo' : 'Open complete resume in Harvard ATS or Interactive format'"
          >
            <span>{{ isEs ? 'CV Harvard ATS' : 'Harvard ATS CV' }}</span>
          </NuxtLink>
        </UiClickSpark>

        <UiCopyPill
          size="sm"
          text="mateogabus@gmail.com"
          :label="isEs ? 'Copiar email' : 'Copy email'"
          :copied-label="isEs ? '¡Copiado!' : 'Copied!'"
        />
      </div>
    </div>
  </section>
</template>
