import FallingText from './FallingText';

function FallingTextDemo() {
  return (
    <div class="h-96 w-full bg-gray-950 text-white">
      <FallingText
        text="Gravity pulls every word down into a pile you can drag around and shove."
        highlightWords={['Gravity', 'drag']}
        trigger="auto"
        highlightClass="font-semibold"
      />
    </div>
  );
}

export default FallingTextDemo;
