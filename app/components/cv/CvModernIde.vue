<script setup lang="ts">
import type { CvDeliverable } from './types'

defineProps<{
  name: string
  role: string
  location: string
  bio: string
  email: string
  github: string
  githubText: string
  linkedin: string
  timezone: string
  deliverables: CvDeliverable[]
  isEs: boolean
}>()
</script>

<template>
  <article class="cv-modern w-full max-w-[1040px] mx-auto">
    <div class="ide-container flex max-md:flex-col bg-paper border border-rule-strong text-ink font-mono text-[11px]">
      <!-- Sidebar -->
      <aside class="ide-sidebar w-[260px] max-md:w-full bg-surface border-r max-md:border-r-0 max-md:border-b border-rule-strong flex flex-col shrink-0">
        <div class="ide-window-controls p-3 px-3.5 flex items-center gap-1.5 border-b border-rule-strong bg-surface-raised">
          <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" aria-hidden="true" />
          <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" aria-hidden="true" />
          <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f]" aria-hidden="true" />
          <span class="ml-auto text-sig text-[11px]">package.json</span>
        </div>

        <div class="ide-sidebar-inner p-3.5 flex flex-col gap-3.5">
          <div class="ide-tree-block">
            <div class="ide-sidebar-header mb-1">
              <span class="text-sig font-bold">~/curriculum</span>
            </div>

            <div class="ide-tree flex flex-col gap-2">
              <div class="ide-tree-group">
                <div class="text-ink font-semibold flex items-center gap-1">
                  <span class="text-dim text-[9px]">▼</span> src/
                </div>
                <ul class="list-none m-0 pl-3.5 flex flex-col gap-1 text-dim mt-1">
                  <li><span class="text-faint">·</span> profile.ts</li>
                  <li><span class="text-faint">·</span> experience.vue</li>
                  <li><span class="text-faint">·</span> stack.py</li>
                  <li><span class="text-faint">·</span> education.sql</li>
                </ul>
              </div>
              <div class="ide-tree-group">
                <div class="text-ink font-semibold flex items-center gap-1">
                  <span class="text-dim text-[9px]">▼</span> config/
                </div>
                <ul class="list-none m-0 pl-3.5 flex flex-col gap-1 text-dim mt-1">
                  <li><span class="text-faint">·</span> contact.env</li>
                  <li><span class="text-faint">·</span> nuxt.config.ts</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="h-px bg-rule my-0.5" />

          <div class="p-2 bg-surface-raised border border-rule flex justify-center">
            <img
              src="/media/profile/mateo-front.png"
              alt="Mateo Gabriel Sonzogni"
              class="w-28 h-28 object-cover rounded-[2px] border border-rule"
              loading="eager"
            >
          </div>

          <div class="h-px bg-rule my-0.5" />

          <!-- Formación / Education -->
          <div class="ide-sidebar-section flex flex-col gap-2">
            <div class="text-faint italic text-[10.5px]">// {{ isEs ? 'formación técnica' : 'education' }}</div>
            <div class="flex flex-col gap-0.5">
              <div class="text-sig font-bold text-[11px]">ESCUELA DA VINCI</div>
              <div class="text-ink font-medium text-[10.5px]">{{ isEs ? 'Diseño y Desarrollo Web' : 'Web Design & Dev' }} (2024–2026)</div>
              <div class="text-dim text-[10px]">{{ isEs ? 'Tesis: Ynara (Lead Front & Arq.)' : 'Thesis: Ynara (Lead Front & Arch)' }}</div>
            </div>
            <div class="flex flex-col gap-0.5">
              <div class="text-sig font-bold text-[11px]">CET N.º 30</div>
              <div class="text-ink font-medium text-[10.5px]">{{ isEs ? 'Técnico en Programación' : 'Programming Tech' }} (2017–2023)</div>
              <div class="text-dim text-[10px]">{{ isEs ? 'Plan integral de 7 años' : '7-year technical program' }}</div>
            </div>
          </div>

          <div class="h-px bg-rule my-0.5" />

          <!-- Stats & Idiomas -->
          <div class="ide-sidebar-section flex flex-col gap-1.5">
            <div class="text-faint italic text-[10.5px]">// {{ isEs ? 'métricas & idiomas' : 'metrics & languages' }}</div>
            <ul class="list-none m-0 p-0 flex flex-col gap-1 text-dim text-[10.5px]">
              <li class="flex justify-between"><span>{{ isEs ? 'Español' : 'Spanish' }}</span> <span class="text-ink font-semibold">{{ isEs ? 'Nativo' : 'Native' }}</span></li>
              <li class="flex justify-between"><span>{{ isEs ? 'Inglés' : 'English' }}</span> <span class="text-ink font-semibold">{{ isEs ? 'B2 Profesional' : 'B2 Professional' }}</span></li>
              <li class="flex justify-between"><span>{{ isEs ? 'Experiencia' : 'Experience' }}</span> <span class="text-ink font-semibold">{{ isEs ? '+3 años' : '3+ yrs' }}</span></li>
              <li class="flex justify-between"><span>{{ isEs ? 'Proyectos' : 'Projects' }}</span> <span class="text-ink font-semibold">~10 apps</span></li>
              <li class="flex justify-between"><span>{{ isEs ? 'Disponibilidad' : 'Availability' }}</span> <span class="text-ink font-semibold">{{ isEs ? 'Inmediata' : 'Immediate' }}</span></li>
              <li class="flex justify-between"><span>{{ isEs ? 'Zona Horaria' : 'Timezone' }}</span> <span class="text-ink font-semibold">{{ timezone }}</span></li>
            </ul>
          </div>

          <div class="h-px bg-rule my-0.5" />

          <!-- Contact -->
          <div class="ide-sidebar-section flex flex-col gap-1.5">
            <div class="text-faint italic text-[10.5px]">// {{ isEs ? 'contacto' : 'contact' }}</div>
            <ul class="list-none m-0 p-0 flex flex-col gap-1 text-[10.5px]">
              <li><a :href="`mailto:${email}`" class="text-sig hover:underline">{{ email }}</a></li>
              <li><a :href="github" target="_blank" rel="noopener noreferrer" class="text-sig hover:underline">@{{ githubText.replace('github.com/', '') }}</a></li>
              <li><a :href="linkedin" target="_blank" rel="noopener noreferrer" class="text-sig hover:underline">in/mateo-sonzogni</a></li>
              <li><span class="text-dim">{{ location }}</span></li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- Main Editor -->
      <main class="ide-main flex-1 min-w-0 bg-paper flex flex-col">
        <div class="ide-tabs flex border-b border-rule-strong bg-surface-raised">
          <div class="ide-tab px-4 py-2 text-[11px] border-r border-rule-strong cursor-pointer bg-paper text-sig font-bold border-b-2 border-b-sig">cv.ts</div>
          <div class="ide-tab px-4 py-2 text-[11px] border-r border-rule-strong cursor-pointer text-dim hover:text-ink">README.md</div>
        </div>

        <div class="ide-editor-content p-6 max-md:p-4 flex flex-col gap-5 leading-relaxed">
          <header class="ide-header">
            <div class="text-faint italic text-[10.5px] mb-1">// curriculum vitae — mateo sonzogni, 2026</div>
            <h1 class="m-0 font-sans text-2xl font-bold text-ink tracking-tight">{{ name }}</h1>
            <p class="m-0 font-mono text-sig text-[12px] font-semibold mt-1">{{ role }}</p>
          </header>

          <div class="h-px bg-rule" />

          <!-- Profile -->
          <div class="ide-section flex flex-col gap-2">
            <div class="text-faint italic text-[10.5px]">// profile</div>
            <p class="m-0 font-sans text-[13.5px] text-dim leading-relaxed">{{ bio }}</p>
          </div>

          <div class="h-px bg-rule" />

          <!-- Experience & Projects -->
          <div class="ide-section flex flex-col gap-3">
            <div class="text-faint italic text-[10.5px]">// {{ isEs ? 'experiencia profesional & proyectos en producción' : 'professional experience & shipped projects' }}</div>

            <div v-for="item in deliverables" :key="item.slug" class="mt-2 flex flex-col gap-1.5 p-3.5 bg-surface border border-rule">
              <div class="flex items-baseline justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[13px] font-bold text-ink">{{ item.title }}</span>
                  <span v-if="item.badge" class="text-[9.5px] px-1.5 py-0.5 border border-sig text-sig font-bold rounded-[2px]">{{ item.badge }}</span>
                </div>
                <span class="text-dim text-[10.5px]">{{ item.date }}</span>
              </div>
              <div class="flex items-baseline justify-between gap-2 text-dim text-[11px]">
                <span class="text-sig font-medium">{{ item.role }}</span>
                <span class="text-dim">{{ item.location }}</span>
              </div>
              <p class="m-0 font-sans text-[12.5px] text-dim leading-relaxed">{{ item.description }}</p>
              <ul v-if="item.bullets?.length" class="m-0 pl-4 text-dim text-[11.5px] leading-relaxed flex flex-col gap-1">
                <li v-for="(bullet, bIdx) in item.bullets" :key="bIdx">{{ bullet }}</li>
              </ul>
              <div v-if="item.tags?.length" class="flex flex-wrap gap-1.5 mt-1">
                <span v-for="tag in item.tags" :key="tag" class="text-[10px] text-faint bg-surface-raised border border-rule px-1.5 py-0.5 rounded-[2px]">#{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="h-px bg-rule" />

          <!-- Stack -->
          <div class="ide-section flex flex-col gap-2">
            <div class="text-faint italic text-[10.5px]">// {{ isEs ? 'stack tecnológico' : 'tech stack' }}</div>
            <div class="flex items-baseline gap-2 text-[11px] font-mono">
              <span class="text-sig font-bold">frontend</span>
              <span class="text-dim">: "Vue 3 · Nuxt 4 · React · Next.js · TypeScript · Tailwind · GSAP"</span>
            </div>
            <div class="flex items-baseline gap-2 text-[11px] font-mono">
              <span class="text-sig font-bold">backend </span>
              <span class="text-dim">: "Node.js · Express · FastAPI · Python · PostgreSQL (pgvector) · Prisma"</span>
            </div>
            <div class="flex items-baseline gap-2 text-[11px] font-mono">
              <span class="text-sig font-bold">cloud/ops</span>
              <span class="text-dim">: "Docker · Coolify VPS · Linux · CI/CD · Git · Figma UI/UX · Vitest"</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </article>
