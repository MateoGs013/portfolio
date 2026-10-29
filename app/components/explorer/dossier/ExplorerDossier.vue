<script setup lang="ts">
import AppIcon from '~/components/ui/AppIcon.vue'
import UiCopyPill from '~/components/ui/UiCopyPill.vue'
import UiRollingCounter from '~/components/ui/UiRollingCounter.vue'
import { pad, type Folder } from '~/lib/explorer'
import type { Project } from '~/lib/api'

const props = defineProps<{
  folder: Folder
}>()

const { isEs, getProjectLocalization } = usePortfolioLocale()

const masterProjects = computed(() => {
  if (props.folder.projects && props.folder.projects.length > 0) {
    return props.folder.projects.map((p: Project) => {
      const loc = getProjectLocalization(p.slug)
      return {
        slug: p.slug,
        title: p.title,
        year: String(p.year),
        status: p.status,
        role: isEs.value ? p.role : (p.role.includes('diseño y desarrollo') ? 'Freelance · Design & Engineering' : p.role),
        summary: isEs.value ? (p.summary || loc?.summary || '') : (loc?.summary || p.summary || ''),
        stack: p.techs ? p.techs.map((t: { name: string }) => t.name) : [],
        metrics: typeof p.metrics === 'object' && p.metrics
          ? Object.entries(p.metrics).map(([k, v]) => `${k} ${v}`).join(' · ')
          : (typeof p.metrics === 'string' ? p.metrics : (isEs.value ? 'Lighthouse 98+' : 'Lighthouse 98+')),
        url: p.url,
        repo: p.repo,
        to: `/projects/${p.slug}`,
      }
    })
  }

  return [
    {
      slug: 'la-rucula',
      title: 'La Rúcula Gastrobar',
      year: '2026',
      status: 'LIVE',
      role: isEs.value ? 'Freelance · Diseño y Desarrollo' : 'Freelance · Design & Engineering',
      summary: isEs.value ? 'Sitio editorial menu-first para restaurante frente al mar en Chiclana.' : (getProjectLocalization('la-rucula')?.summary ?? 'Editorial menu-first website for a beachfront restaurant in Chiclana.'),
      stack: ['Vue 3', 'Tailwind', 'GSAP', 'Vite'],
      metrics: 'Lighthouse 99 · 42 KB',
      url: 'https://laruculagastrobar.es/',
      repo: 'https://github.com/MateoGs013/LaRucula',
      to: '/projects/la-rucula',
    },
    {
      slug: 'argpiscinas',
      title: 'ARG Piscinas',
      year: '2026',
      status: 'LIVE',
      role: isEs.value ? 'Freelance · Front y Back a Medida' : 'Freelance · Custom Full Stack',
      summary: isEs.value ? 'Web corporativa multi-idioma con panel admin y blog para constructora de piscinas en Andalucía.' : (getProjectLocalization('argpiscinas')?.summary ?? 'Multilingual corporate website with admin panel and blog for a pool builder in Andalusia.'),
      stack: ['Vue 3', 'Node.js', 'Prisma', 'Tailwind'],
      metrics: 'Lighthouse 98 · ES/EN/DE',
      url: 'https://www.argpiscinas.es/',
      repo: 'https://github.com/MateoGs013/argpiscinas',
      to: '/projects/argpiscinas',
    },
    {
      slug: 'ynara',
      title: 'Ynara AI Assistant',
      year: '2026',
      status: 'WIP',
      role: isEs.value ? 'Tesis Da Vinci · Lead Frontend y Arquitecto' : 'Da Vinci Thesis · Lead Frontend & Architect',
      summary: isEs.value ? 'Asistente de IA adaptativo on-premise con memoria vectorial sobre Postgres y pgvector.' : (getProjectLocalization('ynara')?.summary ?? 'Adaptive on-premise AI assistant with vector memory over Postgres and pgvector.'),
      stack: ['FastAPI', 'Next.js', 'PostgreSQL', 'pgvector'],
      metrics: '382 commits · <100ms local',
      url: null,
      repo: 'https://github.com/MateoGs013/Ynara-Web',
      to: '/projects/ynara',
    },
    {
      slug: 'barberpole',
      title: 'Barberpole SaaS',
      year: '2025',
      status: 'LIVE',
      role: isEs.value ? 'Producto propio · Diseño y desarrollo MERN' : 'Proprietary product · MERN design & dev',
      summary: isEs.value ? 'SaaS de gestión para peluquerías y barberías: turnos, clientes y caja en tiempo real.' : (getProjectLocalization('barberpole')?.summary ?? 'Management SaaS for barbershops: bookings, clients, and revenue tracking in realtime.'),
      stack: ['React', 'Node.js', 'Express', 'MongoDB'],
      metrics: isEs.value ? 'Multi-negocio · Tiempo real' : 'Multi-tenant · Realtime',
      url: null,
      repo: 'https://github.com/MateoGs013/barberpole-saas',
      to: '/projects/barberpole',
    },
    {
      slug: 'ynara-web',
      title: 'Ynara WebGL',
      year: '2026',
      status: 'WIP',
      role: isEs.value ? 'Landing inmersiva · Diseño y shaders' : 'Immersive landing · Design & shaders',
      summary: isEs.value ? 'Landing inmersiva WebGL para Ynara con shader procedimental reactivo al scroll.' : (getProjectLocalization('ynara-web')?.summary ?? 'Immersive WebGL landing page for Ynara with procedural shader reacting to scroll.'),
      stack: ['Three.js', 'GSAP', 'Next.js', 'GLSL'],
      metrics: '60 FPS · 4 Draw Calls',
      url: null,
      repo: 'https://github.com/MateoGs013/Ynara-Web',
      to: '/projects/ynara-web',
    },
    {
      slug: 'eros',
      title: 'Eros Creative Engine',
      year: '2026',
      status: 'WIP',
      role: isEs.value ? 'Arquitectura de Sistema · IA Asistida' : 'System Architecture · AI-assisted',
      summary: isEs.value ? 'Director creativo asistido por IA con base de conocimiento en un vault de Obsidian.' : (getProjectLocalization('eros')?.summary ?? 'AI-assisted creative director with knowledge base rooted in an Obsidian vault.'),
      stack: ['Python', 'Vue', 'Obsidian', 'LLM Agents'],
      metrics: '1,420 Notes · 850 Nodes',
      url: null,
      repo: 'https://github.com/MateoGs013/eros',
      to: '/projects/eros',
    },
  ]
})
</script>

