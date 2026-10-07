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
  <article class="cv-modern">
    <div class="ide-container">
      <!-- Sidebar -->
      <aside class="ide-sidebar">
        <div class="ide-window-controls">
          <span class="ide-dot red" aria-hidden="true" />
          <span class="ide-dot yellow" aria-hidden="true" />
          <span class="ide-dot green" aria-hidden="true" />
          <span class="ide-file-title">package.json</span>
        </div>

        <div class="ide-sidebar-inner">
          <div class="ide-tree-block">
            <div class="ide-sidebar-header">
              <span class="ide-tree-root">~/curriculum</span>
            </div>
            
            <div class="ide-tree">
              <div class="ide-tree-group">
                <div class="ide-tree-folder">
                  <span class="ide-tree-bullet">▼</span> src/
                </div>
                <ul class="ide-tree-files">
                  <li><span class="ide-tree-bullet">·</span> profile.ts</li>
                  <li><span class="ide-tree-bullet">·</span> experience.vue</li>
                  <li><span class="ide-tree-bullet">·</span> stack.py</li>
                  <li><span class="ide-tree-bullet">·</span> education.sql</li>
                </ul>
              </div>
              <div class="ide-tree-group">
                <div class="ide-tree-folder">
                  <span class="ide-tree-bullet">▼</span> config/
                </div>
                <ul class="ide-tree-files">
                  <li><span class="ide-tree-bullet">·</span> contact.env</li>
                  <li><span class="ide-tree-bullet">·</span> nuxt.config.ts</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="ide-divider" />

          <div class="ide-photo-wrap">
            <img
              src="/media/profile/mateo-front.png"
              alt="Mateo Gabriel Sonzogni"
              class="ide-photo"
              loading="eager"
            >
          </div>

          <div class="ide-divider" />

          <!-- Formación / Education -->
          <div class="ide-sidebar-section">
            <div class="ide-comment">// {{ isEs ? 'formación técnica' : 'education' }}</div>
            <div class="ide-edu-item">
              <div class="ide-edu-school">ESCUELA DA VINCI</div>
              <div class="ide-edu-degree">{{ isEs ? 'Diseño y Desarrollo Web' : 'Web Design & Dev' }} (2024–2026)</div>
              <div class="ide-edu-sub">{{ isEs ? 'Tesis: Ynara (Lead Front & Arq.)' : 'Thesis: Ynara (Lead Front & Arch)' }}</div>
            </div>
            <div class="ide-edu-item">
              <div class="ide-edu-school">CET N.º 30</div>
              <div class="ide-edu-degree">{{ isEs ? 'Técnico en Programación' : 'Programming Tech' }} (2017–2023)</div>
              <div class="ide-edu-sub">{{ isEs ? 'Plan integral de 7 años' : '7-year technical program' }}</div>
            </div>
          </div>

          <div class="ide-divider" />

          <!-- Stats & Idiomas -->
          <div class="ide-sidebar-section">
            <div class="ide-comment">// {{ isEs ? 'métricas & idiomas' : 'metrics & languages' }}</div>
            <ul class="ide-key-val">
              <li><span>{{ isEs ? 'Español' : 'Spanish' }}</span> <span class="ide-highlight">{{ isEs ? 'Nativo' : 'Native' }}</span></li>
              <li><span>{{ isEs ? 'Inglés' : 'English' }}</span> <span class="ide-highlight">{{ isEs ? 'B2 Profesional' : 'B2 Professional' }}</span></li>
              <li><span>{{ isEs ? 'Experiencia' : 'Experience' }}</span> <span class="ide-highlight">{{ isEs ? '+3 años' : '3+ yrs' }}</span></li>
              <li><span>{{ isEs ? 'Proyectos' : 'Projects' }}</span> <span class="ide-highlight">~10 apps</span></li>
              <li><span>{{ isEs ? 'Disponibilidad' : 'Availability' }}</span> <span class="ide-highlight">{{ isEs ? 'Inmediata' : 'Immediate' }}</span></li>
              <li><span>{{ isEs ? 'Zona Horaria' : 'Timezone' }}</span> <span class="ide-highlight">{{ timezone }}</span></li>
            </ul>
          </div>

          <div class="ide-divider" />

          <!-- Contact -->
          <div class="ide-sidebar-section">
            <div class="ide-comment">// {{ isEs ? 'contacto' : 'contact' }}</div>
            <ul class="ide-contact-list">
              <li><a :href="`mailto:${email}`">{{ email }}</a></li>
              <li><a :href="github" target="_blank" rel="noopener noreferrer">@{{ githubText.replace('github.com/', '') }}</a></li>
              <li><a :href="linkedin" target="_blank" rel="noopener noreferrer">in/mateo-sonzogni</a></li>
              <li><span class="ide-loc">{{ location }}</span></li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- Main Editor -->
      <main class="ide-main">
        <div class="ide-tabs">
          <div class="ide-tab active">cv.ts</div>
          <div class="ide-tab">README.md</div>
        </div>

        <div class="ide-editor-content">
          <header class="ide-header">
            <div class="ide-comment">// curriculum vitae — mateo sonzogni, 2026</div>
            <h1 class="ide-name">{{ name }}</h1>
            <p class="ide-role">{{ role }}</p>
          </header>

          <div class="ide-hr" />

          <!-- Profile -->
          <div class="ide-section">
            <div class="ide-comment">// profile</div>
            <p class="ide-text">{{ bio }}</p>
          </div>

          <div class="ide-hr" />

          <!-- Experience & Projects -->
          <div class="ide-section">
            <div class="ide-comment">// {{ isEs ? 'experiencia profesional & proyectos en producción' : 'professional experience & shipped projects' }}</div>
            
            <div v-for="item in deliverables" :key="item.slug" class="ide-exp-item">
              <div class="ide-exp-top-row">
                <div class="ide-exp-title-wrap">
                  <span class="ide-exp-title">{{ item.title }}</span>
                  <span v-if="item.badge" class="ide-exp-badge">{{ item.badge }}</span>
                </div>
                <span class="ide-exp-date">{{ item.date }}</span>
              </div>
              <div class="ide-exp-sub-row">
                <span class="ide-exp-role">{{ item.role }}</span>
                <span class="ide-exp-loc">{{ item.location }}</span>
              </div>
              <p class="ide-exp-desc">{{ item.description }}</p>
              <ul v-if="item.bullets?.length" class="ide-exp-bullets">
                <li v-for="(bullet, bIdx) in item.bullets" :key="bIdx">{{ bullet }}</li>
              </ul>
              <div v-if="item.tags?.length" class="ide-exp-tags">
                <span v-for="tag in item.tags" :key="tag" class="ide-tag">#{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="ide-hr" />

          <!-- Stack -->
          <div class="ide-section">
            <div class="ide-comment">// {{ isEs ? 'stack tecnológico' : 'tech stack' }}</div>
            <div class="ide-stack-group">
              <span class="ide-stack-label">frontend</span>
              <span class="ide-stack-val">: "Vue 3 · Nuxt 4 · React · Next.js · TypeScript · Tailwind · GSAP"</span>
            </div>
            <div class="ide-stack-group">
              <span class="ide-stack-label">backend </span>
              <span class="ide-stack-val">: "Node.js · Express · FastAPI · Python · PostgreSQL (pgvector) · Prisma"</span>
            </div>
            <div class="ide-stack-group">
              <span class="ide-stack-label">cloud/ops</span>
              <span class="ide-stack-val">: "Docker · Coolify VPS · Linux · CI/CD · Git · Figma UI/UX · Vitest"</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  </article>
