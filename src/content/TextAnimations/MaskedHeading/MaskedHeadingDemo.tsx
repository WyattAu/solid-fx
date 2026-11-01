import MaskedHeading from './MaskedHeading';

function MaskedHeadingDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-6">
      <MaskedHeading
        text="Designed in the details"
        tag="h2"
        src="https://picsum.photos/seed/maskedheading/1200/500"
        fillScale={1.25}
        reveal="rise"
        trigger="mount"
        duration={1.1}
        className="text-white"
      />
    </div>
  );
}

export default MaskedHeadingDemo;
