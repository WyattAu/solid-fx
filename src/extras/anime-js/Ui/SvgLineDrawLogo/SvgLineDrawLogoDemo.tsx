// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import SvgLineDrawLogo from './SvgLineDrawLogo'

function SvgLineDrawLogoDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 bg-gray-950 p-8 text-white">
      <div class="flex items-center gap-12">
        <SvgLineDrawLogo class="text-indigo-400" duration={900} strokeDelay={260} />
        <SvgLineDrawLogo class="text-gray-300" duration={650} strokeDelay={180} loopDelay={2200}>
          <svg
            viewBox="0 0 140 60"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-14"
            aria-hidden="true"
          >
            <path d="M14 48 L32 12 L50 48" />
            <line x1="22" y1="36" x2="42" y2="36" />
            <circle cx="76" cy="30" r="14" />
            <path d="M104 44 h22" />
          </svg>
        </SvgLineDrawLogo>
      </div>
      <p class="text-sm text-gray-500">
        createDrawable + draw — strokes ink themselves in, hold, then redraw.
      </p>
    </div>
  )
}

export default SvgLineDrawLogoDemo
