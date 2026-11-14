#!/usr/bin/env node
// Screenshot harness: captures every component docs page from a built site.
// Usage:
//   bun run build && bun run preview &        # serve dist on :4321
//   bun run shoot                             # all pages -> screenshots/
//   SHOOT_ONLY=TextAnimations bun run shoot   # one category
//   SHOOT_BASE=https://wyattau.github.io/solid-fx bun run shoot:dev  # live site
// Baselines live in screenshots/; re-run and diff to spot visual regressions.
// WebGPU backgrounds (AeroShards, ShapeWaves) need a GPU-enabled browser.
// Crash-resilient: if a page kills the renderer, the browser relaunches and
// the offending page is recorded and skipped after one retry.
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:4321/solid-fx'
const OUT = path.resolve('screenshots')
const ONLY = process.env.SHOOT_ONLY
const CRASH_LOG = path.join(OUT, 'crashes.txt')

const categories = ['TextAnimations', 'Animations', 'Components', 'Micro', 'Backgrounds']
const pages = []
for (const category of categories) {
  if (ONLY && category !== ONLY) continue
  const dir = path.join('src/content', category)
  if (!existsSync(dir)) continue
  for (const name of readdirSync(dir).sort()) {
    if (existsSync(path.join(dir, name, `${name}.tsx`))) {
      pages.push({
        category,
        name,
        url: `${BASE}/${category.toLowerCase()}/${name.toLowerCase()}/`,
      })
    }
  }
}

// Extras trees (src/extras/<source>/<Category>/<Name>/) — page URLs mirror
// the generated docs: /solid-fx/extras/<source>/<category-lower>/<name>/
const extrasRoot = path.join('src/extras')
if (existsSync(extrasRoot)) {
  for (const source of readdirSync(extrasRoot)) {
    const sourceDir = path.join(extrasRoot, source)
    if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) continue
    for (const category of readdirSync(sourceDir)) {
      const catDir = path.join(sourceDir, category)
      if (!existsSync(catDir) || !statSync(catDir).isDirectory()) continue
      if (ONLY && ONLY.toLowerCase() !== category.toLowerCase()) continue
      for (const name of readdirSync(catDir).sort()) {
        if (existsSync(path.join(catDir, name, `${name}.tsx`))) {
          pages.push({
            category: `${source}/${category}`,
            name,
            url: `${BASE}/extras/${source}/${category.toLowerCase()}/${name.toLowerCase()}/`,
          })
        }
      }
    }
  }
}

mkdirSync(OUT, { recursive: true })

let browser = await chromium.launch({ timeout: 180000 })
let ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' })
let page = await ctx.newPage()

async function respawn() {
  try {
    await browser.close()
  } catch {}
  browser = await chromium.launch({ timeout: 180000 })
  ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' })
  page = await ctx.newPage()
}

let ok = 0
let failed = 0
const crashed = []

for (const [i, p] of pages.entries()) {
  const file = path.join(OUT, `${p.category}-${p.name}.png`)
  let captured = false
  for (let attempt = 0; attempt < 2 && !captured; attempt++) {
    try {
      await page.goto(p.url, { waitUntil: 'load', timeout: 30000 })
      await page.waitForTimeout(2500) // let intro animations settle
      // Pointer sweep: interaction-driven components (cursor effects, trails,
      // drag ribbons) render nothing without pointer movement.
      for (let step = 0; step < 3; step++) {
        await page.mouse.move(500 + step * 90, 430, { steps: 8 })
        await page.mouse.move(780 - step * 90, 420 + step * 10, { steps: 8 })
      }
      await page.waitForTimeout(1200)
      await page.screenshot({ path: file, fullPage: false })
      captured = true
      ok += 1
    } catch (err) {
      const msg = String(err).split('\n')[0]
      attempt += 0
      if (attempt === 0) {
        console.error(`retry ${p.name}: ${msg}`)
      } else {
        failed += 1
        crashed.push(`${p.category}/${p.name}: ${msg}`)
        console.error(`FAIL ${p.name}: ${msg}`)
      }
      await respawn()
    }
  }
  if ((i + 1) % 25 === 0) console.log(`${i + 1}/${pages.length}`)
}

await browser.close()
console.log(`shoot: ${ok} captured, ${failed} failed -> ${OUT}`)
if (crashed.length) console.log(`crashed pages:\n${crashed.join('\n')}`)
process.exit(failed > 0 ? 1 : 0)