</template>

<style scoped>
/* ─── Print Rules (A4 1-Page Dark Technical Layout) ───────────────────────── */
@media print {
  .cv-modern {
    background: #09090b !important;
    color: #f4f4f5 !important;
    border: none !important;
    box-shadow: none !important;
    width: 210mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-container {
    background: #09090b !important;
    border: none !important;
    color: #f4f4f5 !important;
    display: grid !important;
    grid-template-columns: 66mm 144mm !important;
    width: 210mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-modern .ide-sidebar {
    background: #121215 !important;
    border-right: 0.75pt solid rgba(255, 255, 255, 0.15) !important;
    width: 66mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-window-controls {
    background: #19191e !important;
    border-bottom: 0.5pt solid rgba(255, 255, 255, 0.15) !important;
    height: 9.5mm !important;
    padding: 0 7mm !important;
    display: flex !important;
    align-items: center !important;
    gap: 4.5pt !important;
    box-sizing: border-box !important;
  }
  .cv-modern .ide-dot {
    width: 5.5pt !important;
    height: 5.5pt !important;
    border-radius: 50% !important;
  }
  .cv-modern .ide-dot.red { background: #ff5f56 !important; }
  .cv-modern .ide-dot.yellow { background: #ffbd2e !important; }
  .cv-modern .ide-dot.green { background: #27c93f !important; }
  .cv-modern .ide-file-title {
    color: #ff3e00 !important;
    font-weight: 700 !important;
    font-size: 7.5pt !important;
    margin-left: auto !important;
  }
  .cv-modern .ide-sidebar-inner {
    height: calc(297mm - 9.5mm) !important;
    padding: 6.5mm 7mm 7mm !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    flex: 1 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-tree-block {
    display: flex !important;
    flex-direction: column !important;
    gap: 2pt !important;
  }
  .cv-modern .ide-sidebar-header {
    color: #ff3e00 !important;
    font-weight: 700 !important;
    font-size: 7.8pt !important;
    margin-bottom: 2pt !important;
  }
  .cv-modern .ide-tree {
    display: flex !important;
    flex-direction: column !important;
    gap: 2pt !important;
  }
  .cv-modern .ide-tree-group {
    display: flex !important;
    flex-direction: column !important;
    gap: 1pt !important;
  }
  .cv-modern .ide-tree-folder {
    color: #ff3e00 !important;
    font-size: 7.4pt !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-tree-bullet {
    color: #929298 !important;
  }
  .cv-modern .ide-tree-files {
    font-size: 6.9pt !important;
    gap: 1pt !important;
    padding-left: 7pt !important;
    margin: 0 !important;
    list-style: none !important;
    display: flex !important;
    flex-direction: column !important;
    color: #929298 !important;
  }
  .cv-modern .ide-divider {
    background: rgba(255, 255, 255, 0.15) !important;
    height: 0.5pt !important;
    margin: 0 !important;
  }
  .cv-modern .ide-photo-wrap {
    width: 100% !important;
    margin: 0 !important;
  }
  .cv-modern .ide-photo {
    width: 100% !important;
    aspect-ratio: 1 !important;
    height: auto !important;
    object-fit: cover !important;
    object-position: center top !important;
    filter: grayscale(20%) !important;
    border: none !important;
    display: block !important;
  }
  .cv-modern .ide-sidebar-section {
    display: flex !important;
    flex-direction: column !important;
    gap: 1.8pt !important;
  }
  .cv-modern .ide-edu-item {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.8pt !important;
    margin-bottom: 1.5pt !important;
  }
  .cv-modern .ide-edu-school {
    color: #f4f4f5 !important;
    font-weight: 700 !important;
    font-size: 7.4pt !important;
  }
  .cv-modern .ide-edu-degree {
    color: #ff3e00 !important;
    font-size: 6.9pt !important;
  }
  .cv-modern .ide-edu-sub {
    color: #929298 !important;
    font-size: 6.5pt !important;
  }
  .cv-modern .ide-comment {
    color: #929298 !important;
    font-size: 6.9pt !important;
    margin-bottom: 1pt !important;
    font-style: italic !important;
  }
  .cv-modern .ide-key-val {
    gap: 1.8pt !important;
    font-size: 6.9pt !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 0 !important;
    margin: 0 !important;
    list-style: none !important;
  }
  .cv-modern .ide-key-val li {
    display: flex !important;
    justify-content: space-between !important;
  }
  .cv-modern .ide-key-val li span {
    color: #929298 !important;
  }
  .cv-modern .ide-highlight {
    color: #ff3e00 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-contact-list {
    gap: 1.8pt !important;
    font-size: 6.8pt !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 0 !important;
    margin: 0 !important;
    list-style: none !important;
  }
  .cv-modern .ide-contact-list a,
  .cv-modern .ide-loc {
    color: #929298 !important;
    text-decoration: none !important;
  }

  /* Main Editor */
  .cv-modern .ide-main {
    background: #09090b !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    width: 144mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-tabs {
    background: #121215 !important;
    border-bottom: 0.5pt solid rgba(255, 255, 255, 0.15) !important;
    display: flex !important;
    height: 9.5mm !important;
    box-sizing: border-box !important;
  }
  .cv-modern .ide-tab {
    color: #929298 !important;
    border-right: 0.5pt solid rgba(255, 255, 255, 0.15) !important;
    padding: 0 10pt !important;
    height: 9.5mm !important;
    display: flex !important;
    align-items: center !important;
    font-size: 7.5pt !important;
    box-sizing: border-box !important;
  }
  .cv-modern .ide-tab.active {
    background: #09090b !important;
    color: #ff3e00 !important;
    border-top: 1.5pt solid #ff3e00 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-editor-content {
    height: calc(297mm - 9.5mm) !important;
    padding: 6.5mm 11mm 7.5mm !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    flex: 1 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-header {
    display: flex !important;
    flex-direction: column !important;
    gap: 1pt !important;
  }
  .cv-modern .ide-name {
    color: #f4f4f5 !important;
    font-size: 19pt !important;
    margin: 1.5pt 0 1pt !important;
    line-height: 1.15 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-name::after {
    content: ' _' !important;
    color: #ff3e00 !important;
    display: inline !important;
  }
  .cv-modern .ide-role {
    color: #ff3e00 !important;
    font-size: 9pt !important;
    font-weight: 700 !important;
    margin: 0 !important;
  }
  .cv-modern .ide-hr {
    background: rgba(255, 255, 255, 0.15) !important;
    height: 0.5pt !important;
    margin: 0 !important;
  }
  .cv-modern .ide-section {
    display: flex !important;
    flex-direction: column !important;
    gap: 2pt !important;
  }
  .cv-modern .ide-text {
    color: #929298 !important;
    font-size: 7.9pt !important;
    line-height: 1.38 !important;
    margin: 0 !important;
  }
  .cv-modern .ide-exp-item {
    display: flex !important;
    flex-direction: column !important;
    gap: 1.5pt !important;
    margin-bottom: 4pt !important;
    padding-bottom: 3.5pt !important;
    border-bottom: 0.5pt dashed rgba(255, 255, 255, 0.12) !important;
    break-inside: avoid !important;
  }
  .cv-modern .ide-exp-item:last-child {
    border-bottom: none !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }
  .cv-modern .ide-exp-top-row,
  .cv-modern .ide-exp-sub-row {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    gap: 6pt !important;
  }
  .cv-modern .ide-exp-title {
    color: #f4f4f5 !important;
    font-weight: 700 !important;
    font-size: 9.1pt !important;
  }
  .cv-modern .ide-exp-badge {
    color: #ff3e00 !important;
    font-size: 6.6pt !important;
    border: 0.5pt solid rgba(255, 255, 255, 0.15) !important;
    background: #19191e !important;
    padding: 0.5pt 3pt !important;
    border-radius: 2px !important;
    margin-left: 4pt !important;
  }
  .cv-modern .ide-exp-date {
    color: #929298 !important;
    font-size: 7.3pt !important;
  }
  .cv-modern .ide-exp-role {
    color: #ff3e00 !important;
    font-size: 8.1pt !important;
    font-weight: 600 !important;
  }
  .cv-modern .ide-exp-loc {
    color: #929298 !important;
    font-size: 7.3pt !important;
  }
  .cv-modern .ide-exp-desc {
    color: #929298 !important;
    font-size: 7.6pt !important;
    line-height: 1.34 !important;
    margin: 0 !important;
  }
  .cv-modern .ide-exp-bullets {
    padding-left: 10pt !important;
    gap: 1pt !important;
    margin: 1.5pt 0 0 !important;
    list-style: none !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .cv-modern .ide-exp-bullets li {
    font-size: 7.4pt !important;
    line-height: 1.3 !important;
    color: #929298 !important;
    position: relative !important;
  }
  .cv-modern .ide-exp-bullets li::before {
    content: '·' !important;
    position: absolute !important;
    left: -8pt !important;
    color: #ff3e00 !important;
    font-weight: bold !important;
    font-size: 9pt !important;
  }
  .cv-modern .ide-exp-tags {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 2.5pt !important;
    margin-top: 1.5pt !important;
  }
  .cv-modern .ide-tag {
    font-size: 6.6pt !important;
    padding: 0.75pt 3pt !important;
    background: #19191e !important;
    border: 0.5pt solid rgba(255, 255, 255, 0.1) !important;
    color: #929298 !important;
    border-radius: 2px !important;
  }
  .cv-modern .ide-stack-group {
    display: flex !important;
    gap: 6pt !important;
    font-size: 7.3pt !important;
    line-height: 1.35 !important;
  }
  .cv-modern .ide-stack-label {
    color: #ff3e00 !important;
    font-weight: 700 !important;
    width: 58px !important;
    flex-shrink: 0 !important;
  }
  .cv-modern .ide-stack-val {
    color: #929298 !important;
  }
}
</style>
