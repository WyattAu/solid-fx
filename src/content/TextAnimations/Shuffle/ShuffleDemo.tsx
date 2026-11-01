import Shuffle from './Shuffle';

function ShuffleDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950">
      <Shuffle
        text="Shuffle Text"
        tag="h2"
        className="text-2xl"
        shuffleTimes={2}
        effect="slide"
        color="#ffffff"
        accentColor="#a78bfa"
      />
    </div>
  );
}

export default ShuffleDemo;
