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
  "title: 'solid-fx'",
  "description: 'Animated, interactive SolidJS components — ports of the best UI effects libraries, installed as source you own.'",
  'template: splash',
  'hero:',
  "  tagline: '218 animated, interactive components for SolidJS — ports of the best UI effects libraries. Source you own; tune every value.'",
  '  actions:',
  "    - text: 'Browse components'",
  '      link: /solid-fx/textanimations/splittext',
  '      icon: right-arrow',
  "    - text: 'GitHub'",
  '      link: https://github.com/WyattAu/solid-fx',
  '      icon: external',
  '---',
  '',
  `**${count} components ported so far** (of 218 upstream react-bits; more sources coming).`,
  '',
  'Every component is self-contained source at `src/content/<Category>/<Name>/<Name>.tsx` —',
  'copy it into your project, or install it with jsrepo:',
  '',
  '```bash',
  'npx jsrepo add github/WyattAu/solid-fx/src/content/TextAnimations/SplitText',
  '```',
  '',
  'Browse by category in the sidebar. Each page renders the component live via a',
  'SolidJS island. Dependencies are per-component (`gsap`, `motion`, `ogl`, `three`,',
  '`matter-js`, `vgpu`).',
  '',
]
writeFileSync(path.join(docsDir, 'index.mdx'), index.join('\n'))

// llms.txt projection (docs-gate tier k): machine-readable catalog for AI agents.
const llms = [
  '# solid-fx',
  '',
  '> Animated, interactive SolidJS components — ports of the best UI effects',
  '> libraries, installed as source you own. TypeScript + Tailwind; per-component',
  '> dependencies (gsap, motion, ogl, three, matter-js, vgpu).',
  '',
  'Install:',
  '',
  '```',
  'npx jsrepo add github/WyattAu/solid-fx/src/content/<Category>/<Name>',
  '```',
  '',
]

for (const category of categories) {
  const categoryDir = path.join(contentDir, category)
  if (!existsSync(categoryDir)) continue
  llms.push(`## ${category}`)
  llms.push('')
  for (const name of readdirSync(categoryDir).sort()) {
    if (!existsSync(path.join(categoryDir, name, `${name}.tsx`))) continue
    llms.push(
      `- [${name}](https://wyattau.github.io/solid-fx/${category.toLowerCase()}/${name.toLowerCase()}/): ${name} component (source: src/content/${category}/${name}/${name}.tsx)`,
    )
  }
  llms.push('')
}
mkdirSync(path.join(root, 'public'), { recursive: true })
writeFileSync(path.join(root, 'public', 'llms.txt'), llms.join('\n'))

console.log(`gen-docs: wrote ${count} component pages + index into docs/, public/llms.txt`)
