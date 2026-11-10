// Source: github.com/codse/animata animata/button/shining-button.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream imports ArrowRight from lucide-react; the identical SVG
// (24×24 stroke path) is inlined here so the extras tree stays dependency-free.
function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-6 w-6 transition-all duration-700 ease-in-out group-hover/shine:translate-x-2 group-hover/shine:scale-125"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

export default function ShiningButton() {
  const label = 'See Calendar'
  return (
    <button
      type="button"
      class="group/shine cursor-pointer rounded-xl border-4 border-violet-800/0 bg-transparent p-1 transition-colors duration-500 hover:border-violet-800/100"
    >
      <div class="relative flex items-center justify-center gap-4 overflow-hidden rounded-lg bg-violet-800 px-6 py-4 font-bold text-white">
        {label}
        <ArrowRightIcon />
        <div class="absolute -left-16 top-0 h-full w-12 rotate-[30deg] scale-y-150 bg-white/10 transition-all duration-700 ease-in-out group-hover/shine:left-[calc(100%+1rem)]" />
      </div>
    </button>
  )
}
