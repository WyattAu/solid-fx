import type { Component } from 'solid-js'
import { ErrorBoundary, Suspense, lazy } from 'solid-js'

const demoModules = {
  ...import.meta.glob<{ default: Component }>('/src/content/**/*Demo.tsx'),
  ...import.meta.glob<{ default: Component }>('/src/extras/**/*Demo.tsx'),
  ...import.meta.glob<{ default: Component }>('/src/scenes/**/*SceneDemo.tsx'),
}

/**
 * The single consumer of every <Name>Demo.tsx. Starlight pages (generated)
 * embed one island per component:
 *   content pages: <DemoIsland client:only="solid" category="..." name="..." />
 *   extras pages:  <DemoIsland client:only="solid" tree="extras/magic-ui" category="Ui" name="..." />
 *   scene pages:   <DemoIsland client:only="solid" tree="scenes" name="HeroScene" />
 */
export default function DemoIsland(props: { tree?: string; category?: string; name: string }) {
  const tree = props.tree ?? 'content'
  // Scenes sit one level shallower than components: src/scenes/<Scene>/<Scene>Demo.tsx
  const key =
    tree === 'scenes'
      ? `/src/scenes/${props.name}/${props.name}Demo.tsx`
      : `/src/${tree}/${props.category}/${props.name}/${props.name}Demo.tsx`
  const loader = demoModules[key]
  if (!loader) {
    return (
      <p class="demo-missing">
        no demo found for <code>{props.name}</code>
      </p>
    )
  }
  const Demo = lazy(loader)
  return (
    <div class="demo-frame">
      <ErrorBoundary
        fallback={(err, reset) => (
          <div class="demo-error">
            <p>{String(err)}</p>
            <button type="button" onClick={reset}>
              retry
            </button>
          </div>
        )}
      >
        <Suspense fallback={<p class="demo-loading">loading…</p>}>
          <Demo />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
