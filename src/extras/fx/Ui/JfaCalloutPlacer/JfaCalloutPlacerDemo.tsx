// solid-fx FX widget — original component (not a port).
import JfaCalloutPlacer from './JfaCalloutPlacer'

function JfaCalloutPlacerDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <JfaCalloutPlacer label="dashboard callout (drag boxes to repack)" />
      <JfaCalloutPlacer
        label="text-dense layout"
        width={420}
        height={280}
        calloutText="annotation slot"
        boxes={[
          { label: 'intro', x: 0.03, y: 0.05, w: 0.4, h: 0.25 },
          { label: 'figure 1', x: 0.55, y: 0.05, w: 0.4, h: 0.3 },
          { label: 'table', x: 0.03, y: 0.62, w: 0.55, h: 0.3 },
          { label: 'refs', x: 0.65, y: 0.6, w: 0.32, h: 0.28 },
        ]}
      />
    </div>
  )
}

export default JfaCalloutPlacerDemo
