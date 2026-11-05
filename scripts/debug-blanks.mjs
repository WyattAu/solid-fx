#!/usr/bin/env node
// Debug harness for the blank/near-blank CI captures (QA-TRIAGE "investigate" rows).
// Per page: console + pageerror capture, .demo-frame bounds / innerHTML length /
// canvas + img presence, per-component DOM probes, screenshots at 1s / 3s / 5s
// after load, then a CI-equivalent capture (shoot.mjs timing: settle 2.5s ->
// pointer sweep -> 1.2s) with pixel stddev computed on the frame crop (sharp,
// red channel).
//
// Usage:
//   node scripts/debug-blanks.mjs                          # the 4 triage pages, live site
//   BASE=http://localhost:4321/solid-fx node scripts/debug-blanks.mjs
//   ONLY=shredder node scripts/debug-blanks.mjs            # one component
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE ?? 'https://wyattau.github.io/solid-fx'
const OUT = process.env.OUT ?? '/tmp/opencode/debug3'
const ONLY = process.env.ONLY
const BLANK_STD = Number(process.env.BLANK_STD ?? 6) // stddev under this = blank frame
mkdirSync(OUT, { recursive: true })

const TRIAGE = [
  ['components', 'modelviewer'],
  ['micro', 'dodgefield'],
  ['micro', 'shredder'],
  ['textanimations', 'maskedheading'],
]
const PAGES = TRIAGE.filter(([, name]) => !ONLY || ONLY.toLowerCase() === name.toLowerCase())

// Same sweep shoot.mjs performs on every page before its capture.
async function ciSweep(page) {
  for (let step = 0; step < 3; step++) {
    await page.mouse.move(500 + step * 90, 430, { steps: 8 })
    await page.mouse.move(780 - step * 90, 420 + step * 10, { steps: 8 })
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
      imgs: [...frame.querySelectorAll('img')].map(
        i =>
          `${(i.currentSrc || i.src || '').slice(0, 60)} complete=${i.complete} natural=${i.naturalWidth}x${i.naturalHeight}`,
      ),
      text: frame.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100),
    }
  })

// Component-specific diagnostics (kept small; one line each).
const probes = {
  modelviewer: page =>
    page.evaluate(() => {
      const c = document.querySelector('.demo-frame canvas')
      return {
        canvas: c ? `${c.width}x${c.height} opacity=${getComputedStyle(c).opacity}` : 'none',
        model: document.querySelectorAll('.demo-frame canvas').length ? 'mounted' : 'missing',
      }
    }),
  dodgefield: page =>
    page.evaluate(() => {
      const frame = document.querySelector('.demo-frame')
      const field = frame?.querySelector('[style*="--df-ink"]')
      const mover = field?.firstElementChild
      return {
        hoverFine: matchMedia('(hover: hover) and (pointer: fine)').matches,
        coarse: !!field?.hasAttribute('data-coarse'),
        moverTransform: mover ? getComputedStyle(mover).transform.slice(0, 40) : 'none',
        fieldHTML: field ? `${field.innerHTML.length}ch` : 'missing',
      }
    }),
  shredder: page =>
    page.evaluate(() => {
      const root = document.querySelector('.demo-frame [style*="--sh-w"]')
      const slots = root ? [...root.querySelectorAll('li')] : []
      const gone = slots.filter(li => li.dataset.gone !== undefined)
      return {
        slots: `${slots.length} total, ${slots.length - gone.length} live, ${gone.length} gone`,
        canvas: root?.querySelector('canvas')
          ? `${root.querySelector('canvas').width}x${root.querySelector('canvas').height}`
          : 'none',
      }
    }),
  maskedheading: page =>
    page.evaluate(() => {
      const root = document.querySelector('.demo-frame h2, .demo-frame h1')
      const glyphs = root ? [...root.querySelectorAll('clipPath text')] : []
      const positioned = glyphs.filter(t => t.hasAttribute('x')).length
      const clip = root?.querySelector('[style*="clip-path"]')
      const reveal = clip?.parentElement
      return {
        fontSize: root ? getComputedStyle(root).fontSize : 'none',
        glyphs: `${positioned}/${glyphs.length} positioned`,
        clipPath: clip ? getComputedStyle(clip).clipPath.slice(0, 60) : 'none',
        revealOpacity: reveal ? getComputedStyle(reveal).opacity : 'none',
        filter: root?.querySelector('[style*="filter"]')
          ? getComputedStyle(root.querySelector('[style*="filter"]')).filter.slice(0, 50)
          : 'none',
      }
    }),
}

