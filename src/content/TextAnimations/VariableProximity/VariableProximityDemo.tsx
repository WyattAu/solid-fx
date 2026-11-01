import VariableProximity from './VariableProximity';

function VariableProximityDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-gray-950 p-8 text-white">
      <div class="w-full max-w-3xl text-center">
        <VariableProximity
          label="Hover the letters"
          fromFontVariationSettings="'wght' 400, 'opsz' 9"
          toFontVariationSettings="'wght' 1000, 'opsz' 40"
          fromColor="#64748b"
          toColor="#34d399"
          radius={80}
          falloff="gaussian"
          idleWave
          fontSize="clamp(2rem, 6vw, 4rem)"
        />
      </div>
      <p class="text-xs text-gray-500">Pointer proximity drives the variable font axes; the idle wave keeps it alive.</p>
    </div>
  );
}

export default VariableProximityDemo;
