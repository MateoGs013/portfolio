<script setup lang="ts">
import UiDecryptedText from '~/components/ui/UiDecryptedText.vue'
import UiThinkingTrace from '~/components/ui/UiThinkingTrace.vue'

const { isEs } = usePortfolioLocale()

type SpecialtyKey = 'frontend' | 'architecture' | 'ai'

interface SpecialtyPitch {
  title: string
  tagline: string
  spec: string
  techs: Array<{ name: string; slug: string; highlight?: boolean }>
}

const specialties = computed<Record<SpecialtyKey, SpecialtyPitch>>(() => ({
  frontend: {
    title: isEs.value ? 'Frontend Reactivo & Micro-interacciones' : 'Reactive Frontend & Micro-interactions',
    tagline: isEs.value
      ? 'Interfaces reactivas de ultra-alta fidelidad con física de resortes, animaciones espaciales y rendimiento sub-segundo con 99+ en Lighthouse.'
      : 'Ultra-high fidelity reactive interfaces with spring physics, spatial micro-interactions and sub-second 99+ Lighthouse score.',
    spec: isEs.value ? 'SSR HÍBRIDO · CERO CLS · 60FPS' : 'HYBRID SSR · ZERO CLS · 60FPS',
    techs: [
      { name: 'Vue 3', slug: 'vue', highlight: true },
      { name: 'Nuxt 4', slug: 'nuxt', highlight: true },
      { name: 'TypeScript', slug: 'typescript' },
      { name: 'Tailwind CSS', slug: 'tailwind' },
      { name: 'GSAP & Lenis', slug: 'gsap' },
    ],
  },
  architecture: {
    title: isEs.value ? 'Arquitectura de Datos & APIs Tipadas' : 'Data Architecture & Typed APIs',
    tagline: isEs.value
      ? 'Modelado relacional ACID en PostgreSQL 17, contratos de API tipados de punta a punta y resiliencia offline-first con sincronización segura.'
      : 'ACID relational modeling on PostgreSQL 17, end-to-end typed API contracts and offline-first resilience with safe synchronization.',
    spec: isEs.value ? 'ACID TRANSACTIONS · REST/SSE · PRISMA 7' : 'ACID TRANSACTIONS · REST/SSE · PRISMA 7',
    techs: [
      { name: 'PostgreSQL 17', slug: 'postgresql', highlight: true },
      { name: 'Prisma 7', slug: 'prisma', highlight: true },
      { name: 'Express 5', slug: 'express' },
      { name: 'FastAPI / Python', slug: 'python' },
      { name: 'Docker CI/CD', slug: 'docker' },
    ],
  },
  ai: {
    title: isEs.value ? 'Sistemas Autónomos & Agentes de IA' : 'Autonomous Systems & AI Agents',
    tagline: isEs.value
      ? 'Desarrollo del agente Eros (Tesis Da Vinci): razonamiento contextual on-premise, tool-calling estructurado y memoria semántica vectorial.'
      : 'Engineering Eros agent (Da Vinci Thesis): on-premise contextual reasoning, structured tool-calling and semantic vector memory.',
    spec: isEs.value ? 'PGVECTOR · LOCAL LLM · 382 COMMITS' : 'PGVECTOR · LOCAL LLM · 382 COMMITS',
    techs: [
      { name: 'Eros AI Agent', slug: 'eros', highlight: true },
      { name: 'pgvector ACID', slug: 'pgvector', highlight: true },
      { name: 'Python / FastAPI', slug: 'python' },
      { name: 'Tool Calling', slug: 'ai' },
      { name: 'Tesis Da Vinci', slug: 'thesis' },
    ],
  },
}))
</script>

