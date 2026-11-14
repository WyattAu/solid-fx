// scripts/build-islands.mjs — the docs-compiler island glue (Wave 2c.5).
//
// Compiles every <Name>Demo.tsx into a self-contained `<docs-island>`
// chunk (the shim contract: default export receives { props, element }
// and mounts the Solid component), split so the solid runtime is a
// shared chunk, and generates the docs-site markdown (one page per
// component, one island fence per page) plus category indexes.
//
// Outputs:
//   dist-islands/<name>.js            one chunk per demo
//   dist-islands/shared/*.js          shared solid runtime chunks
//   dist-islands/islands.css          Tailwind build (scans src/content)
//   dist-islands/island.mjs(+core)    the docs-core shim, copied
//   dist-islands/manifest.json        island name -> chunk
//   docs-site-src/                    markdown + site.toml for docs-compiler
//
// Usage: bun run build:islands [--out <dir>]  (default dist-islands)

import { build } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TREES = [
  { dir: 'src/content', prefix: null },
  { dir: 'src/extras', prefix: 'extras' },
  { dir: 'src/scenes', prefix: 'scenes' },
]
const OUT = path.resolve(ROOT, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'dist-islands')
const BUILD = path.resolve(ROOT, '.docs-islands-build')
const SHIM_SRC = path.resolve(ROOT, '../docs-core/islands')

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

// Discover every <Name>Demo.tsx, keyed by a unique island name.
const islands = []
for (const { dir, prefix } of TREES) {
  const base = path.join(ROOT, dir)
  if (!fs.existsSync(base)) continue
  walk(base).forEach((demoPath) => {
    const rel = path.relative(ROOT, demoPath)
    const name = path.basename(demoPath).replace(/Demo\.tsx$/, '')
    const parts = rel.split(path.sep) // e.g. src/extras/osint/Foo/FooDemo.tsx
    let key = kebab(name)
    if (prefix === 'extras') key = `${kebab(parts[2])}-${key}` // extras/<tree>/...
    if (prefix === 'scenes') key = `${kebab(parts[2])}-scene`
    islands.push({ key, demoPath: rel, tree: dir, category: parts[2] ?? '' })
  })
}
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, acc)
    else if (entry.name.endsWith('Demo.tsx')) acc.push(p)
  }
  return acc
}
// scenes keep their demo at src/scenes/<Name>/<Name>Demo.tsx; the generic
// walk above already finds them, so nothing special is needed here.

fs.mkdirSync(BUILD, { recursive: true })
fs.mkdirSync(OUT, { recursive: true })
// The islands' stylesheet: Tailwind v4, scanning every demo source tree.
fs.writeFileSync(
  path.join(BUILD, 'islands.css'),
  [
    '@import "tailwindcss";',
    '@source "../../src/content/**/*.{tsx,ts}";',
    '@source "../../src/extras/**/*.{tsx,ts}";',
    '@source "../../src/scenes/**/*.{tsx,ts}";',
    '',
  ].join('\n'),
)

// One generated entry per island: the shim contract wrapper.
const entries = {}
for (const island of islands) {
  const entryPath = path.join(BUILD, `${island.key}.tsx`)
  const relDemo = path.relative(BUILD, path.join(ROOT, island.demoPath)).split(path.sep).join('/')
  fs.writeFileSync(
    entryPath,
    `import { render as __r } from 'solid-js/web'
import './islands.css'
import Demo from '${relDemo}'

export default function renderIsland({ props, element }) {
  __r(() => <Demo {...props} />, element)
}
`,
  )
  entries[island.key] = entryPath
}

console.log(`building ${islands.length} island(s)...`)
await build({
  root: ROOT,
  configFile: false,
  plugins: [solid(), tailwindcss()],
  build: {
    outDir: OUT,
    emptyOutDir: true,
    minify: 'esbuild',
    lib: { entry: entries, formats: ['es'], fileName: (_f, name) => `${name}.js` },
    rollupOptions: { output: { chunkFileNames: 'shared/[name]-[hash].js', assetFileNames: '[name][extname]' } },
  },
})

// The docs-core shim, copied with its relative import intact.
for (const f of ['island.mjs', 'island-core.mjs']) {
  const src = path.join(SHIM_SRC, f)
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, f))
  else console.warn(`shim missing: ${src} (clone docs-core beside solid-fx)`)
}

// The docs-site markdown: category indexes + one page per component.
const SITE = path.resolve(ROOT, 'docs-site-src')
fs.rmSync(SITE, { recursive: true, force: true })
fs.mkdirSync(SITE, { recursive: true })
fs.writeFileSync(
  path.join(SITE, 'site.toml'),
  [
    'base_url = "http://localhost:8125"',
    'site_title = "solid-fx on the docs static shell"',
    'author = "Wyatt"',
    'ai_crawlers = "allow"',
    'stylesheet = "/_assets/islands/islands.css"',
    'island_shim = "/_assets/islands/island.mjs"',
    '',
].join('\n'),
)

const byCategory = new Map()
for (const island of islands) {
  const group = `${island.tree}/${island.category}`
  if (!byCategory.has(group)) byCategory.set(group, [])
  byCategory.get(group).push(island)
}
for (const [group, groupIslands] of byCategory) {
  const dir = path.join(SITE, group)
  fs.mkdirSync(dir, { recursive: true })
  const links = groupIslands
    .map((i) => `- [${i.key}](./${i.key}.html)`)
    .join('\n')
  fs.writeFileSync(
    path.join(dir, 'index.md'),
    `---\ntitle: ${group}\ndescription: ${groupIslands.length} interactive component(s) in this category.\nslug: index\n---\n\n# ${group}\n\n${links}\n`,
  )
  for (const island of groupIslands) {
    fs.writeFileSync(
      path.join(dir, `${island.key}.md`),
      [
        '---',
        `title: ${island.key}`,
        `description: Interactive ${island.key} demo from solid-fx, hydrated as a static-shell island.`,
        '---',
        '',
        `# ${island.key}`,
        '',
        '```island ' + island.key + ' client=visible',
        '{}',
        '```',
        '',
      ].join('\n'),
    )
  }
}

const shared = fs
  .readdirSync(OUT)
  .filter((f) => f.startsWith('shared/') || f.endsWith('.css'))
fs.writeFileSync(
  path.join(OUT, 'manifest.json'),
  JSON.stringify(
    {
      islands: Object.fromEntries(islands.map((i) => [i.key, `${i.key}.js`])),
      shared,
      shim: ['island.mjs', 'island-core.mjs'],
    },
    null,
    2,
  ),
)
console.log(`islands: ${islands.length}, site pages: ${islands.length + byCategory.size} -> docs-site-src/`)
