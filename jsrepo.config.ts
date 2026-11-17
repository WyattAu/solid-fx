import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type RegistryItem } from 'jsrepo'

const CATEGORIES = ['TextAnimations', 'Animations', 'Components', 'Micro', 'Backgrounds']

// Extras sources mirror src/extras/<source>/<Category>/<Name>/.
const EXTRA_SOURCES = [
  'magic-ui',
  'motion-primitives',
  'animata',
  'tsparticles',
  'anime-js',
  'kokonut',
  'osint',
  'seo',
  'instruments',
  'data',
  'fx',
  'emergent',
]

const items: RegistryItem[] = []
for (const category of CATEGORIES) {
  const categoryDir = path.join('src/content', category)
  if (!existsSync(categoryDir)) continue
  for (const name of readdirSync(categoryDir).sort()) {
    const component = path.join(categoryDir, name, `${name}.tsx`)
    if (!existsSync(component)) continue
    items.push({
      name: `${category}/${name}`,
      title: name,
      description: `SolidJS port of the react-bits ${name} component (TypeScript + Tailwind).`,
      category,
      categories: [category],
      files: [
        {
          path: `src/content/${category}/${name}/${name}.tsx`,
          target: `${name}/${name}.tsx`,
        },
      ],
    })
  }
}

for (const source of EXTRA_SOURCES) {
  const sourceDir = path.join('src/extras', source)
  if (!existsSync(sourceDir)) continue
  for (const category of readdirSync(sourceDir).sort()) {
    const catDir = path.join(sourceDir, category)
    if (!existsSync(catDir) || !statSync(catDir).isDirectory()) continue
    for (const name of readdirSync(catDir).sort()) {
      const component = path.join(catDir, name, `${name}.tsx`)
      if (!existsSync(component)) continue
      items.push({
        name: `${source}/${category}/${name}`,
        title: name,
        description: `${name} for SolidJS (source tree: src/extras/${source}).`,
        category: source,
        categories: [source],
        files: [
          {
            path: `src/extras/${source}/${category}/${name}/${name}.tsx`,
            target: `${name}/${name}.tsx`,
          },
        ],
      })
    }
  }
}

export default defineConfig({
  registry: {
    name: 'solid-fx',
    description:
      'Animated, interactive SolidJS components — a component-for-component port of react-bits (TypeScript + Tailwind).',
    homepage: 'https://github.com/WyattAu/solid-fx',
    authors: ['Wyatt Au'],
    bugs: 'https://github.com/WyattAu/solid-fx/issues',
    repository: 'https://github.com/WyattAu/solid-fx',
    tags: [
      'solidjs',
      'solid-js',
      'typescript',
      'tailwind',
      'tailwindcss',
      'components',
      'component-library',
      'ui-components',
      'animations',
      'web',
    ],
    excludeDeps: ['solid-js'],
    items,
  },
})
