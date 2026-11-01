import ScrollReveal from './ScrollReveal';

function ScrollRevealDemo() {
  return (
    <div class="flex h-96 w-full items-center bg-gray-950">
      <ScrollReveal
        mode="enter"
        effect="rise"
        splitBy="chars"
        baseRotation={2}
        baseOpacity={0.15}
        highlightColor="#a78bfa"
        containerClassName="max-w-3xl"
        textClassName="text-white"
      >
        Solid pieces rise letter by letter as this heading enters the viewport.
      </ScrollReveal>
    </div>
  );
}

export default ScrollRevealDemo;
