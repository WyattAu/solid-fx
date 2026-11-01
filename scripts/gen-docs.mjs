#!/usr/bin/env node
// Generates Starlight docs pages (docs/<category>/<Name>.mdx) — one page per
// ported component, each embedding a DemoIsland. Canonical source of truth is
// the src/content directory layout; run via `bun run gen:docs`.
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = path.join(root, 'src', 'content')
const docsDir = path.join(root, 'docs')
const categories = ['Animations', 'Backgrounds', 'Components', 'Micro', 'TextAnimations']

// Regenerate from scratch so removed components disappear.
rmSync(docsDir, { recursive: true, force: true })
mkdirSync(docsDir, { recursive: true })

let count = 0

for (const category of categories) {
  const categoryDir = path.join(contentDir, category)
  if (!existsSync(categoryDir)) continue
  const outDir = path.join(docsDir, category.toLowerCase())
  mkdirSync(outDir, { recursive: true })
  for (const name of readdirSync(categoryDir).sort()) {
    if (!existsSync(path.join(categoryDir, name, `${name}.tsx`))) continue
    const mdx = [
      '---',
      `title: ${name}`,
      `description: SolidJS port of the react-bits ${name} component (TypeScript + Tailwind).`,
      '---',
      '',
      "import DemoIsland from '../../src/islands/DemoIsland';",
      '',
      `<DemoIsland client:only="solid" category="${category}" name="${name}" />`,
      '',
      `Source: \`src/content/${category}/${name}/${name}.tsx\` — copy-paste friendly,`,
      'installable as source, no registry needed.',
      '',
    ]
    writeFileSync(path.join(outDir, `${name}.mdx`), mdx.join('\n'))
    count += 1
  }
}

const index = [
  '---',
  "title: 'solid-bits'",
  "description: 'Animated, interactive SolidJS components — a component-for-component port of react-bits.'",
  '---',
  '',
  `**${count} components ported so far** (of 218 upstream).`,
  '',
  'Animated, interactive components for SolidJS, ported component-for-component from',
  '[react-bits](https://reactbits.dev) (TypeScript + Tailwind variant).',
  'Every component is self-contained source at `src/content/<Category>/<Name>/<Name>.tsx` —',
  'copy it into your project, or grab it with jsrepo. Dependencies are per-component',
  '(`gsap`, `motion`, `ogl`, `three`, `matter-js`, `vgpu`) and listed in each page.',
  '',
  'Browse by category in the sidebar. Each page renders the component live via a',
  'SolidJS island.',
  '',
]
writeFileSync(path.join(docsDir, 'index.mdx'), index.join('\n'))

console.log(`gen-docs: wrote ${count} component pages + index into docs/`)
