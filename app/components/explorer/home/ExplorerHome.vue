<script setup lang="ts">
import type { Folder } from '~/lib/explorer'
import type { Project } from '~/lib/api'
import { pad } from '~/lib/explorer'
import type { CursorWorkItem } from '~/components/ui/UiCursorWorkList.vue'
import ExplorerHomeHero from './ExplorerHomeHero.vue'
import ExplorerHomeWorks, { type HomeWorkProject } from './ExplorerHomeWorks.vue'
import ExplorerHomeCapabilities from './ExplorerHomeCapabilities.vue'
import ExplorerHomeContact from './ExplorerHomeContact.vue'

const props = defineProps<{
  folder: Folder
}>()

const { isEs, tr, getProjectLocalization } = usePortfolioLocale()

// Extracción dinámica de campos del documento 'home' desde PostgreSQL / API
function getHomeField(name: string): string | null {
  const f = (props.folder.homeDoc?.fields as Array<{ name: string, value: string }> | undefined)?.find(field => field.name === name)
  return f ? String(f.value) : null
}

const homeProfileStatus = computed(() => {
  const raw = isEs.value ? (getHomeField('profile_status') ?? tr.value.home.profileStatus) : tr.value.home.profileStatus
  return String(raw).replace(/^[●•·\s]+/, '').replace(/\s*\/\/\s*/g, ' · ')
})

const projectCountBadge = computed(() => {
  const count = props.folder.projects?.length ?? Number(props.folder.items?.find(i => i.key === 'projects')?.badge ?? 6)
  return pad(isNaN(count) ? 6 : count)
})

const knownProjectCovers: Record<string, string> = {
  'la-rucula': '/media/projects/la-rucula.jpg',
  'argpiscinas': '/media/projects/argpiscinas.jpg',
  'arg-piscinas': '/media/projects/argpiscinas.jpg',
  'ynara': '/media/projects/ynara-mtucqc2j.png',
  'barberpole': '/media/projects/barberpole.png',
}

