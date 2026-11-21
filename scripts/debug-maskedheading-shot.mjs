import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto('http://localhost:4322/solid-fx/textanimations/maskedheading/', {
  waitUntil: 'load',
  timeout: 30000,
})
await page.waitForTimeout(6000) // let the mount reveal settle
await page.screenshot({ path: '/tmp/opencode/mh-local.png' })
const probe = await page.evaluate(() => ({
  glyphs: [...document.querySelectorAll('clipPath text')],
  positioned: [...document.querySelectorAll('clipPath text')].filter(t => t.hasAttribute('x'))
    .length,
}))
console.log(`glyphs=${probe.glyphs.length} positioned=${probe.positioned}`)
await browser.close()