</template>

<style scoped>
.cv-modern {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
}

.ide-container {
  display: flex;
  background: var(--d-paper);
  border: 1px solid var(--d-rule-strong);
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: 11px;
}

.ide-sidebar {
  width: 260px;
  background: var(--d-surface);
  border-right: 1px solid var(--d-rule-strong);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.ide-window-controls {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid var(--d-rule-strong);
  background: var(--d-surface-raised);
}

.ide-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.ide-dot.red { background: #ff5f56; }
.ide-dot.yellow { background: #ffbd2e; }
.ide-dot.green { background: #27c93f; }

.ide-file-title {
  margin-left: auto;
  color: var(--d-sig);
  font-size: 11px;
}

.ide-sidebar-inner {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ide-tree-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ide-sidebar-header {
  color: var(--d-sig);
  font-size: 11.5px;
}

.ide-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ide-tree-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ide-tree-folder {
  color: var(--d-sig);
}

.ide-tree-bullet {
  color: var(--d-dim);
  margin-right: 4px;
}

.ide-tree-files {
  list-style: none;
  padding: 0 0 0 14px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--d-dim);
}

.ide-divider {
  height: 1px;
  background: var(--d-rule-strong);
}

.ide-hr {
  height: 1px;
  background: var(--d-rule-strong);
  margin: 18px 0;
}

.ide-photo-wrap {
  width: 100%;
}
.ide-photo {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(20%);
}

.ide-sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ide-edu-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}
.ide-edu-school {
  color: var(--d-ink);
  font-weight: 700;
  font-size: 11px;
}
.ide-edu-degree {
  color: var(--d-sig);
  font-size: 10.5px;
}
.ide-edu-sub {
  color: var(--d-dim);
  font-size: 10px;
}

.ide-comment {
  color: var(--d-dim);
  font-style: italic;
  margin-bottom: 4px;
}

.ide-key-val {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--d-dim);
}

.ide-key-val li {
  display: flex;
  justify-content: space-between;
}

.ide-highlight {
  color: var(--d-sig);
}

.ide-contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ide-contact-list a, .ide-loc {
  color: var(--d-dim);
  text-decoration: none;
}
.ide-contact-list a:hover {
  color: var(--d-ink);
  text-decoration: underline;
}

/* Editor Main */
.ide-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--d-paper);
}

