#!/usr/bin/env node
// Screenshot harness: captures every component docs page from a built site.
// Usage:
//   bun run build && bun run preview &        # serve dist on :4321
//   bun run shoot                             # all pages -> screenshots/
//   SHOOT_ONLY=TextAnimations bun run shoot   # one category
// Baselines live in screenshots/; re-run and diff to spot visual regressions.
// WebGPU backgrounds (AeroShards, ShapeWaves) need a GPU-enabled browser.
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:4321/solid-fx';
const OUT = path.resolve('screenshots');
const ONLY = process.env.SHOOT_ONLY;

const categories = ['TextAnimations', 'Animations', 'Components', 'Micro', 'Backgrounds'];
const pages = [];
for (const category of categories) {
  if (ONLY && category !== ONLY) continue;
  const dir = path.join('src/content', category);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    if (existsSync(path.join(dir, name, `${name}.tsx`))) {
      pages.push({ category, name, url: `${BASE}/${category.toLowerCase()}/${name.toLowerCase()}/` });
    }
  }
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' });
const page = await ctx.newPage();

let ok = 0;
let failed = 0;
for (const [i, p] of pages.entries()) {
  const file = path.join(OUT, `${p.category}-${p.name}.png`);
  try {
    await page.goto(p.url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2500); // let intro animations settle
    await page.screenshot({ path: file, fullPage: false });
    ok += 1;
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${p.name}: ${String(err).split('\n')[0]}`);
  }
  if ((i + 1) % 25 === 0) console.log(`${i + 1}/${pages.length}`);
}

await browser.close();
console.log(`shoot: ${ok} captured, ${failed} failed -> ${OUT}`);
process.exit(failed > 0 ? 1 : 0);
