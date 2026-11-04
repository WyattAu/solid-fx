#!/usr/bin/env node
// Pixel-variance check for debug screenshots: a "blank" demo frame has
// near-zero stddev / almost no distinct colors inside the .demo-frame crop.
// Usage: node scripts/debug-variance.mjs /tmp/opencode/debug [<names...>]
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const dir = process.argv[2] ?? '/tmp/opencode/debug'
const only = process.argv.slice(3).map(s => s.toLowerCase())
// Demo frame occupies the content column between the sidebar and TOC on the
// 1280x720 docs pages; crop generously inside it (frame is ~x:324-954, y:219-604).
const CROP = { left: 344, top: 239, width: 590, height: 345 }

const files = readdirSync(dir).filter(f => f.endsWith('.png') && !f.startsWith('frame'))
for (const file of files) {
  const stem = file.replace(/\.png$/, '')
  if (only.length && !only.some(n => stem.toLowerCase().includes(n))) continue
  const { data, info } = await sharp(path.join(dir, file))
    .extract(CROP)
    .raw()
    .toBuffer({ resolveWithObject: true })
  let sum = 0
  let sumSq = 0
  const colors = new Set()
  const pixels = info.width * info.height
  const ch = info.channels
  for (let p = 0; p < pixels; p += 3) {
    const v = data[p * ch]
    sum += v
    sumSq += v * v
    if (p % 21 === 0)
      colors.add(`${data[p * ch] >> 4},${data[p * ch + 1] >> 4},${data[p * ch + 2] >> 4}`)
  }
  const mean = sum / pixels
  const std = Math.sqrt(sumSq / pixels - mean * mean)
  console.log(
    `${stem.padEnd(24)} mean=${mean.toFixed(1).padStart(6)} stddev=${std.toFixed(1).padStart(6)} colors~${colors.size}`,
  )
}
