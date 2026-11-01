import GlareHover from './GlareHover'

function GlareHoverDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-6">
      <GlareHover
        width="340px"
        height="220px"
        borderRadius="16px"
        borderColor="#2a2a35"
        background="#0b0b12"
        glareColor="#8ecbff"
        glareSize={36}
        glareOpacity={0.6}
        mode="loop"
        interval={2.5}
      >
        <img
          src="https://picsum.photos/seed/glarehover/680/440"
          alt="Glare demo"
          class="h-full w-full rounded-[inherit] object-cover"
        />
      </GlareHover>
    </div>
  )
}

export default GlareHoverDemo
