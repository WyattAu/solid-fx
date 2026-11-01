import Stack from './Stack'

function StackDemo() {
  const cards = [1, 2, 3, 4, 5].map(n => (
    <img
      src={`https://picsum.photos/seed/stack-demo-${n}/480/480`}
      alt={`Card ${n}`}
      draggable={false}
      class="h-full w-full object-cover"
    />
  ))
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-xl bg-neutral-900">
      <div class="h-64 w-64">
        <Stack cards={cards} layout="fan" autoplay autoplayDelay={2600} shadow radius={16} />
      </div>
    </div>
  )
}

export default StackDemo
