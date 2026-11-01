import BubbleMenu from './BubbleMenu'

function BubbleMenuDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-gray-950">
      <BubbleMenu
        logo={<span class="text-sm font-bold tracking-tight text-gray-900">solid·bits</span>}
        menuAriaLabel="Toggle demo menu"
      />
      <div class="flex h-full items-center justify-center text-sm text-white/40">
        Click the toggle bubble to open the menu
      </div>
    </div>
  )
}

export default BubbleMenuDemo
