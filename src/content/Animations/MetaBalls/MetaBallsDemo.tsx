import MetaBalls from './MetaBalls'

function MetaBallsDemo() {
  return (
    <div class="h-96 w-full bg-neutral-950">
      <MetaBalls
        color="#8b7bff"
        cursorBallColor="#ffffff"
        animationSize={32}
        ballCount={16}
        gooeyness={0.7}
      />
    </div>
  )
}

export default MetaBallsDemo
