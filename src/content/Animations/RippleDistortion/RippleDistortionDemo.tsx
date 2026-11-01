import { onCleanup, onMount } from 'solid-js';
import RippleDistortion from './RippleDistortion';

function RippleDistortionDemo() {
  let box!: HTMLDivElement;

  // Nudge the fluid with synthetic pointer sweeps so the demo moves on its own.
  onMount(() => {
    let t = 0;
    const id = setInterval(() => {
      const rect = box?.getBoundingClientRect();
      if (!rect || !rect.width) return;
      t += 0.4;
      const x = rect.left + rect.width * (0.5 + 0.36 * Math.cos(t));
      const y = rect.top + rect.height * (0.5 + 0.3 * Math.sin(t * 1.3));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y }));
    }, 110);
    onCleanup(() => clearInterval(id));
  });

  return (
    <div ref={box} class="relative h-96 w-full overflow-hidden bg-black">
      <RippleDistortion
        class="h-full w-full"
        src="https://picsum.photos/seed/rippledistortion/900/600"
        quality="low"
        grayscale={false}
        tint="#a855f7"
        tintAmount={0.2}
        glint={0.4}
      />
    </div>
  );
}

export default RippleDistortionDemo;
