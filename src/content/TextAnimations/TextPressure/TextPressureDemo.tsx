import TextPressure from './TextPressure';

function TextPressureDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-gray-950 p-8">
      <div class="h-40 w-full max-w-2xl text-white">
        <TextPressure text="Compressa" idle="wave" textColor="#ffffff" />
      </div>
      <p class="text-xs text-gray-400">Letters compress toward the pointer; the idle wave keeps them breathing.</p>
    </div>
  );
}

export default TextPressureDemo;