<template>
  <section aria-label="Capacidades de ingeniería" class="flex flex-col gap-5 pt-4">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">
      <div class="flex flex-col gap-1">
        <span class="font-mono text-[10.5px] text-dim uppercase tracking-[0.14em]">
          02 / {{ isEs ? 'CAPACIDADES & ESPECIALIDADES TÉCNICAS' : 'ENGINEERING CAPABILITIES & SPECIALTIES' }}
        </span>
        <h2 class="m-0 font-sans text-[clamp(22px,3vw,34px)] font-semibold tracking-[-0.03em] text-ink leading-tight">
          {{ isEs ? 'Arquitectura de extremo a extremo' : 'End-to-end product architecture' }}
        </h2>
      </div>
      <NuxtLink to="/stack" class="font-mono text-[11.5px] text-dim hover:text-ink no-underline transition-colors">
        {{ isEs ? 'Inspeccionar stack completo (22) →' : 'Inspect full stack (22) →' }}
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 border-b border-rule divide-y md:divide-y-0 md:divide-x divide-rule">
      <!-- Columna 01: Frontend & Creative Engineering -->
      <div class="py-5 md:pr-6 flex flex-col justify-between gap-4">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between font-mono text-[11px] text-dim">
            <span>01 / FRONTEND &amp; CREATIVE</span>
            <UiDecryptedText text="99+ LH" class="text-ink font-semibold" />
          </div>
          <h3 class="m-0 font-sans text-[19px] font-semibold tracking-[-0.025em] text-ink">
            {{ specialties.frontend.title }}
          </h3>
          <p class="m-0 font-sans text-[13.5px] text-dim leading-relaxed">
            {{ specialties.frontend.tagline }}
          </p>
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1 pt-3 border-t border-rule/60 font-mono text-[10.5px] text-dim uppercase">
          <NuxtLink v-for="t in specialties.frontend.techs" :key="t.slug" :to="'/stack/' + t.slug" class="hover:text-sig no-underline transition-colors">
            {{ t.name }}
          </NuxtLink>
        </div>
      </div>

      <!-- Columna 02: Data Architecture & Typed APIs -->
      <div class="py-5 md:px-6 flex flex-col justify-between gap-4">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between font-mono text-[11px] text-dim">
            <span>02 / RELATIONAL &amp; APIS</span>
            <UiDecryptedText text="PG-17 ACID" class="text-ink font-semibold" />
          </div>
          <h3 class="m-0 font-sans text-[19px] font-semibold tracking-[-0.025em] text-ink">
            {{ specialties.architecture.title }}
          </h3>
          <p class="m-0 font-sans text-[13.5px] text-dim leading-relaxed">
            {{ specialties.architecture.tagline }}
          </p>
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1 pt-3 border-t border-rule/60 font-mono text-[10.5px] text-dim uppercase">
          <NuxtLink v-for="t in specialties.architecture.techs" :key="t.slug" :to="'/stack/' + t.slug" class="hover:text-sig no-underline transition-colors">
            {{ t.name }}
          </NuxtLink>
        </div>
      </div>

      <!-- Columna 03: Autonomous Systems & AI Agents -->
      <div class="py-5 md:pl-6 flex flex-col justify-between gap-4">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between font-mono text-[11px] text-dim">
            <span>03 / APPLIED AI &amp; AGENTS</span>
            <UiDecryptedText text="PGVECTOR" class="text-ink font-semibold" />
          </div>
          <h3 class="m-0 font-sans text-[19px] font-semibold tracking-[-0.025em] text-ink">
            {{ specialties.ai.title }}
          </h3>
          <p class="m-0 font-sans text-[13.5px] text-dim leading-relaxed">
            {{ specialties.ai.tagline }}
          </p>
        </div>
        <!-- Mini Traza de Razonamiento Eros AI -->
        <div class="pt-1">
          <UiThinkingTrace
            :steps="isEs ? [
              'pgvector: indexando memoria adaptativa on-premise.',
              'Latencia cero: inferencia local sin dependencias externas.',
              'Tesis Da Vinci: arquitectura validada en 382 commits.'
            ] : [
              'pgvector: indexing on-premise adaptive memory.',
              'Zero latency: local inference without external dependencies.',
              'Da Vinci Thesis: architecture validated across 382 commits.'
            ]"
            :title-thinking="isEs ? 'Razonando memoria...' : 'Thinking memory...'"
            :title-done="isEs ? 'Razonado en' : 'Thought for'"
            :pace="850"
          />
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1 pt-3 border-t border-rule/60 font-mono text-[10.5px] text-dim uppercase">
          <NuxtLink v-for="t in specialties.ai.techs" :key="t.slug" :to="'/stack/' + t.slug" class="hover:text-sig no-underline transition-colors">
            {{ t.name }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
