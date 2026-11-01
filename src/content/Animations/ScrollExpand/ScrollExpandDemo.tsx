import ScrollExpand from './ScrollExpand'

function ScrollExpandDemo() {
  return (
    <div class="w-full p-4">
      <div class="mx-auto h-[480px] w-full max-w-xl">
        <ScrollExpand
          src="https://picsum.photos/seed/scroll-expand/1200/800"
          alt="Expanding media"
          title="Keep scrolling"
          scrollHint="scroll to expand"
          scrollDistance={1.4}
        >
          <p class="text-2xl font-bold text-white drop-shadow">Fully expanded</p>
          <p class="mt-2 text-sm text-white/70">Children land here after the hold.</p>
        </ScrollExpand>
      </div>
    </div>
  )
}

export default ScrollExpandDemo
