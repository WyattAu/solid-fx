import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, type RegistryItem } from 'jsrepo';

const CATEGORIES = ['TextAnimations', 'Animations', 'Components', 'Micro', 'Backgrounds'];

const items: RegistryItem[] = [];
for (const category of CATEGORIES) {
  const categoryDir = path.join('src/content', category);
  if (!existsSync(categoryDir)) continue;
  for (const name of readdirSync(categoryDir).sort()) {
    const component = path.join(categoryDir, name, `${name}.tsx`);
    if (!existsSync(component)) continue;
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
    });
  }
}

export default defineConfig({
  registry: {
    name: 'solid-bits',
    description:
      'Animated, interactive SolidJS components — a component-for-component port of react-bits (TypeScript + Tailwind).',
    homepage: 'https://github.com/WyattAu/solid-bits',
    authors: ['Wyatt Au'],
    bugs: 'https://github.com/WyattAu/solid-bits/issues',
    repository: 'https://github.com/WyattAu/solid-bits',
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
});
