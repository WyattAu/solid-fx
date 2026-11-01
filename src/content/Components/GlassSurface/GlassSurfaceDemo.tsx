import GlassSurface from './GlassSurface';

function GlassSurfaceDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-6">
      <div
        class="flex h-full w-full items-center justify-center rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e3a8a 35%, #7c3aed 70%, #db2777 100%)'
        }}
      >
        <GlassSurface width={280} height={140} borderRadius={24}>
          <p class="text-lg font-medium text-white">Refraction demo</p>
        </GlassSurface>
      </div>
    </div>
  );
}

export default GlassSurfaceDemo;
