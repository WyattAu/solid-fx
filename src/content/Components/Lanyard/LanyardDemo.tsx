import Lanyard from './Lanyard';

function LanyardDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950">
      <Lanyard
        frontImage="https://picsum.photos/seed/lanyard-front/512/720"
        backImage="https://picsum.photos/seed/lanyard-back/512/720"
        finish="holographic"
        gravity={0.6}
      />
    </div>
  );
}

export default LanyardDemo;
