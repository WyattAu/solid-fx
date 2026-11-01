import PlasmaWave from './PlasmaWave'

export default function PlasmaWaveDemo() {
  return (
    <div class="h-96 w-full">
      <PlasmaWave colors={['#A855F7', '#06B6D4']} speed={1} bend1={1} bend2={0.5} />
    </div>
  )
}
