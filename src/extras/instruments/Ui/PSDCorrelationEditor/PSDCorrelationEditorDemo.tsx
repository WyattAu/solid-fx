// solid-fx Instruments widget — original component (not a port).
import PSDCorrelationEditor from './PSDCorrelationEditor'

function PSDCorrelationEditorDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <div class="w-72">
        <PSDCorrelationEditor
          label="factor covariance (risk/size/momentum)"
          labels={['risk', 'size', 'mom']}
        />
      </div>
      <div class="w-72">
        <PSDCorrelationEditor
          label="impossible triple — repair it"
          labels={['x', 'y', 'z']}
          initial={[0.9, 0.9, -0.7]}
        />
      </div>
    </div>
  )
}

export default PSDCorrelationEditorDemo
