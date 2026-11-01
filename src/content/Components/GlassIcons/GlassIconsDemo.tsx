import { For } from 'solid-js';
import GlassIcons from './GlassIcons';
import type { GlassIconsItem } from './GlassIcons';

const PATHS = [
  'M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z',
  'M12 3l2.7 5.6 6.3.9-4.5 4.4 1.1 6.1L12 17.2 6.4 20l1.1-6.1L3 9.5l6.3-.9L12 3Z',
  'M13 2 4 14h7l-1 8 10-13h-7l0-7Z',
  'M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16ZM10 21h4',
  'M12 21c0 0-8-6.5-8-11.5C4 6.5 6.5 4 9.5 4c1.5 0 2.5 1 2.5 1s1-1 2.5-1C17.5 4 20 6.5 20 9.5 20 14.5 12 21 12 21Z',
  'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.4 4a8.4 8.4 0 0 0-.2-1.8l2-1.6-2-3.4-2.4 1a8.4 8.4 0 0 0-1.6-.9L15.8 2h-3.9l-.4 2.3c-.6.2-1.1.5-1.6.9l-2.4-1-2 3.4 2 1.6a8.4 8.4 0 0 0 0 3.6l-2 1.6 2 3.4 2.4-1c.5.4 1 .7 1.6.9l.4 2.3h3.9l.4-2.3c.6-.2 1.1-.5 1.6-.9l2.4 1 2-3.4-2-1.6c.1-.6.2-1.2.2-1.8Z'
];

const COLORS = ['blue', 'purple', 'orange', 'teal', 'pink', 'green'];

function GlassIconsDemo() {
  const items: GlassIconsItem[] = PATHS.map((d, i) => ({
    id: i,
    label: ['Home', 'Star', 'Bolt', 'Bell', 'Heart', 'Settings'][i],
    color: COLORS[i],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
        <path d={d} />
      </svg>
    )
  }));

  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-6">
      <GlassIcons items={items} intro={true} />
    </div>
  );
}

export default GlassIconsDemo;
