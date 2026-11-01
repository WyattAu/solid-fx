import TextCursor from './TextCursor';

function TextCursorDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden bg-gray-950">
      <TextCursor text="✦" mode="stamp" spacing={72} maxPoints={9} fontSize={30} color="#a78bfa" />
      <p class="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-white/40">
        Move the pointer around to stamp glyphs along its path.
      </p>
    </div>
  );
}

export default TextCursorDemo;
