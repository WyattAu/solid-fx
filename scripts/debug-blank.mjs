#!/usr/bin/env node
// Debug harness for the 3 near-blank demos (CRTWarp, SoftAurora, ModelViewer).
// Per page: console + pageerror capture, canvas/WebGL2 context probe,
// .demo-frame innerHTML length, screenshot (for debug-variance.mjs).
//
// Usage:
//   node scripts/debug-blank.mjs                     # deployed site
//   BASE=http://localhost:4321/solid-fx node scripts/debug-blank.mjs
//   ONLY=crtwarp node scripts/debug-blank.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE ?? 'https://wyattau.github.io/solid-fx'
const OUT = process.env.OUT ?? '/tmp/opencode/debug'
const ONLY = process.env.ONLY
mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['backgrounds', 'crtwarp'],
  ['backgrounds', 'softaurora'],
  ['components', 'modelviewer'],
].filter(([cat, name]) => !ONLY || ONLY.toLowerCase() === name.toLowerCase())

const probe = page =>
  page.evaluate(() => {
    const frame = document.querySelector('.demo-frame')
    if (!frame) return { frame: false }
    const r = frame.getBoundingClientRect()
    const canvases = [...frame.querySelectorAll('canvas')]
    const glInfo = canvases.map(c => {
      const gl = c.getContext('webgl2') ?? c.getContext('webgl') ?? c.getContext('2d')
      return {
        size: `${c.width}x${c.height}`,
        client: `${c.clientWidth}x${c.clientHeight}`,
        ctx: gl ? (gl.constructor?.name ?? 'unknown') : 'NULL',
        lost: gl && 'isContextLost' in gl ? gl.isContextLost() : undefined,
      }
    })
    return {
      frame: true,
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      htmlLength: frame.innerHTML.length,
      childCount: frame.children.length,
      text: frame.textContent?.trim().slice(0, 80),
      canvases: glInfo,
    }
  })

const browser = await chromium.launch({ timeout: 480000 })
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  colorScheme: 'dark',
})

for (const [cat, name] of PAGES) {
  const page = await ctx.newPage()
  const errors = []
  const logs = []
  page.on('pageerror', err => errors.push(`pageerror: ${String(err).split('\n')[0]}`))
  page.on('console', msg => {
    const text = msg.text()
    if (msg.type() === 'error' || msg.type() === 'warning')
      logs.push(`${msg.type()}: ${text.slice(0, 220)}`)
  })
  const url = `${BASE}/${cat}/${name}/`
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 })
    await page.waitForTimeout(3500) // past intro/settle windows
  } catch (err) {
    console.log(`\n=== ${name}: NAV FAIL ${String(err).split('\n')[0]}`)
    await page.close()
    continue
  }

  const before = await probe(page)
  console.log(`\n=== ${name} (${url})`)
  console.log(`probe: ${JSON.stringify(before, null, 1)}`)
  await page.screenshot({ path: path.join(OUT, `${name}.png`) })
  console.log(errors.length ? `ERRORS:\n${errors.slice(0, 10).join('\n')}` : 'pageerror: none')
  console.log(
    logs.length
      ? `console:\n${[...new Set(logs)].slice(0, 10).join('\n')}`
      : 'console warnings/errors: none',
  )
  await page.close()
}

await browser.close()
console.log(`\nscreenshots -> ${OUT}`)
