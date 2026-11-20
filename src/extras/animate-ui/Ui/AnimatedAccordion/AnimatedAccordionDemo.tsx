// solid-fx Components widget — port of the Animate UI Accordion primitive.
import AnimatedAccordion from './AnimatedAccordion'

function AnimatedAccordionDemo() {
  return (
    <div class="flex w-full justify-center p-6">
      <div class="w-full max-w-xl rounded-xl border border-gray-800 bg-gray-900 px-5 py-2">
        <AnimatedAccordion
          label="frequently asked"
          defaultOpen={[0]}
          duration={320}
          items={[
            {
              question: 'Is the code actually mine after install?',
              answer:
                'Yes — every component is a single .tsx file copied into your repo. No runtime dependency on solid-fx, no version to upgrade, every line editable.',
            },
            {
              question: 'Why no Wasm anywhere?',
              answer:
                'Monomorphic typed-array JS over flat Float64Array/Uint32Array buffers compiles to fast machine code in V8 and keeps a single-language build. Heavy rendering goes to WebGL2 fragment shaders with capability probes.',
            },
            {
              question: 'What license governs the ports?',
              answer:
                'Each upstream source is license-vetted before the first port lands (MIT/ISC/Apache-2.0 families). The library itself is MIT + Commons Clause — usable in any product, not resaleable as a component library.',
            },
          ]}
        />
      </div>
    </div>
  )
}

export default AnimatedAccordionDemo