const selectedWorkProjects = computed<HomeWorkProject[]>(() => {
  if (props.folder.projects && props.folder.projects.length > 0) {
    const withCovers = props.folder.projects.filter((p: Project) => {
      const coverMedia = p.media?.find((m: { role: string, src: string }) => m.role === 'COVER')
      return Boolean(coverMedia?.src || knownProjectCovers[p.slug])
    })
    const list = withCovers.length >= 4 ? withCovers.slice(0, 4) : props.folder.projects.slice(0, 4)
    return list.map((p: Project, idx: number) => {
      const coverMedia = p.media?.find((m: { role: string, src: string }) => m.role === 'COVER')
      const cover = coverMedia?.src ?? knownProjectCovers[p.slug] ?? ''
      const loc = getProjectLocalization(p.slug)
      return {
        idx: pad(idx + 1),
        slug: p.slug,
        title: p.title,
        to: `/projects/${p.slug}`,
        cover,
        status: p.status,
        year: String(p.year),
        orgDesc: isEs.value
          ? (p.org?.name ? `${p.org.name}${p.org.city ? ` · ${p.org.city}` : ''}` : (loc?.orgDesc ?? ''))
          : (loc?.orgDesc ?? (p.org?.name ? `${p.org.name}${p.org.city ? ` · ${p.org.city}` : ''}` : '')),
        summary: isEs.value ? (p.summary || loc?.summary || '') : (loc?.summary || p.summary || ''),
        chips: p.techs ? p.techs.slice(0, 4).map((t: { name: string }) => t.name) : [],
      }
    })
  }

  return [
    {
      idx: '01',
      slug: 'la-rucula',
      title: 'La Rúcula Gastrobar',
      to: '/projects/la-rucula',
      cover: '/media/projects/la-rucula.jpg',
      status: 'LIVE',
      year: '2026',
      orgDesc: isEs.value ? 'Restauración & Gastronomía · Chiclana de la Frontera, ES' : (getProjectLocalization('la-rucula')?.orgDesc ?? 'Dining & Hospitality · Spain'),
      summary: isEs.value ? 'Sitio editorial menu-first optimizado para escaneo QR en mesa. Lighthouse 99 en Performance y 100 en SEO. En producción.' : (getProjectLocalization('la-rucula')?.summary ?? 'Editorial menu-first website optimized for QR scanning at tables.'),
      chips: ['Vue 3', 'Vite', 'Tailwind CSS', 'GSAP'],
    },
    {
      idx: '02',
      slug: 'argpiscinas',
      title: 'ARG Piscinas',
      to: '/projects/argpiscinas',
      cover: '/media/projects/argpiscinas.jpg',
      status: 'LIVE',
      year: '2026',
      orgDesc: isEs.value ? 'Arquitectura & Construcción · Andalucía, ES' : (getProjectLocalization('argpiscinas')?.orgDesc ?? 'Architecture & Construction · Spain'),
      summary: isEs.value ? 'Plataforma corporativa multi-idioma (ES/EN/DE) con panel autónomo para carga de obras. Tipado integral con Prisma y Node.js.' : (getProjectLocalization('argpiscinas')?.summary ?? 'Multilingual corporate platform with autonomous admin panel.'),
      chips: ['Vue 3', 'Node.js', 'Prisma', 'Tailwind CSS'],
    },
    {
      idx: '03',
      slug: 'ynara',
      title: 'Ynara AI Assistant',
      to: '/projects/ynara',
      cover: '/media/projects/ynara-mtucqc2j.png',
      status: 'WIP',
      year: '2026',
      orgDesc: isEs.value ? 'Tesis Da Vinci (Preaprobada 2026) · 382 commits' : (getProjectLocalization('ynara')?.orgDesc ?? 'Da Vinci Thesis · 382 commits'),
      summary: isEs.value ? 'Asistente de IA adaptativo on-premise, con memoria cifrada vectorial sobre Postgres y pgvector.' : (getProjectLocalization('ynara')?.summary ?? 'Adaptive on-premise AI assistant with encrypted vector memory.'),
      chips: ['FastAPI', 'Next.js', 'PostgreSQL', 'pgvector'],
    },
    {
      idx: '04',
      slug: 'barberpole',
      title: 'Barberpole SaaS',
      to: '/projects/barberpole',
      cover: '/media/projects/barberpole.png',
      status: 'LIVE',
      year: '2025',
      orgDesc: isEs.value ? 'SaaS Multi-Negocio · Producto Propio' : (getProjectLocalization('barberpole')?.orgDesc ?? 'Multi-tenant SaaS · Proprietary Product'),
      summary: isEs.value ? 'SaaS de gestión para peluquerías y barberías: turnos, clientes y caja en tiempo real.' : (getProjectLocalization('barberpole')?.summary ?? 'Management SaaS for barbershops: bookings, clients, and revenue tracking in realtime.'),
      chips: ['React', 'Node.js', 'Express', 'MongoDB'],
    },
  ]
})

const cursorWorkProjects = computed<CursorWorkItem[]>(() => {
  return selectedWorkProjects.value.map(p => ({
    slug: p.slug,
    num: p.idx,
    title: p.title,
    role: p.orgDesc || (isEs.value ? 'Ingeniería y Dirección' : 'Engineering & Direction'),
    year: p.year,
    status: p.status,
    cover: p.cover,
    to: p.to,
    chips: p.chips,
    orgDesc: p.orgDesc,
    summary: p.summary,
  }))
})
</script>

<template>
  <div class="inicio-studio max-w-[1220px] mx-auto flex flex-col gap-10 sm:gap-14 py-1 sm:py-2 w-full">
    <!-- 1. Hero Stage -->
    <ExplorerHomeHero
      :home-profile-status="homeProfileStatus"
      :project-count-badge="projectCountBadge"
    />

    <!-- 2. Selected Works -->
    <ExplorerHomeWorks
      :projects="selectedWorkProjects"
      :cursor-projects="cursorWorkProjects"
      :project-count-badge="projectCountBadge"
    />

    <!-- 3. Engineering Capabilities Matrix -->
    <ExplorerHomeCapabilities />

    <!-- 4. Direct Contact Footer -->
    <ExplorerHomeContact />
  </div>
</template>
