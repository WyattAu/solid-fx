import StickerPeel from './StickerPeel'

function StickerPeelDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-neutral-900">
      <StickerPeel
        imageSrc="https://picsum.photos/seed/stickerpeel/320/320"
        width={190}
        finish="holo"
        lightingIntensity={0.6}
      />
      <div class="pointer-events-none absolute bottom-4 left-0 w-full text-center text-xs tracking-[0.25em] text-neutral-500 uppercase">
        Drag the sticker
      </div>
    </div>
  )
}

export default StickerPeelDemo
