// solid-fx FX widget — original component (not a port).
import ReactionDiffusion from './ReactionDiffusion'

function ReactionDiffusionDemo() {
  return (
    <div class="flex w-full flex-wrap justify-center gap-8 p-6">
      <ReactionDiffusion label="mitosis (F=0.037, k=0.06)" />
      <ReactionDiffusion
        label="coral (F=0.0545, k=0.062)"
        feed={0.0545}
        kill={0.062}
        width={320}
        height={200}
        paused
      />
      <ReactionDiffusion label="solitons (F=0.030, k=0.057)" feed={0.03} kill={0.057} steps={14} />
    </div>
  )
}

export default ReactionDiffusionDemo
