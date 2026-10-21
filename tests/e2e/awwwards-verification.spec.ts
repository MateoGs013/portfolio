import { test } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const AUDIT_DIR = path.resolve('C:/Users/mateo/.gemini/antigravity/brain/bcdd92ec-799f-40d9-9f49-0151fcc8ec95/audit')

test.beforeAll(() => {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true })
  }
})

test('Verification: Linear Structural Sidebar, Hub Spokes, Wake Slider & Zen Hyperfocus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // 1. Desktop Root with collapsed Linear Sidebar Rail (56px) & Hero Micro-Pitch Frontend
  await page.screenshot({ path: path.join(AUDIT_DIR, 'verify-sidebar-collapsed.png'), fullPage: false })

  // 1b. Capture Hero Card with Frontend specialty
  const heroCard = page.locator('article').first()
  if (await heroCard.isVisible()) {
    await heroCard.screenshot({ path: path.join(AUDIT_DIR, 'verify-hero-micro-pitch-frontend.png') })

    // Click Arquitectura & DB tab
    const archTab = heroCard.getByRole('tab', { name: /Arquitectura/i })
    if (await archTab.isVisible()) {
      await archTab.click()
      await page.waitForTimeout(300)
      await heroCard.screenshot({ path: path.join(AUDIT_DIR, 'verify-hero-micro-pitch-architecture.png') })
    }

    // Click Agentes & IA tab
    const aiTab = heroCard.getByRole('tab', { name: /Agentes/i })
    if (await aiTab.isVisible()) {
      await aiTab.click()
      await page.waitForTimeout(300)
      await heroCard.screenshot({ path: path.join(AUDIT_DIR, 'verify-hero-micro-pitch-ai.png') })
    }

    // Switch back to Frontend
    const feTab = heroCard.getByRole('tab', { name: /Frontend/i })
    if (await feTab.isVisible()) {
      await feTab.click()
      await page.waitForTimeout(300)
    }

    // Hover over H1 title to verify zero jitter and rock-solid stability
    const h1Title = heroCard.locator('h1')
    if (await h1Title.isVisible()) {
      await h1Title.hover()
      await page.waitForTimeout(250)
      await heroCard.screenshot({ path: path.join(AUDIT_DIR, 'verify-title-hover-stable.png') })
    }
  }

  // 2. Expand Sidebar
  const toggleBtn = page.locator('.sbr-toggle')
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(AUDIT_DIR, 'verify-sidebar-expanded.png'), fullPage: false })
    // Colapsar de nuevo
    await toggleBtn.click()
    await page.waitForTimeout(300)
  }

  // 3. Scroll to Bento Showcase (Wake slider + Rolling Counter)
  const benchSection = page.locator('.bench-showcase')
  if (await benchSection.isVisible()) {
    await benchSection.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(AUDIT_DIR, 'verify-wake-slider-symmetry.png'), fullPage: false })
  }

  // 4. Capture Hub Diagram in Bento
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const hubCard = page.locator('article:has(.hub)')
  if (await hubCard.isVisible()) {
    await hubCard.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await hubCard.screenshot({ path: path.join(AUDIT_DIR, 'verify-hub-card-element.png') })
  }

  // 5. Hyperfocus Mode Whitepaper
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.keyboard.press('h')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(AUDIT_DIR, 'verify-hyperfocus-zen.png'), fullPage: false })
  // Scroll down in hyperfocus
  await page.evaluate(() => {
    const main = document.querySelector('main#contenido')
    if (main) main.scrollTop = 500
  })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(AUDIT_DIR, 'verify-hyperfocus-whitepaper-body.png'), fullPage: false })

  // 6. Mobile 375px
  await page.keyboard.press('h') // Exit hyperfocus
  await page.waitForTimeout(300)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(AUDIT_DIR, 'verify-mobile-375.png'), fullPage: false })
})
