import ShapeBlur from './ShapeBlur';

function ShapeBlurDemo() {
  return (
    <div class="relative h-96 w-full bg-neutral-950">
      <ShapeBlur
        shape="circle"
        size={0.55}
        color="#e0e7ff"
        blur={18}
        thickness={2.5}
        echoes={2}
        lensSize={0.32}
        class="h-full w-full"
      >
        <span class="text-xs font-medium tracking-[0.3em] text-white/70 uppercase">Shape blur</span>
      </ShapeBlur>
    </div>
  );
}

export default ShapeBlurDemo;
