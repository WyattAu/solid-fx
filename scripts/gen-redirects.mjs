// gen-redirects.mjs - legacy route stubs for the Phase C root flip.
//
// GitHub Pages has no server-side redirects, so the flip emits
// meta-refresh stubs for every legacy astro route plus every retired
// /preview/ route. The legacy route space is derived from the astro
// docs tree (docs/**.mdx, lowercased - the Starlight slug rule), NOT
// re-guessed from names: each legacy route is matched against the
// built SSG route space by dash-insensitive name comparison, and the
// generator FAILS LOUDLY on any legacy route with zero or ambiguous
// targets (a silent 404 is the one unacceptable outcome).
//
// Usage: bun scripts/gen-redirects.mjs <built-site-dir> [docs-dir] [origin]

import fs from 'node:fs'
import path from 'node:path'

const SITE = path.resolve(process.argv[2] ?? 'preview-site')
const DOCS = path.resolve(process.argv[3] ?? 'docs')
const ORIGIN = process.argv[4] ?? 'https://wyattau.github.io'

const dashless = s => s.toLowerCase().replace(/-/g, '')

const walkFiles = (root, ext, acc = [], rel = '') => {
  if (!fs.existsSync(root)) return acc
  for (const entry of fs.readdirSync(root).sort()) {
    const r = rel ? `${rel}/${entry}` : entry
    const abs = path.join(root, entry)
    if (fs.statSync(abs).isDirectory()) walkFiles(abs, ext, acc, r)
    else if (r.endsWith(ext)) acc.push(r)
  }
  return acc
}

// ---- legacy (astro) routes from the docs tree --------------------
const legacyRoutes = []
for (const f of walkFiles(DOCS, '.mdx')) {
  const rel = f.replace(/\.mdx$/, '').toLowerCase()
  if (rel === 'index') continue // the flip itself serves the new root
  legacyRoutes.push(`/${rel}/`)
}

// ---- SSG route space from the built site --------------------------
const SKIP_DIRS = new Set(['_assets', 'preview'])
const ssgRoutes = []
const walkSite = (dir, rel = '') => {
  for (const entry of fs.readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(entry) && rel === '') continue
    const r = rel ? `${rel}/${entry}` : entry
    const abs = path.join(dir, entry)
    if (fs.statSync(abs).isDirectory()) walkSite(abs, r)
    else if (r.endsWith('.html')) ssgRoutes.push(r)
  }
}
walkSite(SITE)

// Index: ssgName (sans .html) split into [parentDir, name].
const ssgPages = ssgRoutes
  .filter(r => !r.endsWith('/index.html'))
  .map(r => {
    const i = r.lastIndexOf('/')
    return { route: r, dir: r.slice(0, i), name: r.slice(i + 1).replace(/\.html$/, '') }
  })

// ---- match each legacy route to exactly one SSG route -------------
const unmatched = []
const ambiguous = []
const redirects = [] // [legacyPath (dir form), targetUrl]
const sectionFallback = [] // legacy routes with no page twin: -> section index
for (const legacy of legacyRoutes) {
  const parts = legacy.split('/').filter(Boolean)
  const slug = parts[parts.length - 1]
  const slugD = dashless(slug)
  const hit = ssgPages.filter(p => {
    const dirD = dashless(p.dir.split('/').pop() ?? '')
    if (!parts.some(seg => dashless(seg) === dirD)) return false
    const nameD = dashless(p.name)
    return nameD === slugD || nameD === `${dirD}${slugD}` || nameD.startsWith(slugD)
  })
  // Preference tiers: exact name beats category-prefixed beats prefix.
  const exact = hit.filter(p => dashless(p.name) === slugD)
  const prefixed = hit.filter(
    p => dashless(p.name) === `${dashless(p.dir.split('/').pop() ?? '')}${slugD}`,
  )
  const chosen = exact.length ? exact : prefixed.length ? prefixed : hit
  if (chosen.length > 1) ambiguous.push(`${legacy} -> ${chosen.map(h => h.route).join(', ')}`)
  else if (chosen.length === 1) redirects.push([legacy, chosen[0].route])
  else sectionFallback.push(legacy)
}

