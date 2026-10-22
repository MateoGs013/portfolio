import { test } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const AUDIT_DIR = path.resolve('C:/Users/mateo/.gemini/antigravity/brain/bcdd92ec-799f-40d9-9f49-0151fcc8ec95/audit/responsive-audit')

test.beforeAll(() => {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true })
  }
})

const routes = [
  { name: 'home', path: '/' },
  { name: 'projects', path: '/projects' },
  { name: 'project-detail', path: '/projects/la-rucula' },
  { name: 'experience', path: '/experience' },
  { name: 'stack', path: '/stack' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
  { name: 'lab', path: '/lab' },
]

test('Capture full multi-viewport audit', async ({ page }) => {
  // 1. Desktop 1440x900
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const r of routes) {
    await page.goto(r.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(AUDIT_DIR, `desktop-${r.name}.png`), fullPage: false })
  }

  // 2. Tablet 768x1024
  await page.setViewportSize({ width: 768, height: 1024 })
  for (const r of ['home', 'project-detail', 'about', 'lab']) {
    const found = routes.find(x => x.name === r)!
    await page.goto(found.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(AUDIT_DIR, `tablet-${r}.png`), fullPage: false })
  }

  // 3. Mobile 375x812
  await page.setViewportSize({ width: 375, height: 812 })
  for (const r of ['home', 'project-detail', 'about', 'contact', 'lab']) {
    const found = routes.find(x => x.name === r)!
    await page.goto(found.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(AUDIT_DIR, `mobile375-${r}.png`), fullPage: false })
  }

  // Mobile Menu Drawer Capture
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  await page.click('button[aria-label="Menú de navegación"]')
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(AUDIT_DIR, 'mobile375-menu-drawer.png'), fullPage: false })

  // 4. Mobile Narrow 320x568
  await page.setViewportSize({ width: 320, height: 568 })
  for (const r of ['home', 'project-detail', 'lab']) {
    const found = routes.find(x => x.name === r)!
    await page.goto(found.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(AUDIT_DIR, `mobile320-${r}.png`), fullPage: false })
  }
})
