import MicroSlats from './MicroSlats';

function MicroSlatsDemo() {
  return (
    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <MicroSlats class="h-full w-full" />
      </div>
      <div class="h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <MicroSlats
          class="h-full w-full"
          preset="storm"
          color="#38bdf8"
          glintColor="#ffffff"
          backgroundColor="#020617"
          slatWidth={8}
          slatHeight={20}
          swirl={0.6}
        />
      </div>
    </div>
  );
}

export default MicroSlatsDemo;
