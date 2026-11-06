const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:8765';
const scenarios = [
  { name: 'small-mobile', width: 360, height: 780 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1366, height: 900 }
];
const pages = ['index.html', 'work.html', 'lab.html', 'about.html', 'case-study.html?id=traveler-app', 'case-study.html?id=api-security'];

(async () => {
  fs.mkdirSync('browser-artifacts', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of scenarios) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const failures = [];
      page.on('pageerror', error => failures.push(error.message));
      for (const route of pages) {
        const response = await page.goto(base + '/' + route, { waitUntil: 'domcontentloaded' });
        assert.equal(response.status(), 200, route + ' should load');
        await page.locator('main').waitFor();
        const size = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth,
          viewport: document.documentElement.clientWidth
        }));
        assert.ok(size.page <= size.viewport + 2, route + ' horizontal overflow at ' + viewport.width + ': ' + JSON.stringify(size));
        assert.ok((await page.title()).trim(), route + ' title missing');
        if (route.startsWith('case-study')) {
          assert.ok(await page.locator('#case-visual .case-visual-steps li').count() >= 1, route + ' architecture missing');
        }
        if (viewport.name === 'mobile' || viewport.name === 'desktop') {
          await page.screenshot({ path: 'browser-artifacts/' + viewport.name + '-' + route.split('?')[0].replace('.html','') + (route.includes('traveler-app') ? '-traveler' : '') + '.png', fullPage: true });
        }
      }
      assert.deepEqual(failures, [], 'Browser script errors on ' + viewport.name);
      if (viewport.width <= 800) {
        await page.goto(base + '/index.html');
        const menu = page.getByRole('button', { name: 'Toggle navigation' });
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      }
      await page.goto(base + '/work.html');
      assert.equal(await page.locator('.project-card').count(), 12);
      await page.locator('.work-filters [data-filter="security"]').click();
      assert.equal(await page.locator('.project-card').count(), 2);
      await page.locator('.work-filters [data-filter="all"]').click();
      assert.equal(await page.locator('.project-card').count(), 12);
      await page.goto(base + '/lab.html');
      await page.locator('.lab-filters [data-filter="frontend"]').click();
      assert.equal(await page.locator('.lab-grid article:visible').count(), 1);
      await page.locator('.lab-filters [data-filter="all"]').click();
      assert.equal(await page.locator('.lab-grid article:visible').count(), 4);
      await page.goto(base + '/case-study.html?id=not-a-real-project');
      assert.equal(await page.locator('.case-not-found h1').textContent(), 'Project not found');
      await context.close();
      console.log('Browser checks passed:', viewport.name);
    }
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