if (ambiguous.length) {
  console.error(
    `gen-redirects: ambiguous legacy routes (${ambiguous.length}):`,
    ambiguous.slice(0, 8),
  )
  process.exit(1)
}

// Section fallback: no page twin (a legacy component the islands
// pipeline does not ship yet). Land on the deepest section index that
// exists (case/dash-insensitive dir prefix match), else the site root;
// loud summary either way.
const indexPages = ssgPages.filter(p => p.route.endsWith('/index.html'))
for (const legacy of sectionFallback) {
  const legacyD = dashless(legacy)
  let target = 'index.html'
  let best = 0
  for (const p of indexPages) {
    const dirD = `/${dashless(p.dir)}/`
    if (legacyD.startsWith(dirD) && dirD.length > best) {
      best = dirD.length
      target = p.route
    }
  }
  if (best === 0) {
    // No section index: land on the first sibling page of the deepest
    // matching SSG dir (the sidebar shows the whole section there).
    let bestDir = ''
    for (const p of ssgPages) {
      if (p.dir === '') continue
      const dirD = `/${dashless(p.dir)}/`
      if (legacyD.startsWith(dirD) && dirD.length > best) {
        best = dirD.length
        bestDir = p.dir
        target = p.route
      }
    }
    if (bestDir) {
      const first = ssgPages
        .filter(p => p.dir === bestDir)
        .sort((a, b) => a.route.localeCompare(b.route))[0]
      target = first.route
    }
  }
  redirects.push([legacy, target])
  unmatched.push(`${legacy} -> section (${target})`)
}

// ---- emit stubs ----------------------------------------------------
const stub = toUrl => `<!doctype html>
<meta charset="utf-8">
<title>Moved</title>
<link rel="canonical" href="${ORIGIN}/solid-fx/${toUrl}">
<meta http-equiv="refresh" content="0; url=${ORIGIN}/solid-fx/${toUrl}">
<a href="${ORIGIN}/solid-fx/${toUrl}">Moved</a>
`
const writeStub = (relFile, toUrl) => {
  const target = path.join(SITE, relFile)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, stub(toUrl))
}

let n = 0
for (const [legacy, target] of redirects) {
  // Legacy astro dir route: /{path}/ served by {path}/index.html.
  writeStub(`${legacy}index.html`, target)
  n += 1
}
// Retired preview routes: /preview/{ssg-route} -> /{ssg-route}.
for (const r of ssgRoutes) {
  if (r.endsWith('index.html') && !r.includes('/')) continue // root is the flip itself
  writeStub(path.join('preview', r), r)
  n += 1
}

// Legacy astro category roots (/{cat}/): linked from the old landing
// page, so they need stubs even though the sitemap never listed them.
// Matched by final dir segment against the SSG index pages (legacy
// "micro" -> content/Micro/index.html); no match = no stub.
const indexRoutes = ssgRoutes.filter(r => r.endsWith('/index.html') && r !== 'index.html')
const legacyDirs = new Set(legacyRoutes.map(r => r.split('/').filter(Boolean)[0]))
for (const dir of [...legacyDirs].sort()) {
  const hit = indexRoutes.find(r => {
    const dirPart = r.slice(0, -'index.html'.length).replace(/\/$/, '')
    return dashless(dirPart.split('/').pop() ?? '') === dir
  })
  if (hit) {
    writeStub(`${dir}/index.html`, hit)
    n += 1
  }
}

console.log(
  `redirects: ${redirects.length - sectionFallback.length} page + ${sectionFallback.length} section + ${ssgRoutes.length - 1} retired-preview = ${n} stubs -> ${SITE}`,
)
for (const u of unmatched) console.log(`  section-fallback: ${u}`)
