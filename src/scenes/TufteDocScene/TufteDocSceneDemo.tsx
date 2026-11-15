// solid-fx scenes layer — composition, not a port.
import SparklineText from '@/extras/data/Ui/SparklineText/SparklineText'
import TufteDocScene, { type Sidenote } from './TufteDocScene'

const notes: Array<string | Sidenote> = [
  'Gray-Scott is the smallest reaction-diffusion system that still makes pictures: two chemicals, one that feeds and one that kills. U is supplied continuously and catalyzes its own conversion into V, and V drains away at rate k. Everything below is that one equation, read like a paper should be read — claims on the line, evidence in the margin.',
  {
    n: 1,
    body: 'The Laplacian is the only spatial term: five taps, weights 0.2/0.05. Eighty pixels of state per texel is unnecessary — two channels carry the whole chemistry.',
  },
  'The regime lives in two numbers. Near F=0.037, k=0.06 the field divides like cells; raise the feed toward 0.0545 and the growth turns coral-like, branching into dead ends; drop both and stable localized spots — solitons — survive any perturbation we could throw at them.',
  {
    n: 2,
    body: 'Regime stability measured over 12 reseeded runs per parameter pair (the widget reseeds deterministically from the same mulberry32 stream). Solitons: 12/12 recovered. Coral: 9/12, the remainder froze into stripes.',
  },
  'The interactive part matters more than the equation. Injection is the experiment: press into the field and you apply the catalyst where you choose. That is the whole scientific loop — perturb, watch, re-derive — compressed into a pointer drag. The generation counter is the lab notebook.',
  {
    n: 3,
    body: (
      <>
        Feed-rate sweep, time-to-pattern (seconds of simulated chemistry):{' '}
        <SparklineText
          data={[8.2, 6.1, 5.4, 5.9, 7.3, 9.8, 12.1]}
          width={72}
          height={12}
          color="#fbbf24"
          title="time to pattern vs feed rate"
        />{' '}
        — minimum near F=0.04, rising at both ends.
      </>
    ),
  },
  'Nothing here required a framework, a shader package, or a server. The entire instrument is one fragment shader ping-ponging two textures — source you own, values you can tune, margins that keep up with the line they annotate.',
]

function TufteDocSceneDemo() {
  return (
    <div class="w-full bg-gray-950 py-10">
      <TufteDocScene
        title="Reading Gray-Scott in the margin"
        subtitle="A sidenote-first explorable: the claim on the line, the evidence beside it."
        blocks={notes}
      />
    </div>
  )
}

export default TufteDocSceneDemo
