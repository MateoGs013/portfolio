import { test, expect } from '@playwright/test'

test.describe('Auditoría Integral de Rutas — Portafolio Mateo Sonzogni', () => {
  // 1. Rutas canónicas principales
  const canonicalRoutes = [
    { path: '/', label: 'db / root', expectedText: 'CONSTRUIR CON PROPÓSITO' },
    { path: '/projects', label: 'projects', expectedText: 'proyectos' },
    { path: '/experience', label: 'experience', expectedText: 'experiencia' },
    { path: '/stack', label: 'stack', expectedText: 'stack' },
    { path: '/articles', label: 'articles', expectedText: 'artículos' },
    { path: '/about', label: 'about', expectedText: 'Mateo Gabriel Sonzogni' },
    { path: '/contact', label: 'contact', expectedText: 'mateogabus@gmail.com' },
    { path: '/lab', label: 'lab ui', expectedText: 'Sonzogni × Bencho UI' },
    { path: '/orgs', label: 'orgs', expectedText: 'orgs' },
  ]

  for (const r of canonicalRoutes) {
    test(`Ruta canónica: ${r.path} (${r.label})`, async ({ page }) => {
      const response = await page.goto(r.path, { waitUntil: 'networkidle' })
      expect(response?.status()).toBe(200)

      // Verificar que el contenedor de la aplicación no está en blanco
      await expect(page.locator('#contenido')).toBeVisible()

      // Verificar texto representativo
      const pageContent = await page.content()
      expect(pageContent).toContain(r.expectedText)
    })
  }

  // 2. Rutas de detalle profundo (records individuales)
  const detailRoutes = [
    { path: '/projects/la-rucula', title: 'La Rúcula', checkElement: '.project-dossier, .record-sheet, .ficha' },
    { path: '/projects/arg-piscinas', title: 'ARG Piscinas', checkElement: '.project-dossier, .record-sheet, .ficha' },
    { path: '/projects/ynara', title: 'Ynara', checkElement: '.project-dossier, .record-sheet, .ficha' },
    { path: '/experience/freelance', title: 'Freelance', checkElement: '.experience-dossier, .record-sheet, .ficha' },
    { path: '/stack/vue', title: 'Vue', checkElement: '.record-sheet, .ficha' },
    { path: '/stack/typescript', title: 'TypeScript', checkElement: '.record-sheet, .ficha' },
    { path: '/orgs/la-rucula-gastrobar', title: 'La Rúcula', checkElement: '.record-sheet, .ficha' },
  ]

  for (const d of detailRoutes) {
    test(`Detalle de registro: ${d.path} (${d.title})`, async ({ page }) => {
      const response = await page.goto(d.path, { waitUntil: 'networkidle' })
      expect(response?.status()).toBe(200)
      await expect(page.locator('#contenido')).toBeVisible()

      const content = await page.content()
      expect(content.toLowerCase()).toContain(d.title.toLowerCase())
    })
  }

  // 3. Alias y redirecciones limpias
  const aliasRoutes = [
    { alias: '/experiences', targetSegment: 'experience' },
    { alias: '/experiencias', targetSegment: 'experience' },
    { alias: '/proyectos', targetSegment: 'projects' },
    { alias: '/proyecto', targetSegment: 'projects' },
    { alias: '/skills', targetSegment: 'stack' },
    { alias: '/tecnologias', targetSegment: 'stack' },
    { alias: '/cv', targetSegment: 'about' },
    { alias: '/resume', targetSegment: 'about' },
    { alias: '/blog', targetSegment: 'articles' },
    { alias: '/posts', targetSegment: 'articles' },
    { alias: '/contacto', targetSegment: 'contact' },
    { alias: '/library', targetSegment: 'lab' },
    { alias: '/componentes', targetSegment: 'lab' },
    { alias: '/organizaciones', targetSegment: 'orgs' },
    { alias: '/org', targetSegment: 'orgs' },
  ]

  for (const a of aliasRoutes) {
    test(`Alias de ruta: ${a.alias} → ${a.targetSegment}`, async ({ page }) => {
      const response = await page.goto(a.alias, { waitUntil: 'networkidle' })
      expect(response?.status()).toBe(200)
      await expect(page.locator('#contenido')).toBeVisible()

      // Verificar que el breadcrumb o la cabecera reconoció la sección de destino
      const content = await page.content()
      expect(content).toContain(a.targetSegment)
    })
  }

  // 4. Filtros relacionales por query params
  test('Filtros y facetas: /projects?stack=vue', async ({ page }) => {
    const response = await page.goto('/projects?stack=vue', { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(200)
    await expect(page.locator('#contenido')).toBeVisible()

    // Debe mostrar la faceta activa en la cabecera o lista
    const content = await page.content()
    expect(content).toContain('vue')
  })

  // 5. Navegación por teclado entre rutas (0-7, Backspace)
  test('Navegación continua por teclado: 1, 2, 3, 5, 6, 7, 0', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)

    // Presionar '1' para ir a projects
    await page.keyboard.press('1')
    await page.waitForTimeout(400)
    expect(page.url()).toContain('/projects')

    // Presionar '2' para ir a experience
    await page.keyboard.press('2')
    await page.waitForTimeout(400)
    expect(page.url()).toContain('/experience')

    // Presionar '3' para ir a stack
    await page.keyboard.press('3')
    await page.waitForTimeout(400)
    expect(page.url()).toContain('/stack')

    // Presionar '5' para ir a about
    await page.keyboard.press('5')
    await page.waitForTimeout(400)
    expect(page.url()).toContain('/about')

    // Presionar '6' para ir a contact
    await page.keyboard.press('6')
    await page.waitForTimeout(400)
    expect(page.url()).toContain('/contact')

    // Presionar '7' para ir a lab
    await page.keyboard.press('7')
    await page.waitForTimeout(400)
    expect(page.url()).toContain('/lab')

    // Presionar '0' para volver a la raíz db
    await page.keyboard.press('0')
    await page.waitForTimeout(400)
    expect(page.url()).toMatch(/\/$/)
  })

  // 6. Verificación de sitemap.xml
  test('Sitemap XML: /sitemap.xml', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type'] ?? ''
    expect(contentType).toContain('xml')

    const xml = await page.content()
    expect(xml).toContain('<urlset')
    expect(xml).toContain('<loc>https://mateogs.tech/projects</loc>')
    expect(xml).toContain('<loc>https://mateogs.tech/experience</loc>')
    expect(xml).toContain('<loc>https://mateogs.tech/lab</loc>')
    expect(xml).toContain('<loc>https://mateogs.tech/about</loc>')
  })

  // 7. Resiliencia ante 404 (sin pantalla en blanco ni crash)
  test('Manejo resiliente de ruta 404: /ruta-inexistente-xyz', async ({ page }) => {
    const response = await page.goto('/ruta-inexistente-xyz')
    // El servidor responde con 404
    expect(response?.status()).toBe(404)

    // La interfaz renderiza el marco y detalle de error limpiamente
    await expect(page.locator('#contenido')).toBeVisible()
    const content = await page.content()
    expect(content).toContain('404')
  })
})
