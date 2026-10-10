// Outils communs des scénarios de test de l'interface (Playwright, données fictives rejouées).
// Playwright doit être installé (npm i -D playwright) ; adapter le require ci-dessous à votre installation.
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
export const DIR = process.env.SHOTS ?? '.'; // dossier des captures d'écran
export async function open() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('hmr') && errors.push(m.text()));
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => { localStorage.removeItem('deepflow.drawings'); localStorage.removeItem('deepflow.drawings.styles'); localStorage.removeItem('deepflow.layout.v1'); });
  await page.reload();
  await page.waitForTimeout(5000);
  const box = await page.locator('.chart canvas.cross').boundingBox();
  const at = (x, y) => [box.x + x, box.y + y];
  return {
    page, errors, at,
    list: () => page.evaluate(() => JSON.parse(localStorage.getItem('deepflow.drawings') ?? '{}').sets?.['futures:BTCUSDT'] ?? []),
    shot: (n) => page.screenshot({ path: `${DIR}/${n}.png` }),
    click: (x, y) => page.mouse.click(box.x + x, box.y + y),
    drag: async (a, b) => { await page.mouse.move(...at(...a)); await page.mouse.down(); await page.mouse.move(...at(...b), { steps: 6 }); await page.mouse.up(); },
    close: () => browser.close(),
  };
}
