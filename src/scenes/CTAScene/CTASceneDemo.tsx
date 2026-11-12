// solid-fx scenes layer — composition, not a port.
import CTAScene from './CTAScene'

function CTASceneDemo() {
  return (
    <section class="w-full px-8 py-12">
      <CTAScene
        heading="Own your animations"
        subheading="218 components, installed as source you can read and tune — no registry, no lock-in."
        ctaText="Browse components"
        ctaHref="/solid-fx/textanimations/splittext/"
      />
    </section>
  )
}

export default CTASceneDemo
