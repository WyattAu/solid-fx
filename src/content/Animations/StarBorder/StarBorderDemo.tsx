import StarBorder from './StarBorder';

function StarBorderDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950">
      <StarBorder duration={4} color="#a855f7" glow={0.8} sparkle onClickPulse>
        <span class="px-4 text-base text-white">Launch mission</span>
      </StarBorder>
    </div>
  );
}

export default StarBorderDemo;
