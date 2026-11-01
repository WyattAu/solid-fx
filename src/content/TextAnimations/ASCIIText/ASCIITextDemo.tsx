import ASCIIText from './ASCIIText';

function ASCIITextDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-gray-950">
      <ASCIIText text="Solid Bits" asciiFontSize={8} interactive clickRipple />
    </div>
  );
}

export default ASCIITextDemo;
