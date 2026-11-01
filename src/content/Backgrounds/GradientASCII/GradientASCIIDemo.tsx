import GradientASCII from './GradientASCII';

const GradientASCIIDemo = () => (
  <div class="h-96 w-full">
    <GradientASCII colors={['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']} shape="horizon" cellSize={18} glow={0.2} />
  </div>
);

export default GradientASCIIDemo;
