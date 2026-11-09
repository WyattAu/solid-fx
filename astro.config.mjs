import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'

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

// "Scenes" sidebar group from the generated docs/scenes tree — one dir per
// scene at docs/scenes/<scene-lower>/<scene-lower>.mdx. Labels come from the
// frontmatter title so the sidebar keeps the original scene casing.
function sceneGroup() {
  const base = './docs/scenes'
  let dirs = []
  try {
    dirs = readdirSync(base, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort()
  } catch {
    dirs = []
  }
  const items = dirs.flatMap(dir =>
    readdirSync(path.join(base, dir))
      .filter(f => f.endsWith('.mdx'))
      .map(f => {
        let label = dir
        try {
          const frontmatter = readFileSync(path.join(base, dir, f), 'utf8').split('---')[1] ?? ''
          const title = frontmatter.match(/^title: (.+)$/m)
          if (title) label = title[1].trim()
        } catch {
          // keep the dir-name fallback label
        }
        return { label, link: `/scenes/${dir}/${path.basename(f, '.mdx')}/` }
      }),
  )
  return { label: 'Scenes', collapsed: true, items }
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
      sidebar: [...CATEGORIES.map(catGroup), sceneGroup()],
    }),
    solidJs(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
