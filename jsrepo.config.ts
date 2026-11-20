import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type RegistryItem, repository } from 'jsrepo'

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

// Consumer-facing item names are bare (the GitHub provider resolves the last
// path segment of `jsrepo add github/owner/repo/<name>` against the manifest,
// so names must not contain '/'). Content ports keep upstream names; extras
// mirrors of a taken name get their source prefixed (PascalCase).
const pascal = (s: string) =>
  s
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
const usedNames = new Set<string>()

// Shared lib modules as registry items so block imports (@/lib/…) resolve
// into registryDependencies — consumers get the lib files pulled in and
// their imports rewritten on add.
const LIB_ITEMS = [
  'HugeiconsIcon.tsx',
  'num.ts',
  'reducedMotion.ts',
  'syntheticPointer.ts',
  'urlState.ts',
]
for (const file of LIB_ITEMS) {
  const libPath = path.join('src/lib', file)
  if (!existsSync(libPath)) continue
  usedNames.add(path.basename(file, path.extname(file)))
  items.push({
    name: `lib/${path.basename(file, path.extname(file))}`,
    title: path.basename(file, path.extname(file)),
    description: `Shared utility module for solid-fx blocks (src/lib/${file}).`,
    type: 'lib',
    category: 'lib',
    categories: ['lib'],
    files: [
      {
        path: libPath,
        target: `src/lib/${file}`,
      },
    ],
  })
}

for (const category of CATEGORIES) {
  const categoryDir = path.join('src/content', category)
  if (!existsSync(categoryDir)) continue
  for (const name of readdirSync(categoryDir).sort()) {
    const component = path.join(categoryDir, name, `${name}.tsx`)
    if (!existsSync(component)) continue
    usedNames.add(name)
    items.push({
      name,
      title: name,
      description: `SolidJS port of the react-bits ${name} component (TypeScript + Tailwind).`,
      type: 'component',
      category,
      categories: [category],
      files: [
        {
          path: `src/content/${category}/${name}/${name}.tsx`,
          target: `src/components/${name}/${name}.tsx`,
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
      let itemName = name
      if (usedNames.has(itemName)) {
        itemName = `${pascal(source)}${name}`
      }
      usedNames.add(itemName)
      items.push({
        name: itemName,
        title: name,
        description: `${name} for SolidJS (source tree: src/extras/${source}).`,
        type: 'component',
        category: source,
        categories: [source],
        files: [
          {
            path: `src/extras/${source}/${category}/${name}/${name}.tsx`,
            target: `src/components/${itemName}/${itemName}.tsx`,
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
    defaultPaths: {
      component: 'src/components',
      lib: 'src/lib',
    },
    outputs: [repository()],
  },
})
