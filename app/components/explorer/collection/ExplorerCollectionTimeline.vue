<script setup lang="ts">
import UiSpotlightCard from '~/components/ui/UiSpotlightCard.vue'
import AppIcon from '~/components/ui/AppIcon.vue'
import { pad, type Folder } from '~/lib/explorer'

const props = defineProps<{
  items: Folder['items']
  experience?: Folder['experience']
  projects?: Folder['projects']
}>()

const { isEs, tr, getExperienceLocalization } = usePortfolioLocale()

function formatExpPeriod(it: Folder['items'][number]): string {
  const exp = props.experience?.find(e => e.slug === it.key)
  if (exp?.startedAt) {
    const sDate = new Date(exp.startedAt)
    const sYear = sDate.getFullYear()
    if (!exp.endedAt) {
      return isEs.value ? `${sYear} — Presente` : `${sYear} — Present`
    }
    const eDate = new Date(exp.endedAt)
    const eYear = eDate.getFullYear()
    if (sYear === eYear) {
      const sMonth = sDate.toLocaleDateString(isEs.value ? 'es-ES' : 'en-US', { month: 'short' })
      const eMonth = eDate.toLocaleDateString(isEs.value ? 'es-ES' : 'en-US', { month: 'short' })
      return `${sMonth} — ${eMonth} ${sYear}`
    }
    return `${sYear} — ${eYear}`
  }
  if (it.key === 'cet-30') return isEs.value ? '2017 — 2023 · 7 Años' : '2017 — 2023 · 7 Years'
  if (it.key === 'escuela-da-vinci') return isEs.value ? '2024 — 2026 · Carrera' : '2024 — 2026 · Degree'
  if (it.key === 'freelance') return isEs.value ? '2023 — Presente' : '2023 — Present'
  return it.meta || ''
}

function getExpCategory(key: string): { label: string; color: string } {
  if (key === 'ynara') return { label: isEs.value ? 'TESIS & LIDERAZGO' : 'THESIS & LEAD', color: 'text-sig' }
  if (key === 'la-rucula' || key === 'arg-piscinas') return { label: isEs.value ? 'PRODUCCIÓN CLIENTE' : 'CLIENT PRODUCTION', color: 'text-green' }
  if (key === 'freelance') return { label: isEs.value ? 'FREELANCE & TURNKEY' : 'FREELANCE & TURNKEY', color: 'text-amber' }
  return { label: isEs.value ? 'FORMACIÓN TÉCNICA' : 'TECHNICAL EDUCATION', color: 'text-dim' }
}

function getExpHighlights(key: string): string[] {
  if (key === 'ynara') return isEs.value ? ['382 commits liderados', 'Tesis preaprobada Da Vinci', 'pgvector'] : ['382 commits led', 'Pre-approved thesis', 'pgvector']
  if (key === 'la-rucula') return isEs.value ? ['Lighthouse 99', 'En producción en Chiclana', 'Vue 3 + GSAP'] : ['Lighthouse 99', 'Live production in Chiclana', 'Vue 3 + GSAP']
  if (key === 'arg-piscinas') return isEs.value ? ['Lighthouse 98', 'Multi-idioma ES/EN/DE', 'Panel Prisma'] : ['Lighthouse 98', 'Multilingual ES/EN/DE', 'Prisma CMS']
  if (key === 'cet-30') return isEs.value ? ['7 Años de formación', 'Título de Técnico en Programación', 'Bases de bajo nivel'] : ['7-Year technical basis', 'Official programming degree', 'Low-level foundations']
  if (key === 'freelance') return isEs.value ? ['Soluciones llave en mano', 'Stack full-cycle', 'Entrega a medida'] : ['Turnkey deliverables', 'Full-cycle stack', 'Custom client solutions']
  if (key === 'escuela-da-vinci') return isEs.value ? ['Promoción 2026', 'Tesis sobresaliente', 'Dirección visual & frontend'] : ['2026 Class', 'Honors thesis', 'Visual direction & frontend']
  return []
}

function getExpLinkedProject(key: string): { slug: string; title: string } | null {
  const p = props.projects?.find(proj => proj.slug === key || (key === 'arg-piscinas' && proj.slug === 'argpiscinas'))
  if (p) return { slug: p.slug, title: p.title }
  if (key === 'ynara') return { slug: 'ynara', title: 'Ynara AI Assistant' }
  if (key === 'la-rucula') return { slug: 'la-rucula', title: 'La Rúcula Gastrobar' }
  if (key === 'arg-piscinas') return { slug: 'argpiscinas', title: 'ARG Piscinas' }
  return null
}
</script>

