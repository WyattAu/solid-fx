import GradientText from './GradientText';

function GradientTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950">
      <GradientText
        colors={['#5227FF', '#FF9FFC', '#B497CF']}
        animationSpeed={8}
        showBorder={true}
        className="text-4xl font-bold text-white"
      >
        Gradient Text
      </GradientText>
    </div>
  );
}

export default GradientTextDemo;
