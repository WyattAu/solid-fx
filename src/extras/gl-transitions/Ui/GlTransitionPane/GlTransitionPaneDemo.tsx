// solid-fx FX widget — original component (not a port).
import GlTransitionPane from './GlTransitionPane'

function GlTransitionPaneDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <GlTransitionPane label="Wind (ragged wipe)" />
      <GlTransitionPane
        label="Swap (3D with reflection)"
        transition="swap"
        width={380}
        height={240}
      />
    </div>
  )
}

export default GlTransitionPaneDemo
