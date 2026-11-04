#!/usr/bin/env node
// Debug harness for interaction-driven demos that render blank on the docs site.
// Per component: open the docs page, collect console/page errors, locate the
// .demo-frame, sweep the pointer WITHIN the frame bounds (plus a click), then
// screenshot twice and report frame innerHTML length + canvas presence so we
// can tell "demo never mounted" from "mounted but only animates on pointer".
//
// Usage:
//   node scripts/debug-interactive.mjs                     # deployed site
//   BASE=http://localhost:4321/solid-fx node scripts/debug-interactive.mjs
//   ONLY=ImageTrail node scripts/debug-interactive.mjs     # one component
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE ?? 'https://wyattau.github.io/solid-fx'
const OUT = '/tmp/opencode/debug'
const ONLY = process.env.ONLY
mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['animations', 'imagetrail'],
  ['animations', 'pixeltrail'],
  ['animations', 'ribbons'],
  ['animations', 'splashcursor'],
  ['micro', 'dodgefield'],
].filter(([cat, name]) => !ONLY || ONLY.toLowerCase() === name.toLowerCase())

// Sweep the pointer across the given rect (50+ moves), then click its center.
async function sweep(page, rect, { click = true } = {}) {
  const pad = 20
  const x0 = rect.x + pad
  const y0 = rect.y + pad
  const x1 = rect.x + rect.width - pad
  const y1 = rect.y + rect.height - pad
  const zigzag = 6
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    const x = x0 + (x1 - x0) * t
    const y = y0 + (y1 - y0) * (0.5 + 0.5 * Math.sin(t * Math.PI * zigzag))
    await page.mouse.move(x, y, { steps: 2 })
  }
  if (click) {
    await page.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 })
    await page.mouse.down()
    await page.mouse.up()
  }
}

const frameProbe = page =>
  page.evaluate(() => {
    const frame = document.querySelector('.demo-frame')
    if (!frame) return null
    const r = frame.getBoundingClientRect()
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      htmlLength: frame.innerHTML.length,
      canvases: frame.querySelectorAll('canvas').length,
      canvasSizes: [...frame.querySelectorAll('canvas')].map(c => `${c.width}x${c.height}`),
      text: frame.textContent?.trim().slice(0, 80),
    }
  })

const browser = await chromium.launch({ timeout: 480000 })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' })

for (const [cat, name] of PAGES) {
  const page = await ctx.newPage()
  const errors = []
  const logs = []
  page.on('pageerror', err => errors.push(`pageerror: ${String(err).split('\n')[0]}`))
  page.on('console', msg => {
    const text = msg.text()
    if (msg.type() === 'error' || msg.type() === 'warning') logs.push(`${msg.type()}: ${text.slice(0, 160)}`)
  })
  const url = `${BASE}/${cat}/${name}/`
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 })
    await page.waitForTimeout(3000)
  } catch (err) {
    console.log(`\n=== ${name}: NAV FAIL ${String(err).split('\n')[0]}`)
    await page.close()
    continue
  }

  const before = await frameProbe(page)
  console.log(`\n=== ${name} (${url})`)
  console.log(`before: ${JSON.stringify(before)}`)
  if (before?.canvases) console.log(`canvas sizes before: ${before.canvasSizes.join(', ') || 'none'}`)
  if (!before) {
    console.log('NO .demo-frame — page layout mismatch?')
    await page.close()
    continue
  }

  // Sweep 1 (within frame bounds) -> screenshot -1
  await sweep(page, before)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, `${name}-1.png`) })
  const mid = await frameProbe(page)

  // Sweep 2 -> screenshot -2
  await sweep(page, before)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, `${name}-2.png`) })
  const after = await frameProbe(page)

  console.log(`mid:   html=${mid?.htmlLength} canvases=${mid?.canvases} sizes=${mid?.canvasSizes?.join(',')}`)
  console.log(`after: html=${after?.htmlLength} canvases=${after?.canvases} sizes=${after?.canvasSizes?.join(',')}`)
  if (errors.length) console.log(`ERRORS:\n${errors.slice(0, 10).join('\n')}`)
  else console.log('errors: none')
  if (logs.length) console.log(`console warnings/errors:\n${[...new Set(logs)].slice(0, 8).join('\n')}`)
  await page.close()
}

await browser.close()
console.log(`\nscreenshots -> ${OUT}`)
