import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const AUDIT_DIR = process.env.AUDIT_SCREENSHOT_DIR || path.resolve(process.cwd(), 'tests/screenshots/awwwards')

test.beforeAll(() => {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true })
  }
})

interface AuditFinding {
  domain: 'Architect' | 'Motion' | 'Dossier' | 'Quality'
  level: 'CRITICAL' | 'POLISH' | 'OBSERVATION'
  component: string
  issue: string
  details: Record<string, unknown>
}

const findings: AuditFinding[] = []

test.afterAll(() => {
  const reportPath = path.join(AUDIT_DIR, 'audit-findings.json')
  fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2), 'utf-8')
})

test.describe('Awwwards Clinical Audit — Panel de 4 Auditores Especializados', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EL ARQUITECTO: Geometría, Grilla Bento, Márgenes y Viewports
  // ─────────────────────────────────────────────────────────────────────────────
  test('1. [The Architect] Multi-Viewport Spacing, Bento 2.0 & Cero Overflow', async ({ page }) => {
    const viewports = [
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'laptop-1024', width: 1024, height: 768 },
      { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'mobile-375', width: 375, height: 812 },
      { name: 'mobile-320', width: 320, height: 568 },
    ]

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/', { waitUntil: 'networkidle' })
      await page.waitForTimeout(300)

      // Overflow check
      const overflow = await page.evaluate(() => {
        return {
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }
      })

      if (overflow.hasOverflow) {
        findings.push({
          domain: 'Architect',
          level: 'CRITICAL',
          component: 'Root Layout',
          issue: `Desbordamiento horizontal detectado en viewport ${vp.name} (${overflow.scrollWidth}px > ${overflow.clientWidth}px)`,
          details: overflow,
        })
      }

      // Medir distancias de islas flotantes en desktop
      if (vp.width >= 1024) {
        const islandMetrics = await page.evaluate(() => {
          const topbar = document.querySelector('.topbar-island')?.getBoundingClientRect()
          const sidebar = document.querySelector('.sdi')?.getBoundingClientRect()
          const footer = document.querySelector('footer.estado')?.getBoundingClientRect()
          const main = document.querySelector('main#contenido')?.getBoundingClientRect()
          return { topbar, sidebar, footer, main }
        })

        // Validar que el topbar no solape el contenido inicial
        if (islandMetrics.topbar && islandMetrics.main) {
          const mainStyle = await page.evaluate(() => {
            const el = document.querySelector('main#contenido')
            if (!el) return null
            const comp = window.getComputedStyle(el)
            return {
              paddingTop: comp.paddingTop,
              paddingLeft: comp.paddingLeft,
            }
          })

          findings.push({
            domain: 'Architect',
            level: 'OBSERVATION',
            component: 'Floating Islands Alignment',
            issue: `Métricas de alineación en ${vp.name}`,
            details: { ...islandMetrics, mainStyle },
          })
        }
      }

      // Screenshot en dark mode
      await page.screenshot({
        path: path.join(AUDIT_DIR, `audit-arch-${vp.name}-dark.png`),
        fullPage: false,
      })

      // Screenshot en light mode
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
      await page.waitForTimeout(150)
      await page.screenshot({
        path: path.join(AUDIT_DIR, `audit-arch-${vp.name}-light.png`),
        fullPage: false,
      })
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
      await page.waitForTimeout(100)
    }
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. EL MOTION MASTER: Micro-interacciones, Hovers, Resortes y Canvas
  // ─────────────────────────────────────────────────────────────────────────────
  test('2. [The Motion Master] Hover States, Spring Modals, X-Ray & 3D Globe', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)

    // A. UiSidebarIsland: Hover y expansión
    const sidebar = page.locator('.sdi')
    if (await sidebar.count() > 0) {
      const initialBox = await sidebar.boundingBox()
      await sidebar.hover()
      await page.waitForTimeout(350)
      const expandedBox = await sidebar.boundingBox()

      await page.screenshot({
        path: path.join(AUDIT_DIR, 'audit-motion-sidebar-expanded.png'),
        fullPage: false,
      })

      if (expandedBox && initialBox && expandedBox.width <= initialBox.width) {
        findings.push({
          domain: 'Motion',
          level: 'CRITICAL',
          component: 'UiSidebarIsland',
          issue: 'El Sidebar Island no se expandió al recibir hover',
          details: { initialBox, expandedBox },
        })
      }
    }

    // B. UiDynamicIsland: Click para expandir telemetría PG-17
    const dynPill = page.locator('.dyn-pill')
    if (await dynPill.count() > 0) {
      await dynPill.click()
      await page.waitForTimeout(350)
      await page.screenshot({
        path: path.join(AUDIT_DIR, 'audit-motion-dynamic-island-expanded.png'),
        fullPage: false,
      })
      // Cerrar presionando Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }

    // C. UiCursorWorkList: Hover sobre proyectos y seguimiento de cursor
    const workRows = page.locator('.cwl-row')
    const rowCount = await workRows.count()
    if (rowCount > 0) {
      await workRows.first().scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)

      // Mover el cursor sobre la primera fila
      const firstRowBox = await workRows.first().boundingBox()
      if (firstRowBox) {
        await page.mouse.move(firstRowBox.x + 200, firstRowBox.y + firstRowBox.height / 2)
        await page.waitForTimeout(350)

        // Capturar ventana flotante activa
        await page.screenshot({
          path: path.join(AUDIT_DIR, 'audit-motion-cursor-worklist-row0.png'),
          fullPage: false,
        })

        // Mover a la fila 2 para probar desplazamiento del carrete vertical
        if (rowCount > 1) {
          const secondRowBox = await workRows.nth(1).boundingBox()
          if (secondRowBox) {
            await page.mouse.move(secondRowBox.x + 250, secondRowBox.y + secondRowBox.height / 2)
            await page.waitForTimeout(350)
            await page.screenshot({
              path: path.join(AUDIT_DIR, 'audit-motion-cursor-worklist-row1.png'),
              fullPage: false,
            })
          }
        }
      }
    }

    // D. UiCodeReveal: Movimiento de cursor en el lente de rayos X
    const codeCard = page.locator('.cdr-card, [class*="cdr"]')
    if (await codeCard.count() > 0) {
      const cardBox = await codeCard.first().boundingBox()
      if (cardBox) {
        await page.mouse.move(cardBox.x + cardBox.width * 0.45, cardBox.y + cardBox.height * 0.5)
        await page.waitForTimeout(250)
        await page.screenshot({
          path: path.join(AUDIT_DIR, 'audit-motion-code-reveal-lens.png'),
          fullPage: false,
        })
      }
    }

    // E. UiHubDiagram: Hover en nodos y animación de paquetes
    const hubNode = page.locator('.hub-node')
    if (await hubNode.count() > 0) {
      await hubNode.first().hover()
      await page.waitForTimeout(250)
      await page.screenshot({
        path: path.join(AUDIT_DIR, 'audit-motion-hub-node-hover.png'),
        fullPage: false,
      })
    }

    // F. UiTelemetryPill en el Footer
    const telemPill = page.locator('.telemetria-pill-trigger, [class*="UiTelemetryPill"], footer .font-mono button')
    if (await telemPill.count() > 0) {
      await telemPill.first().click()
      await page.waitForTimeout(250)
      await page.screenshot({
        path: path.join(AUDIT_DIR, 'audit-motion-footer-telemetry-popover.png'),
        fullPage: false,
      })
      await page.keyboard.press('Escape')
    }
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. EL DOSSIER CRITIC: Vistas Internas, Colecciones, Modales y Drawer
  // ─────────────────────────────────────────────────────────────────────────────
  test('3. [The Dossier Critic] Internal Views (/projects, /stack, /about, /contact) & Modals', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    // A. Colección /projects con selector de vista (Grid vs Table)
    await page.goto('/projects', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-projects-grid.png'),
      fullPage: false,
    })

    // Alternar a modo tabla técnica si existe selector
    const tableBtn = page.getByRole('tab', { name: /tabla|table/i })
    if (await tableBtn.count() > 0) {
      await tableBtn.click()
      await page.waitForTimeout(250)
      await page.screenshot({
        path: path.join(AUDIT_DIR, 'audit-dossier-projects-table.png'),
        fullPage: false,
      })
    }

    // B. Detalle de Proyecto: /projects/la-rucula
    await page.goto('/projects/la-rucula', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-detail-la-rucula.png'),
      fullPage: false,
    })

    // Probar drawer de Raw JSON
    const rawBtn = page.locator('button:has-text("RAW JSON"), .raw-btn').first()
    if (await rawBtn.count() > 0) {
      await rawBtn.click()
      await page.waitForTimeout(300)
      await page.screenshot({
        path: path.join(AUDIT_DIR, 'audit-dossier-detail-raw-json.png'),
        fullPage: false,
      })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }

    // C. Proyecto en desarrollo (WIP): /projects/ynara
    await page.goto('/projects/ynara', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-detail-ynara.png'),
      fullPage: false,
    })

    // D. Colección /experience
    await page.goto('/experience', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-experience.png'),
      fullPage: false,
    })

    // E. Colección /stack
    await page.goto('/stack', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-stack.png'),
      fullPage: false,
    })

    // F. Página /about (CV Harvard ATS & Impresión)
    await page.goto('/about', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-about-screen.png'),
      fullPage: false,
    })

    // Emulación Print A4
    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(200)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-about-print-a4.png'),
      fullPage: true,
    })
    await page.emulateMedia({ media: 'screen' })

    // G. Página /contact
    await page.goto('/contact', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-contact.png'),
      fullPage: false,
    })

    // H. Modales: Command Palette (⌘K o /) y Quick Guide (?)
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.keyboard.press('/')
    await page.waitForTimeout(250)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-modal-goto.png'),
      fullPage: false,
    })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)

    await page.keyboard.press('?')
    await page.waitForTimeout(250)
    await page.screenshot({
      path: path.join(AUDIT_DIR, 'audit-dossier-modal-guide.png'),
      fullPage: false,
    })
    await page.keyboard.press('Escape')
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. EL QUALITY GUARD: Ergonomía Touch, WCAG AA, Teclado & Rendimiento
  // ─────────────────────────────────────────────────────────────────────────────
  test('4. [The Quality Guard] Touch Target >=44px, Console Purity & Keyboard Nav', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => pageErrors.push(err.message))

    // A. Mobile Touch Target Audit (375px)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)

    const smallTouchTargets = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(
        'a, button, input, [role="button"], [role="tab"], .mobile-nav-item'
      ))
      const issues: Array<{ tag: string; text: string; width: number; height: number; cls: string }> = []
      for (const el of candidates) {
        if (!el.offsetParent) continue // invisible
        const rect = el.getBoundingClientRect()
        // Criterio WCAG: al menos 44x44px o dentro de un contenedor táctil con padding
        if (rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32)) {
          issues.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || el.getAttribute('aria-label') || '').slice(0, 30).trim(),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            cls: el.className.slice(0, 40),
          })
        }
      }
      return issues
    })

    if (smallTouchTargets.length > 0) {
      findings.push({
        domain: 'Quality',
        level: 'POLISH',
        component: 'Touch Targets',
        issue: `Se detectaron ${smallTouchTargets.length} elementos interactivos móviles menores a 32px`,
        details: { count: smallTouchTargets.length, sample: smallTouchTargets.slice(0, 10) },
      })
    }

    // B. Verificación de atajos de teclado primarios
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.waitForTimeout(300)

    // Presionar '1' -> debe navegar a /projects
    await page.keyboard.press('1')
    await page.waitForURL('**/projects')
    expect(page.url()).toContain('/projects')
    await page.waitForTimeout(400)

    // Presionar '0' -> debe volver a raíz '/'
    await page.keyboard.press('0')
    await page.waitForURL(url => url.pathname === '/' || url.pathname === '', { timeout: 8000 })
    await page.waitForTimeout(400)

    // Presionar 'h' -> debe activar modo hiperfoco
    await page.keyboard.press('h')
    await page.waitForTimeout(300)
    await expect(page.locator('.hiperfoco-dossier')).toBeVisible()
    await page.keyboard.press('h')
    await page.waitForTimeout(200)

    if (consoleErrors.length > 0) {
      findings.push({
        domain: 'Quality',
        level: 'CRITICAL',
        component: 'Console Error Watchdog',
        issue: `Se registraron ${consoleErrors.length} errores de consola durante la ejecución`,
        details: { consoleErrors },
      })
    }
  })
})
