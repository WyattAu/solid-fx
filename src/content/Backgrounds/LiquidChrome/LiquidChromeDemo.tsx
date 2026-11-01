import LiquidChrome from './LiquidChrome';

const LiquidChromeDemo = () => (
  <div class="relative h-96 w-full overflow-hidden bg-black">
    <LiquidChrome
      color="#c8c8c8"
      speed={0.25}
      amplitude={0.35}
      frequencyX={3}
      frequencyY={3}
      roughness={0.3}
    />
  </div>
);

export default LiquidChromeDemo;
