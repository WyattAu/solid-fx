import ScrollStack, { ScrollStackItem } from './ScrollStack'

function ScrollStackDemo() {
  return (
    <div class="h-[480px] w-full p-4">
      <ScrollStack itemDistance={80} itemStackDistance={30} stackPosition="20%" dimAmount={0.25}>
        <ScrollStackItem>
          <p class="text-xs tracking-widest text-black/40 uppercase">card 01</p>
          <p class="mt-2 text-2xl font-bold">Pins as you scroll</p>
          <p class="mt-2 text-sm text-black/50">Each card stacks onto the previous one.</p>
        </ScrollStackItem>
        <ScrollStackItem>
          <p class="text-xs tracking-widest text-black/40 uppercase">card 02</p>
          <p class="mt-2 text-2xl font-bold">Then recedes</p>
          <p class="mt-2 text-sm text-black/50">Depth, dim and scale build up per layer.</p>
        </ScrollStackItem>
        <ScrollStackItem>
          <p class="text-xs tracking-widest text-black/40 uppercase">card 03</p>
          <p class="mt-2 text-2xl font-bold">Until complete</p>
          <p class="mt-2 text-sm text-black/50">onStackComplete fires at the end.</p>
        </ScrollStackItem>
      </ScrollStack>
    </div>
  )
}

export default ScrollStackDemo
