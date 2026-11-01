import TrueFocus from './TrueFocus';

function TrueFocusDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8 text-white">
      <TrueFocus
        sentence="True Focus Effect"
        borderColor="#34d399"
        glowColor="rgba(52, 211, 153, 0.45)"
        blurAmount={4}
      />
    </div>
  );
}

export default TrueFocusDemo;
