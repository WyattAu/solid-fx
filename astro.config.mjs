import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

const CATEGORIES = ['TextAnimations', 'Animations', 'Components', 'Micro', 'Backgrounds'] as const;

export default defineConfig({
  output: 'static',
  integrations: [
    starlight({
      title: 'solid-bits',
      description:
        'Animated, interactive SolidJS components — a component-for-component port of react-bits.',
      defaultAppearance: 'dark',
      socials: { github: 'https://github.com/WyattAu/solid-bits' },
      customCss: ['./src/site/global.css'],
      sidebar: CATEGORIES.map((category) => ({
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
});
