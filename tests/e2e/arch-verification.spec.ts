import { test, expect } from '@playwright/test';

test.describe('Live VPS Architectural & Layout Verification', () => {
  test('Home loads, renders modular sections, and has zero overflow', async ({ page }) => {
    const res = await page.goto('https://mateogs.tech', { waitUntil: 'networkidle', timeout: 30000 });
    expect(res?.status()).toBe(200);

    // Verify H1
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // Verify Selected Works modular component rendered
    const works = page.locator('article.buser-project-frame');
    await expect(works.first()).toBeVisible();
    const count = await works.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Verify Footer Contact modular component rendered
    const footer = page.locator('footer[aria-label="Contacto directo"]');
    await expect(footer).toBeVisible();
    const mail = footer.locator('a[href^="mailto:"]');
    await expect(mail).toBeVisible();
    await expect(mail).toHaveText('mateogabus@gmail.com');

    // Verify responsive overflow at 375px & 320px
    for (const w of [375, 320]) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.waitForTimeout(300);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    }
  });

  test('Collection routes render correctly (/projects, /stack, /experience)', async ({ page }) => {
    // 1. Projects
    await page.goto('https://mateogs.tech/projects', { waitUntil: 'networkidle' });
    const projectCards = page.locator('article.buser-project-frame');
    await expect(projectCards.first()).toBeVisible();

    // 2. Stack
    await page.goto('https://mateogs.tech/stack', { waitUntil: 'networkidle' });
    const stackItems = page.locator('[data-row]');
    await expect(stackItems.first()).toBeVisible();

    // 3. Experience
    await page.goto('https://mateogs.tech/experience', { waitUntil: 'networkidle' });
    const timeline = page.locator('.experience-timeline');
    await expect(timeline).toBeVisible();
  });
});
