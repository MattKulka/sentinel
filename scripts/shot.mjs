// Ad-hoc screenshot helper: captures the running dev server (port 5182) in
// light and dark, at desktop and mobile widths. Usage: `node scripts/shot.mjs`.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:5182';
const OUT = 'scripts/shots';
mkdirSync(OUT, { recursive: true });

const shots = [
  { name: 'desktop-light', width: 1200, height: 900, scheme: 'light' },
  { name: 'desktop-dark', width: 1200, height: 900, scheme: 'dark' },
  { name: 'mobile-light', width: 390, height: 900, scheme: 'light' },
];

const browser = await chromium.launch();
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    colorScheme: s.scheme,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Lead cover/ }).waitFor();
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  console.log(`captured ${s.name}`);
  await ctx.close();
}
await browser.close();
