import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'

const CATEGORIES = ['TextAnimations', 'Animations', 'Components', 'Micro', 'Backgrounds']

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
      sidebar: CATEGORIES.map(category => ({
        label: category,
        collapsed: true,
        items: [{ autogenerate: { directory: category.toLowerCase() } }],
      })),
    }),
    solidJs(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
