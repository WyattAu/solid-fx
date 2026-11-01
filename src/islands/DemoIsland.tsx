import type { Component } from 'solid-js'
import { ErrorBoundary, Suspense, lazy } from 'solid-js'

const demoModules = import.meta.glob<{ default: Component }>('/src/content/**/*Demo.tsx')

/**
 * The single consumer of every <Name>Demo.tsx. Starlight pages (generated)
 * embed one island per component: <DemoIsland client:only="solid" category="..." name="..." />
 */
export default function DemoIsland(props: { category: string; name: string }) {
  const key = `/src/content/${props.category}/${props.name}/${props.name}Demo.tsx`
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