<template>
  <div class="hiperfoco-dossier max-w-[840px] mx-auto flex flex-col gap-9 py-6 sm:py-8 w-full">
    <!-- 1. Ficha de Identidad & Disponibilidad -->
    <header class="surface-10k rounded-2xl p-6 sm:p-8 flex flex-col gap-5 border border-rule">
      <div class="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-rule">
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-paper/90 border border-rule font-mono text-[11px] text-dim shadow-xs">
          <span class="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_var(--d-green)]" />
          <span class="text-ink font-semibold">{{ isEs ? 'DISPONIBLE · CONTRATACIÓN DIRECTA 2026' : 'AVAILABLE · DIRECT HIRE 2026' }}</span>
          <span class="text-faint">·</span>
          <span>Río Negro, AR · UTC-3</span>
        </div>

        <div class="hidden sm:inline-flex items-center gap-2 font-mono text-[10.5px] text-faint">
          <span>HARVARD ATS CERTIFIED</span>
          <span class="text-faint">·</span>
          <span class="text-sig font-semibold">PG-17</span>
        </div>
      </div>

      <div>
        <span class="font-mono text-[11px] tracking-widest uppercase text-dim mb-1 flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-sig" />
          <span>{{ isEs ? 'DESARROLLADOR FRONTEND & FULL STACK · CREATIVE DEVELOPER' : 'FRONTEND & FULL STACK DEVELOPER · CREATIVE DEVELOPER' }}</span>
        </span>
        <h1 class="font-sans text-[clamp(28px,3.8vw,44px)] font-bold tracking-[-0.035em] text-ink m-0 mb-3 leading-tight">
          Mateo Gabriel Sonzogni
        </h1>
        <p class="font-sans text-[14.5px] sm:text-[15px] text-dim leading-relaxed max-w-[62ch] m-0">
          <template v-if="isEs">
            Ingeniería de software con foco en frontend reactivo contemporáneo, modelado relacional en <strong>PostgreSQL 17</strong>, APIs fuertemente tipadas y micro-interacciones táctiles. Tesis de grado Da Vinci liderando con <strong>382 commits</strong> un asistente de IA on-premise con memoria vectorial. Más de <strong>10 soluciones llave en mano en producción</strong> para clientes en España y Argentina con métricas Lighthouse de 99+.
          </template>
          <template v-else>
            Software engineer focused on contemporary reactive frontend engineering, relational schema modeling in <strong>PostgreSQL 17</strong>, type-safe APIs, and tactile micro-interactions. Da Vinci degree thesis leading with <strong>382 commits</strong> an on-premise AI assistant with vector memory. Shipped <strong>10+ turnkey deliverables</strong> for clients in Spain and Argentina with 99+ Lighthouse metrics.
          </template>
        </p>
      </div>

      <!-- Canales Directos de Contacto -->
      <nav class="flex flex-wrap items-center gap-2.5 pt-2" aria-label="Canales directos de contacto">
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper/80 border border-rule font-mono text-[11px]">
          <AppIcon name="mail" :size="12" class="text-sig" />
          <a href="mailto:mateogabus@gmail.com" class="text-ink hover:text-sig no-underline">mateogabus@gmail.com</a>
          <UiCopyPill text="mateogabus@gmail.com" label="Copy" copied-label="Copied" />
        </div>

        <a href="https://github.com/MateoGs013" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper/80 border border-rule font-mono text-[11px] text-dim hover:text-ink hover:border-rule-strong no-underline transition-colors">
          <AppIcon name="code" :size="12" />
          <span>github.com/MateoGs013</span>
          <AppIcon name="external" :size="10" class="opacity-60" />
        </a>

        <a href="https://www.linkedin.com/in/mateo-sonzogni" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper/80 border border-rule font-mono text-[11px] text-dim hover:text-ink hover:border-rule-strong no-underline transition-colors">
          <AppIcon name="briefcase" :size="12" />
          <span>linkedin/mateo-sonzogni</span>
          <AppIcon name="external" :size="10" class="opacity-60" />
        </a>

        <NuxtLink to="/about" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-paper font-mono text-[11px] font-medium no-underline hover:opacity-90 transition-opacity">
          <AppIcon name="file" :size="12" />
          <span>{{ isEs ? 'CV Harvard ATS (PDF)' : 'Harvard ATS Resume (PDF)' }}</span>
          <span>↗</span>
        </NuxtLink>
      </nav>
    </header>

    <!-- 2. Métricas de Rendimiento Clave -->
    <section class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="surface-10k rounded-xl p-3 sm:p-3.5 border border-rule flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] text-dim uppercase">COMMITS IA</span>
        <div class="py-0.5">
          <UiRollingCounter :model-value="382" :digits="3" />
        </div>
        <span class="font-mono text-[10px] text-faint">Tesis Da Vinci</span>
      </div>
      <div class="surface-10k rounded-xl p-3 sm:p-3.5 border border-rule flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] text-dim uppercase">LIGHTHOUSE</span>
        <div class="py-0.5">
          <UiRollingCounter :model-value="99" :digits="2" suffix="/100" />
        </div>
        <span class="font-mono text-[10px] text-faint">Producción Real</span>
      </div>
      <div class="surface-10k rounded-xl p-3 sm:p-3.5 border border-rule flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] text-dim uppercase">ENTREGABLES</span>
        <div class="py-0.5">
          <UiRollingCounter :model-value="10" :digits="2" suffix="+" />
        </div>
        <span class="font-mono text-[10px] text-faint">Full-Cycle Shipped</span>
      </div>
      <div class="surface-10k rounded-xl p-3 sm:p-3.5 border border-rule flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] text-dim uppercase">BASE DE DATOS</span>
        <span class="font-sans text-[22px] font-bold text-ink">PG-17</span>
        <span class="font-mono text-[10px] text-faint">ACID / pgvector</span>
      </div>
    </section>

    <!-- 3. Matriz de Entregables en Producción -->
    <section class="flex flex-col gap-4">
      <div class="flex items-center justify-between border-b border-rule pb-2">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-sig" />
          <h2 class="font-mono text-[12px] font-bold tracking-wider text-ink m-0 uppercase">
            {{ isEs ? '01 / MATRIZ DE PROYECTOS EN PRODUCCIÓN & TESIS' : '01 / PRODUCTION PROJECTS & THESIS MATRIX' }}
          </h2>
        </div>
        <span class="font-mono text-[10.5px] text-dim">{{ masterProjects.length }} REGISTROS</span>
      </div>

      <div class="flex flex-col gap-3">
        <article
          v-for="(p, idx) in masterProjects"
          :key="p.slug"
          class="surface-10k rounded-xl p-4 sm:p-5 border border-rule flex flex-col gap-3 transition-colors hover:border-rule-strong"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-mono text-[11px] text-sig font-bold">{{ pad(idx + 1) }}.</span>
              <NuxtLink :to="p.to" class="font-sans text-[16px] font-semibold text-ink hover:text-sig no-underline truncate">
                {{ p.title }}
              </NuxtLink>
              <span class="font-mono text-[11px] text-dim">({{ p.year }})</span>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="font-mono text-[9.5px] px-2 py-0.5 rounded-md border uppercase"
                :class="p.status === 'LIVE' ? 'bg-green/10 border-green/30 text-green font-semibold' : 'bg-amber/10 border-amber/30 text-amber font-semibold'"
              >
                {{ p.status }}
              </span>
              <span class="font-mono text-[10.5px] text-dim hidden sm:inline">· {{ p.role }}</span>
            </div>
          </div>

          <p class="font-sans text-[13.5px] text-dim leading-relaxed m-0">
            {{ p.summary }}
          </p>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rule/60">
            <div class="flex flex-wrap items-center gap-1.5">
              <span
                v-for="t in p.stack"
                :key="t"
                class="font-mono text-[10.5px] px-2 py-0.5 rounded bg-paper/80 border border-rule text-dim"
              >
                {{ t }}
              </span>
              <span class="font-mono text-[10.5px] text-faint ml-1">· {{ p.metrics }}</span>
            </div>

            <div class="flex items-center gap-2">
              <a
                v-if="p.url"
                :href="p.url"
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-[11px] text-ink hover:text-sig no-underline inline-flex items-center gap-1"
              >
                <span>{{ isEs ? 'Visitar sitio' : 'Live site' }}</span>
                <span>↗</span>
              </a>
              <span v-if="p.url && p.repo" class="text-faint">·</span>
              <a
                v-if="p.repo"
                :href="p.repo"
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-[11px] text-dim hover:text-ink no-underline inline-flex items-center gap-1"
              >
                <span>GitHub</span>
                <span>↗</span>
              </a>
              <span class="text-faint">·</span>
              <NuxtLink :to="p.to" class="font-mono text-[11px] text-sig font-medium no-underline inline-flex items-center gap-1">
                <span>{{ isEs ? 'Ficha' : 'Dossier' }}</span>
                <span>→</span>
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- 4. Trayectoria Profesional & Formación -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Columna Trayectoria -->
      <div class="surface-10k rounded-2xl p-5 sm:p-6 border border-rule flex flex-col gap-4">
        <div class="flex items-center gap-2 border-b border-rule pb-2">
          <span class="w-1.5 h-1.5 rounded-full bg-sig" />
          <h2 class="font-mono text-[11.5px] font-bold tracking-wider text-ink m-0 uppercase">
            {{ isEs ? '02 / TRAYECTORIA PROFESIONAL' : '02 / CAREER HISTORY' }}
          </h2>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between font-mono text-[11px]">
              <strong class="text-ink font-semibold">Ynara AI Assistant</strong>
              <span class="text-sig font-semibold">2026</span>
            </div>
            <span class="font-mono text-[10.5px] text-dim">{{ isEs ? 'Lead Frontend & Arquitectura Técnica' : 'Lead Frontend & Architecture' }}</span>
            <p class="font-sans text-[12.5px] text-dim leading-relaxed m-0 mt-1">
              {{ isEs ? '382 commits liderando inferencia local, embeddings y base vectorial Postgres/pgvector en Next.js y FastAPI.' : '382 commits leading local inference, embeddings, and Postgres/pgvector architecture.' }}
            </p>
          </div>

          <div class="flex flex-col gap-1 pt-3 border-t border-rule/60">
            <div class="flex items-center justify-between font-mono text-[11px]">
              <strong class="text-ink font-semibold">La Rúcula &amp; ARG Piscinas</strong>
              <span class="text-dim">2026</span>
            </div>
            <span class="font-mono text-[10.5px] text-dim">{{ isEs ? 'Desarrollo Web & Frontend a Medida (España)' : 'Web Engineering (Spain)' }}</span>
            <p class="font-sans text-[12.5px] text-dim leading-relaxed m-0 mt-1">
              {{ isEs ? 'Aplicaciones en producción para clientes reales con Lighthouse 99/100, animaciones GSAP y panel admin autónomo.' : 'Production applications with Lighthouse 99/100 and autonomous admin dashboard.' }}
            </p>
          </div>

          <div class="flex flex-col gap-1 pt-3 border-t border-rule/60">
            <div class="flex items-center justify-between font-mono text-[11px]">
              <strong class="text-ink font-semibold">{{ isEs ? 'Desarrollo Freelance' : 'Freelance Dev' }}</strong>
              <span class="text-dim">2023 – {{ isEs ? 'Act.' : 'Present' }}</span>
            </div>
            <span class="font-mono text-[10.5px] text-dim">{{ isEs ? 'Desarrollador Full Stack' : 'Full Stack Developer' }}</span>
            <p class="font-sans text-[12.5px] text-dim leading-relaxed m-0 mt-1">
              {{ isEs ? '~10 soluciones llave en mano entregadas de punta a punta con arquitectura completa.' : '~10 turnkey web deliverables shipped with end-to-end architecture.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Columna Formación -->
      <div class="surface-10k rounded-2xl p-5 sm:p-6 border border-rule flex flex-col gap-4">
        <div class="flex items-center gap-2 border-b border-rule pb-2">
          <span class="w-1.5 h-1.5 rounded-full bg-sig" />
          <h2 class="font-mono text-[11.5px] font-bold tracking-wider text-ink m-0 uppercase">
            {{ isEs ? '03 / FORMACIÓN TÉCNICA' : '03 / TECHNICAL EDUCATION' }}
          </h2>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between font-mono text-[11px]">
              <strong class="text-ink font-semibold">Escuela Da Vinci</strong>
              <span class="text-sig font-semibold">2024 – 2026</span>
            </div>
            <span class="font-mono text-[10.5px] text-dim">{{ isEs ? 'Diseño y Desarrollo Web' : 'Web Design & Dev' }}</span>
            <p class="font-sans text-[12.5px] text-dim leading-relaxed m-0 mt-1">
              {{ isEs ? 'Buenos Aires. Tesis preaprobada con calificación sobresaliente: Ynara AI Assistant.' : 'Buenos Aires. Pre-approved degree thesis with honors: Ynara.' }}
            </p>
          </div>

          <div class="flex flex-col gap-1 pt-3 border-t border-rule/60">
            <div class="flex items-center justify-between font-mono text-[11px]">
              <strong class="text-ink font-semibold">CET N.º 30</strong>
              <span class="text-dim">2017 – 2023</span>
            </div>
            <span class="font-mono text-[10.5px] text-dim">{{ isEs ? 'Técnico en Programación (7 Años)' : 'Programming Degree (7 Years)' }}</span>
            <p class="font-sans text-[12.5px] text-dim leading-relaxed m-0 mt-1">
              {{ isEs ? 'Río Negro. Algoritmos, estructuras de datos, lógica de bajo nivel, redes y sistemas operativos.' : 'Río Negro. Algorithmic logic, low-level logic, networks, and operating systems.' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Principios de Arquitectura & Calidad -->
    <section class="surface-10k rounded-2xl p-5 sm:p-6 border border-rule flex flex-col gap-3">
      <div class="flex items-center gap-2 border-b border-rule pb-2">
        <span class="w-1.5 h-1.5 rounded-full bg-sig" />
        <h2 class="font-mono text-[11.5px] font-bold tracking-wider text-ink m-0 uppercase">
          {{ isEs ? '04 / AXIOMAS DE INGENIERÍA' : '04 / ENGINEERING AXIOMS' }}
        </h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div class="p-3.5 rounded-xl bg-paper/60 border border-rule flex flex-col gap-1">
          <span class="font-mono text-[11px] font-semibold text-ink">01. CERO LAYOUT SHIFT (CLS 0.00)</span>
          <span class="font-sans text-[12px] text-dim leading-normal">{{ isEs ? 'Cada imagen, contenedor y fuente tiene dimensiones reservadas. Cero saltos visuales.' : 'Every asset has reserved geometry. Zero layout shifts.' }}</span>
        </div>
        <div class="p-3.5 rounded-xl bg-paper/60 border border-rule flex flex-col gap-1">
          <span class="font-mono text-[11px] font-semibold text-ink">02. TIPADO DE EXTREMO A EXTREMO</span>
          <span class="font-sans text-[12px] text-dim leading-normal">{{ isEs ? 'Prisma 7 (Postgres) sincronizado atómicamente con Express 5 y TypeScript en Nuxt 4.' : 'Prisma 7 atomically synchronized with Express 5 and Nuxt 4 types.' }}</span>
        </div>
        <div class="p-3.5 rounded-xl bg-paper/60 border border-rule flex flex-col gap-1">
          <span class="font-mono text-[11px] font-semibold text-ink">03. LATENCIA SUB-SEGUNDO</span>
          <span class="font-sans text-[12px] text-dim leading-normal">{{ isEs ? 'SSR optimizado, compresión Brotli/Gzip y tiempos de respuesta de base de datos <15ms.' : 'Optimized SSR and database response latencies <15ms.' }}</span>
        </div>
        <div class="p-3.5 rounded-xl bg-paper/60 border border-rule flex flex-col gap-1">
          <span class="font-mono text-[11px] font-semibold text-ink">04. MICRO-INTERACCIONES TÁCTILES</span>
          <span class="font-sans text-[12px] text-dim leading-normal">{{ isEs ? 'Física de resortes de 2.º orden y síntesis Web Audio háptica respetando reduced-motion.' : '2nd-order damped spring physics and subtle Web Audio feedback.' }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
