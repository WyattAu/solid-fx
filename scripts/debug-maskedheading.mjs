#!/usr/bin/env node
// MaskedHeading sync-path probe: loads the docs page, dumps island + heading DOM state.
import { chromium } from 'playwright'

const URL = process.env.PROBE_URL ?? 'http://localhost:4322/solid-fx/textanimations/maskedheading/'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', e => errors.push(`pageerror: ${String(e).slice(0, 200)}`))
await page.goto(URL, { waitUntil: 'load', timeout: 45000 })
await page.waitForTimeout(5000)

const report = await page.evaluate(() => {
  const out = {}
  out.h2s = [...document.querySelectorAll('h2')].map(h => ({
    text: h.textContent.slice(0, 40),
    childTags: [...h.children]
      .map(c => `${c.tagName}.${String(c.className.baseVal ?? c.className).slice(0, 40)}`)
      .slice(0, 5),
  }))
  const islands = [...document.querySelectorAll('[data-island], astro-island')]
  out.islandCount = islands.length
  out.islandInfo = islands.slice(0, 4).map(i => ({
    tag: i.tagName,
    component: i.getAttribute('component-export') ?? i.getAttribute('data-component') ?? '',
    hydrated: i.hasAttribute('ssr') ? 'ssr-attr' : String(i.getAttribute('hydrated')),
  }))
  const clipTexts = [...document.querySelectorAll('clipPath text')]
  out.clipTextCount = clipTexts.length
  out.clipWithX = clipTexts.filter(t => t.hasAttribute('x')).length
  const transparent = [...document.querySelectorAll('span.text-transparent')]
  out.transparentSpans = transparent.length
  if (transparent[0]) {
    const root = transparent[0].parentElement
    const cs = getComputedStyle(root)
    out.root = {
      fontSize: cs.fontSize,
      clientWidth: root.clientWidth,
      childTags: [...root.children].map(
        c => `${c.tagName}.${String(c.className.baseVal ?? c.className).slice(0, 30)}`,
      ),
    }
    const words = [...transparent[0].querySelectorAll(':scope > span')]
    out.wordCount = words.length
    out.word0 = words[0]
      ? {
          childTypes: [...words[0].childNodes].map(n => n.nodeType),
          text: JSON.stringify(words[0].textContent.slice(0, 12)),
          offsetLeft: words[0].offsetLeft,
          rectW: words[0].getBoundingClientRect().width,
        }
      : null
    const i0 = transparent[0].querySelector('i')
    out.base0 = i0 ? { offsetTop: i0.offsetTop, parentTag: i0.parentElement?.tagName } : null
    out.offsetParent = transparent[0].parentElement.offsetParent?.tagName ?? 'none'
  }
  return out
})
console.log(JSON.stringify(report, null, 2))
console.log('pageerrors:', errors.length ? errors : 'none')
await browser.close()
