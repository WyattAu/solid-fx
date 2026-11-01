import EvilEye from './EvilEye';

function EvilEyeDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 p-4 sm:grid-cols-2">
      <div class="h-80 overflow-hidden rounded-2xl border border-white/10">
        <EvilEye class="h-full w-full" />
      </div>
      <div class="h-80 overflow-hidden rounded-2xl border border-white/10">
        <EvilEye
          class="h-full w-full"
          eyeColor="#7dd3fc"
          backgroundColor="#0b1020"
          lightMode
          pupilFollow={1.4}
        />
      </div>
    </div>
  );
}

export default EvilEyeDemo;
