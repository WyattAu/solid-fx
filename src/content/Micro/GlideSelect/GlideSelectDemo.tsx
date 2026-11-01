import { createSignal } from 'solid-js'
import GlideSelect from './GlideSelect'

function GlideSelectDemo() {
  const [value, setValue] = createSignal('balanced')
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-zinc-950 p-8 text-white">
      <GlideSelect
        value={value()}
        onChange={setValue}
        ariaLabel="Model mode"
        options={[
          { value: 'fast', label: 'Fast', tag: 'low' },
          { value: 'balanced', label: 'Balanced', tag: 'default' },
          { value: 'quality', label: 'Quality', tag: 'slow' },
          'Custom…',
        ]}
      />
      <p class="text-sm text-zinc-400">Selected: {value()}</p>
    </div>
  )
}

export default GlideSelectDemo
