import PrismaticBurst from './PrismaticBurst'

export default function PrismaticBurstDemo() {
  return (
    <div class="h-96 w-full">
      <PrismaticBurst
        colors={['#ff33a1', '#33ccff', '#ffe600']}
        animationType="rotate3d"
        intensity={2}
      />
    </div>
  )
}
