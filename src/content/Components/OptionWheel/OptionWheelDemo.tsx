import OptionWheel from './OptionWheel';

function OptionWheelDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950">
      <div class="h-64 w-72">
        <OptionWheel defaultSelected={3} onChange={index => console.log('selected', index)} />
      </div>
    </div>
  );
}

export default OptionWheelDemo;