// Pixel stddev of the frame crop (clipped to the viewport), red channel — the
// same metric debug-variance.mjs reports for CI artifacts.
async function variance(page, rect, file) {
  await page.screenshot({ path: file, fullPage: false })
  const vp = page.viewportSize()
  const left = Math.max(0, Math.floor(rect.x))
  const top = Math.max(0, Math.floor(rect.y))
  const width = Math.min(Math.floor(rect.width), vp.width - left)
  const height = Math.min(Math.floor(rect.height), vp.height - top)
  const { data, info } = await sharp(file)
    .extract({ left, top, width, height })
    .raw()
    .toBuffer({ resolveWithObject: true })
  let sum = 0
  let sumSq = 0
  const colors = new Set()
  const pixels = info.width * info.height
  const ch = info.channels
  for (let p = 0; p < pixels; p++) {
    const v = data[p * ch]
    sum += v
    sumSq += v * v
    if (p % 21 === 0)
      colors.add(`${data[p * ch] >> 4},${data[p * ch + 1] >> 4},${data[p * ch + 2] >> 4}`)
  }
  const mean = sum / pixels
  const std = Math.sqrt(sumSq / pixels - mean * mean)
  return { mean, std, colors: colors.size }
}

// Launch with retries: this box is heavily contended (load spikes from
// parallel builds) and the CDP pipe handshake can starve past the timeout.
async function launchWithRetry(attempts = 3) {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await chromium.launch({ timeout: 120000 })
    } catch (err) {
      lastErr = err
      console.log(`launch attempt ${i + 1}/${attempts} failed: ${String(err).split('\n')[0]}`)
      await new Promise(r => setTimeout(r, 15000))
    }
  }
  throw lastErr
}
const browser = await launchWithRetry()
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  colorScheme: 'dark',
})

const verdicts = []

for (const [cat, name] of PAGES) {
  let page
  try {
    page = await ctx.newPage()
  const errors = []
  const logs = []
  page.on('pageerror', err => errors.push(`pageerror: ${String(err).split('\n')[0]}`))
  page.on('console', msg => {
    const text = msg.text()
    if (msg.type() === 'error' || msg.type() === 'warning')
      logs.push(`${msg.type()}: ${text.slice(0, 200)}`)
  })
  const url = `${BASE}/${cat}/${name}/`
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 })
  } catch (err) {
    console.log(`\n=== ${name}: NAV FAIL ${String(err).split('\n')[0]}`)
    await page.close()
    continue
  }

  const load = Date.now()
  const captures = []
  for (const t of [1000, 3000, 5000]) {
    const wait = t - (Date.now() - load)
    if (wait > 0) await page.waitForTimeout(wait)
    const rect = await frameProbe(page)
    if (!rect) break
    const v = await variance(page, rect, path.join(OUT, `${name}-${t / 1000}s.png`))
    captures.push([`${t / 1000}s`, rect, v])
  }

  // CI-equivalent capture: settle, sweep, settle, shoot.
  await page.waitForTimeout(1200)
  await ciSweep(page)
  await page.waitForTimeout(1200)
  const rectCi = await frameProbe(page)
  if (rectCi) {
    const v = await variance(page, rectCi, path.join(OUT, `${name}-ci.png`))
    captures.push(['ci', rectCi, v])
  }

  const probe = probes[name] ? await probes[name](page) : {}
  console.log(`\n=== ${name} (${url})`)
  console.log(`probe: ${JSON.stringify(probe)}`)
  for (const [label, rect, v] of captures) {
    const verdict = v.std >= BLANK_STD ? 'OK' : 'BLANK'
    console.log(
      `${label.padEnd(5)} std=${v.std.toFixed(1).padStart(6)} mean=${v.mean.toFixed(1).padStart(6)} colors~${String(v.colors).padEnd(4)} html=${String(rect.htmlLength).padEnd(6)} canvas=${rect.canvases} [${rect.canvasSizes.join(',')}] imgs=${rect.imgs.length} -> ${verdict}`,
    )
    if (rect.imgs.length) for (const i of rect.imgs) console.log(`      img: ${i}`)
  }
  const best = Math.max(...captures.map(([, , v]) => v.std))
  verdicts.push([name, best])
  if (errors.length) console.log(`ERRORS:\n${errors.slice(0, 10).join('\n')}`)
  else console.log('errors: none')
  if (logs.length)
    console.log(`console warnings/errors:\n${[...new Set(logs)].slice(0, 8).join('\n')}`)
  try {
    await page.close()
  } catch {}
  } catch (err) {
    console.log(`\n=== ${name}: FAILED ${String(err).split('\n')[0]}`)
    try {
      await page?.close()
    } catch {}
  }
}

await browser.close()
console.log(`\n=== verdicts (threshold std >= ${BLANK_STD})`)
for (const [name, best] of verdicts)
  console.log(
    `${name.padEnd(16)} best std=${best.toFixed(1)} -> ${best >= BLANK_STD ? 'OK' : 'BLANK'}`,
  )
console.log(`screenshots -> ${OUT}`)
