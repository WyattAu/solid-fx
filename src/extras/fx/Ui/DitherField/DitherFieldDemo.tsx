// solid-fx FX widget — original component (not a port).
import DitherField from './DitherField'

function DitherFieldDemo() {
  return (
    <div class="flex w-full flex-wrap justify-center gap-8 p-6">
      <DitherField label="cyan → amber" />
      <DitherField
        label="paper (frozen)"
        from="#e7e0cf"
        to="#3a352d"
        speed={0}
        scale={0.6}
        width={240}
        height={160}
      />
      <DitherField
        label="deep space"
        from="#0b1026"
        to="#7c3aed"
        scale={1.6}
        width={280}
        height={180}
      />
    </div>
  )
}

export default DitherFieldDemo
