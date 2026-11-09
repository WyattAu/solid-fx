// solid-fx scenes layer — composition, not a port.
import FeatureGridScene from './FeatureGridScene'

function FeatureGridSceneDemo() {
  return (
    <section class="w-full px-8 py-12">
      <FeatureGridScene
        backdrop="dots"
        columns={3}
        features={[
          {
            title: 'Zero-runtime ports',
            description:
              'Every effect is plain SolidJS + TypeScript source you copy into your repo — no registry, no wrapper runtime.',
          },
          {
            title: 'Shader-backed',
            description:
              'WebGL and canvas backgrounds with strict disposal discipline, from Aurora to PixelBlast.',
          },
          {
            title: 'Text, animated',
            description:
              'DecryptedText, SplitText, GlitchText and friends — the whole react-bits text arsenal, Solid-native.',
          },
          {
            title: 'Glass surfaces',
            description:
              'Refraction-backed panels that stay legible over any backdrop, including live particle fields.',
          },
          {
            title: 'Scenes layer',
            description:
              'Full-page compositions like this one: backgrounds, cards and text effects wired together.',
          },
          {
            title: 'QA-triaged',
            description:
              'Every demo is screenshot-verified in CI and blank-frame triaged — see QA-TRIAGE.md.',
          },
        ]}
      />
    </section>
  )
}

export default FeatureGridSceneDemo
