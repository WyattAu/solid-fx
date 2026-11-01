import LogoLoop from './LogoLoop';
import type { LogoItem } from './LogoLoop';

const NAMES = ['Solid Bits', 'Astro', 'Tailwind', 'GSAP', 'TypeScript', 'Vite'];

const LOGOS: LogoItem[] = NAMES.map(name => ({
  node: (
    <span class="text-xl font-bold tracking-tight text-neutral-200">
      {name}
      <span class="text-indigo-400">.</span>
    </span>
  ),
  title: name
}));

function LogoLoopDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950">
      <LogoLoop logos={LOGOS} logoHeight={32} speed={90} layout="wave" bend={0.4} />
    </div>
  );
}

export default LogoLoopDemo;
