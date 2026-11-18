// solid-fx TextAnimations widget — original component (not a port).
import { For } from 'solid-js'
import RoughNotation from './RoughNotation'

const STYLES = [
  { type: 'underline', color: '#f59e0b' },
  { type: 'box', color: '#38bdf8' },
  { type: 'circle', color: '#34d399' },
  { type: 'highlight', color: '#f472b6' },
  { type: 'strike-through', color: '#fb7185' },
  { type: 'crossed-off', color: '#a78bfa' },
  { type: 'bracket', color: '#94a3b8' },
] as const

function RoughNotationDemo() {
  return (
    <div class="flex w-full flex-col gap-5 p-6 text-lg leading-relaxed text-gray-200">
      <p>
        The contract ships with{' '}
        <RoughNotation type="highlight" color="#fbbf24">
          seven annotation styles
        </RoughNotation>
        , each drawn as an animated hand-drawn SVG.
      </p>
      <p>
        They draw on first viewport entry, so the{' '}
        <RoughNotation type="circle" color="#34d399" strokeWidth={2.5}>
          effect lands while reading
        </RoughNotation>{' '}
        — not before the reader arrives.
      </p>
      <div class="grid grid-cols-2 gap-x-8 gap-y-3 text-base">
        <For each={STYLES}>
          {s => (
            <span>
              <RoughNotation type={s.type} color={s.color} padding={s.type === 'bracket' ? 2 : 4}>
                {s.type}
              </RoughNotation>
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

export default RoughNotationDemo