.ide-tabs {
  display: flex;
  border-bottom: 1px solid var(--d-rule-strong);
  background: var(--d-surface);
}

.ide-tab {
  padding: 10px 16px;
  color: var(--d-dim);
  border-right: 1px solid var(--d-rule-strong);
}
.ide-tab.active {
  background: var(--d-paper);
  color: var(--d-sig);
  border-top: 2px solid var(--d-sig);
  margin-top: -1px;
}

.ide-editor-content {
  padding: 24px 32px;
  flex: 1;
}

.ide-header {
  display: flex;
  flex-direction: column;
}

.ide-name {
  margin: 12px 0 4px;
  font-size: 26px;
  font-weight: 700;
  color: var(--d-ink);
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
}

.ide-name::after {
  content: ' _';
  color: var(--d-sig);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.ide-role {
  margin: 0;
  color: var(--d-sig);
  font-size: 12.5px;
  font-weight: 600;
}

.ide-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ide-text {
  margin: 0;
  color: var(--d-dim);
  font-size: 12px;
  line-height: 1.55;
}

.ide-exp-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--d-rule);
}
.ide-exp-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.ide-exp-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.ide-exp-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ide-exp-title {
  color: var(--d-ink);
  font-weight: 700;
  font-size: 14px;
}

.ide-exp-badge {
  color: var(--d-sig);
  border: 1px solid var(--d-rule-strong);
  background: var(--d-surface-raised);
  padding: 1px 6px;
  font-size: 9.5px;
  border-radius: 2px;
}

.ide-exp-date {
  color: var(--d-dim);
  font-size: 11px;
  flex-shrink: 0;
}

.ide-exp-sub-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.ide-exp-role {
  color: var(--d-sig);
  font-size: 12px;
  font-weight: 500;
}

.ide-exp-loc {
  color: var(--d-dim);
  font-size: 10.5px;
}

.ide-exp-desc {
  margin: 2px 0 0;
  color: var(--d-dim);
  font-size: 11.5px;
  line-height: 1.5;
}

.ide-exp-bullets {
  margin: 4px 0 0;
  padding-left: 14px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ide-exp-bullets li {
  position: relative;
  color: var(--d-dim);
  font-size: 11px;
  line-height: 1.45;
}

.ide-exp-bullets li::before {
  content: '·';
  position: absolute;
  left: -10px;
  color: var(--d-sig);
  font-weight: bold;
}

.ide-exp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}

.ide-tag {
  color: var(--d-dim);
  background: var(--d-surface-raised);
  border: 1px solid var(--d-rule);
  padding: 1px 6px;
  font-size: 10px;
  border-radius: 2px;
}

.ide-stack-group {
  display: flex;
  gap: 12px;
  color: var(--d-dim);
}

.ide-stack-label {
  color: var(--d-sig);
  width: 65px;
}
.ide-stack-val {
  color: var(--d-dim);
}

/* ─── Responsive Screen Rules ─────────────────────────────────────────────── */
@media screen and (max-width: 820px) {
  .ide-container {
    flex-direction: column;
  }
  .ide-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--d-rule-strong);
  }
  .ide-photo-wrap {
    width: 110px;
    margin: 0 auto;
  }
  .ide-editor-content {
    padding: 18px 16px;
  }
  .ide-name {
    font-size: 22px;
  }
}

@media screen and (max-width: 520px) {
  .ide-editor-content {
    padding: 14px 12px;
  }
  .ide-name {
    font-size: 19px;
  }
  .ide-role {
    font-size: 11.5px;
  }
  .ide-tabs {
    overflow-x: auto;
  }
  .ide-tab {
    padding: 8px 12px;
    font-size: 11px;
  }
  .ide-exp-top-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .ide-exp-title {
    font-size: 13px;
  }
  .ide-exp-title-wrap {
    flex-wrap: wrap;
  }
  .ide-exp-sub-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
  }
  .ide-exp-bullets {
    padding-left: 12px;
  }
  .ide-stack-group {
    flex-direction: column;
    gap: 2px;
  }
  .ide-stack-label {
    width: auto;
  }
  .ide-key-val li {
    font-size: 11px;
  }
}

/* ─── Print Rules ──────────────────────────────────────────────────────────── */
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
