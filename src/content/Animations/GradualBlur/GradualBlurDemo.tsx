import GradualBlur from './GradualBlur';

function GradualBlurDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-xl bg-gray-950">
      <img
        src="https://picsum.photos/seed/gradualblur/1200/800"
        alt="Sample landscape"
        class="h-full w-full object-cover"
      />
      <GradualBlur target="parent" position="bottom" height="45%" strength={3} layers={8} hoverIntensity={1.6} />
    </div>
  );
}

export default GradualBlurDemo;
