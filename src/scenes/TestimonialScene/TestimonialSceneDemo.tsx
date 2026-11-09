// solid-fx scenes layer — composition, not a port.
import TestimonialScene from './TestimonialScene'

function TestimonialSceneDemo() {
  return (
    <section
      class="w-full px-8 py-12"
      style={{ background: 'linear-gradient(160deg, #05060f 0%, #111827 55%, #312e81 100%)' }}
    >
      <TestimonialScene
        testimonials={[
          {
            quote:
              'Swapped react-bits for solid-fx and nothing else changed — same props, same look, half the runtime.',
            author: 'Mara Chen — staff engineer',
          },
          {
            quote:
              'The scenes layer saved us a sprint. Backgrounds, glass cards, copy: assembled, not hand-glued.',
            author: 'Diego Ruiz — design lead',
          },
          {
            quote: 'Cleanup discipline is real: zero leaked canvases after our soak tests.',
            author: 'Priya Nair — platform',
          },
        ]}
      />
    </section>
  )
}

export default TestimonialSceneDemo
