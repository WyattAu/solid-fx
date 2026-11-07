// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import TimelineTextReveal from './TimelineTextReveal'

function TimelineTextRevealDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-gray-950 p-8 text-white">
      <TimelineTextReveal
        lines={['Choreograph', 'every glyph', 'on one timeline']}
        charDelay={26}
        lineDelay={420}
        duration={650}
        class="text-center text-3xl font-bold tracking-tight text-gray-100 md:text-5xl"
      />
      <p class="text-sm text-gray-500">
        createTimeline + stagger — each line masked, each glyph slid into place.
      </p>
    </div>
  )
}

export default TimelineTextRevealDemo
