import { readdirSync } from 'node:fs'
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
      link: `/solid-fx/${category.toLowerCase()}/${name.toLowerCase()}/`,
    })),
  }
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
      sidebar: [...CATEGORIES.map(catGroup)],
    }),
    solidJs(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
