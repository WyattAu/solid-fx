import MorphSlider from './MorphSlider'

const ITEMS = [1, 2, 3, 4].map(n => ({
  image: `https://picsum.photos/seed/morphslider-${n}/1200/800`,
  caption: ['Summit', 'Drift', 'Ember', 'Tide'][n - 1],
}))

function MorphSliderDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950 p-6">
      <MorphSlider items={ITEMS} transition="melt" duration={1.1} radius={16} />
    </div>
  )
}

export default MorphSliderDemo
