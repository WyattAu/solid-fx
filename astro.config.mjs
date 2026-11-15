import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import solidJs from '@astrojs/solid-js'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

const CATEGORIES = ['TextAnimations', 'Animations', 'Components', 'Micro', 'Backgrounds']

// Explicit sidebar entries from the generated docs tree. Deterministic:
// avoids Starlight's autogenerate slug-matching entirely (which silently
// produced empty groups when ids kept file casing).
function catGroup(category) {
  const dir = `./docs/${category.toLowerCase()}`
  let names = []
  try {
    names = readdirSync(dir)
      .filter(f => f.endsWith('.mdx'))
      .map(f => f.replace('.mdx', ''))
      .sort()
  } catch {
    names = []
  }
  return {
    label: category,
    collapsed: true,
    items: names.map(name => ({
      label: name,
      link: `/${category.toLowerCase()}/${name.toLowerCase()}/`,
    })),
  }
}

// "Scenes" sidebar group from the generated docs/scenes tree — flat
// docs/scenes/<scene-lower>.mdx pages (gen-docs.mjs writes one file per
// scene, no per-scene dirs). Labels come from the frontmatter title so the
// sidebar keeps the original scene casing.
function sceneGroup() {
  const base = './docs/scenes'
  let slugs = []
  try {
    slugs = readdirSync(base)
      .filter(f => f.endsWith('.mdx'))
      .map(f => f.replace('.mdx', ''))
      .sort()
  } catch {
    slugs = []
  }
  const items = slugs.map(slug => {
    let label = slug
    try {
      const frontmatter = readFileSync(path.join(base, `${slug}.mdx`), 'utf8').split('---')[1] ?? ''
      const title = frontmatter.match(/^title: (.+)$/m)
      if (title) label = title[1].trim()
    } catch {
      // keep the slug fallback label
    }
    return { label, link: `/scenes/${slug}/` }
  })
  return { label: 'Scenes', collapsed: true, items }
}

// "Extras" sidebar groups from the generated docs/extras/<source> tree —
// docs/extras/<source>/<category-lower>/<Name>.mdx pages (gen-docs.mjs writes
// one file per component). Links lowercase the file name to match Starlight's
// slug generation (same rule as catGroup).
const EXTRAS_GROUPS = [
  ['magic-ui', 'Magic UI'],
  ['tsparticles', 'tsParticles'],
  ['anime-js', 'anime.js'],
  ['motion-primitives', 'Motion Primitives'],
  ['osint', 'OSINT'],
  ['seo', 'SEO'],
]

function extrasGroup([source, label]) {
  const base = `./docs/extras/${source}`
  let pages = []
  try {
    pages = readdirSync(base, { recursive: true })
      .filter(f => f.endsWith('.mdx'))
      .map(f => f.replace('.mdx', ''))
      .sort()
  } catch {
    pages = []
  }
  const items = pages.map(rel => {
    const name = rel.split('/').pop() ?? rel
    return { label: name, link: `/extras/${source}/${rel.toLowerCase()}/` }
  })
  return { label, collapsed: true, items }
}

export default defineConfig({
  site: 'https://wyattau.github.io',
  base: '/solid-fx',
  output: 'static',
  integrations: [
    starlight({
      title: 'solid-fx',
      description:
        'Animated, interactive SolidJS components — ports of the best UI effects libraries, installed as source you own.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/WyattAu/solid-fx' }],
      customCss: ['./src/site/global.css'],
      components: {
        ThemeProvider: './src/site/ThemeProvider.astro',
        PageFrame: './src/site/PageFrame.astro',
        Hero: './src/site/Hero.astro',
      },
      sidebar: [...CATEGORIES.map(catGroup), ...EXTRAS_GROUPS.map(extrasGroup), sceneGroup()],
    }),
    solidJs(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