<template>
  <div class="experience-timeline relative pl-6 sm:pl-8 my-5 w-full max-w-[920px] min-w-0">
    <!-- Línea Vertical Hairline del Timeline -->
    <div class="absolute left-2 sm:left-2.5 top-3 bottom-3 w-[1px] bg-rule-strong" aria-hidden="true" />

    <div class="flex flex-col gap-4 w-full min-w-0">
      <UiSpotlightCard
        v-for="(it, idx) in items"
        :key="it.key"
        as="article"
        class="relative rounded-xl bg-surface/60 border border-rule hover:border-rule-strong p-4 sm:p-5 transition-all duration-200 group w-full min-w-0"
        :data-row="it.key"
      >
        <!-- Pin Quirúrgico en el Eje -->
        <div class="absolute -left-[19px] sm:-left-[25px] top-5 w-2.5 h-2.5 rounded-full border-2 border-paper bg-sig group-hover:scale-125 transition-transform" aria-hidden="true" />

        <!-- Cabecera del Hito -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2 w-full min-w-0">
          <div class="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            <span class="font-mono text-[11px] text-faint tabular-nums shrink-0">{{ pad(idx + 1) }}</span>
            <span class="font-mono text-[10px] font-medium px-2 py-0.5 rounded-md border border-rule bg-paper/70 shrink-0" :class="getExpCategory(it.key).color">
              {{ getExpCategory(it.key).label }}
            </span>
            <span class="font-mono text-[12px] font-medium text-ink break-words">
              {{ it.org ?? it.label }}
            </span>
          </div>
          <div class="font-mono text-[11px] text-faint self-start sm:self-auto shrink-0">
            {{ formatExpPeriod(it) }}
          </div>
        </div>

        <!-- Título del Rol -->
        <h3 class="font-sans text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-ink mb-1.5 leading-snug break-words">
          {{ isEs ? (it.role || getExperienceLocalization(it.key)?.role || it.label) : (getExperienceLocalization(it.key)?.role || it.role || it.label) }}
        </h3>

        <!-- Resumen de Impacto -->
        <p class="font-sans text-[13.5px] text-dim leading-relaxed mb-3.5 break-words">
          {{ isEs ? (it.summary || getExperienceLocalization(it.key)?.summary) : (getExperienceLocalization(it.key)?.summary || it.summary) }}
        </p>

        <!-- Highlights Técnicos -->
        <div v-if="getExpHighlights(it.key).length" class="flex items-center gap-1.5 flex-wrap mb-3.5 font-mono text-[10.5px]">
          <span v-for="h in getExpHighlights(it.key)" :key="h" class="px-2 py-0.5 rounded-md bg-paper/70 border border-rule text-dim break-words">
            {{ h }}
          </span>
        </div>

        <!-- Pie del Hito: Stack + Proyecto Vinculado + Enlace al Dossier -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-rule w-full min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap min-w-0 w-full sm:w-auto flex-1">
            <span v-for="t in (it.techs ?? []).slice(0, 4)" :key="t.slug" class="px-2 py-0.5 rounded-md bg-paper/60 border border-rule font-mono text-[10.5px] text-dim">
              {{ t.name }}
            </span>
            <NuxtLink
              v-if="getExpLinkedProject(it.key)"
              :to="`/projects/${getExpLinkedProject(it.key)!.slug}`"
              class="font-mono text-[10.5px] font-medium text-ink px-2 py-0.5 rounded-md border border-rule-strong bg-surface-raised hover:border-sig transition-colors no-underline inline-flex items-center gap-1 max-w-full"
              :title="isEs ? 'Ver proyecto relacionado' : 'View related project'"
            >
              <AppIcon name="folder" :size="10" class="text-sig shrink-0" />
              <span class="truncate">{{ getExpLinkedProject(it.key)!.title }} ↗</span>
            </NuxtLink>
          </div>

          <div class="flex items-center justify-end w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
            <NuxtLink :to="it.to" class="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-dim group-hover:text-ink no-underline transition-colors">
              <span>{{ tr.collection.technicalDetails }}</span>
              <AppIcon name="arrow-right" :size="12" class="text-sig transition-transform duration-150 group-hover:translate-x-0.5" />
            </NuxtLink>
          </div>
        </div>
      </UiSpotlightCard>
    </div>
  </div>
</template>
