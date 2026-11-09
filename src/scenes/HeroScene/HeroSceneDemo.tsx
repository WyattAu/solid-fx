import HeroScene from './HeroScene'

function HeroSceneDemo() {
  return (
    <div class="w-full">
      <HeroScene
        height={420}
        tagline="Ports of the best UI effect libraries — installed as source you own. Tune every value."
        ctaPrimary={{ text: 'Browse components', href: '/solid-fx/textanimations/splittext/' }}
        ctaSecondary={{ text: 'GitHub', href: 'https://github.com/WyattAu/solid-fx' }}
      />
    </div>
  )
}

export default HeroSceneDemo
