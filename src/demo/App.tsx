import { ErrorBoundary, For, Show, createMemo, createSignal, lazy, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import { Suspense } from 'solid-js';

const demoModules = import.meta.glob('/src/content/**/*Demo.tsx');

const CATEGORIES = ['TextAnimations', 'Animations', 'Components', 'Micro', 'Backgrounds'] as const;

type DemoEntry = { name: string; category: string; load: () => Promise<{ default: Component }> };

const entries: DemoEntry[] = Object.entries(demoModules).map(([file, load]) => {
  const parts = file.split('/');
  // /src/content/<Category>/<Name>/<Name>Demo.tsx
  return {
    category: parts[3],
    name: parts[4],
    load: load as () => Promise<{ default: Component }>,
  };
});

const byCategory = (category: string) => entries.filter((e) => e.category === category);

function DemoCard(props: { entry: DemoEntry }) {
  const Demo = lazy(props.entry.load);
  return (
    <figure class="flex flex-col overflow-hidden rounded-2xl border border-white/10">
      <div class="relative flex h-72 items-center justify-center overflow-hidden bg-black/40">
        <ErrorBoundary
          fallback={(err, reset) => (
            <div class="p-4 text-center text-xs text-red-300">
              <p class="font-mono">{String(err)}</p>
              <button class="mt-2 rounded border border-white/20 px-2 py-1" onClick={reset}>
                retry
              </button>
            </div>
          )}
        >
          <Suspense fallback={<span class="text-xs text-white/40">loading…</span>}>
            <Demo />
          </Suspense>
        </ErrorBoundary>
      </div>
      <figcaption class="border-t border-white/10 px-3 py-2 font-mono text-xs text-white/60">
        {props.entry.name}
      </figcaption>
    </figure>
  );
}

export default function App() {
  const [route, setRoute] = createSignal(location.hash || '#/');
  const onHash = () => setRoute(location.hash || '#/');
  window.addEventListener('hashchange', onHash);
  onCleanup(() => window.removeEventListener('hashchange', onHash));

  const category = createMemo(() => {
    const match = route().match(/^#\/([A-Za-z]+)/);
    const value = match?.[1];
    return value && (CATEGORIES as readonly string[]).includes(value) ? value : null;
  });

  return (
    <div class="flex min-h-screen">
      <nav class="w-56 shrink-0 border-r border-white/10 p-4">
        <a href="#/" class="block pb-4 text-lg font-bold tracking-tight">
          solid<span class="text-fuchsia-400">-bits</span>
        </a>
        <For each={[...CATEGORIES]}>
          {(cat) => (
            <a
              href={`#/${cat}`}
              class="block rounded px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              classList={{ 'bg-white/10 text-white': category() === cat }}
            >
              {cat}
              <span class="ml-1 text-white/30">{byCategory(cat).length}</span>
            </a>
          )}
        </For>
        <p class="mt-6 px-2 text-[11px] leading-relaxed text-white/30">
          SolidJS port of react-bits.
          <br />
          MIT + Commons Clause.
        </p>
      </nav>
      <main class="flex-1 p-6">
        <Show
          when={category()}
          fallback={
            <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
              <For each={[...CATEGORIES]}>
                {(cat) => (
                  <a
                    href={`#/${cat}`}
                    class="rounded-2xl border border-white/10 p-6 hover:border-white/30"
                  >
                    <p class="text-xl font-semibold">{cat}</p>
                    <p class="mt-1 text-sm text-white/40">{byCategory(cat).length} components</p>
                  </a>
                )}
              </For>
            </div>
          }
        >
          {(cat) => (
            <>
              <h1 class="pb-4 text-2xl font-semibold">{cat()}</h1>
              <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                <For each={byCategory(cat())}>{(entry) => <DemoCard entry={entry} />}</For>
              </div>
            </>
          )}
        </Show>
      </main>
    </div>
  );
}
