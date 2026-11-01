import ShapeWaves from './ShapeWaves';

const ShapeWavesDemo = () => (
  <div class="h-96 w-full">
    <ShapeWaves
      shapes="mixed"
      cellSize={10}
      color="#929292"
      hoverColor="#ffffff"
      backgroundColor="#000000"
      glow={0.35}
    />
  </div>
);

export default ShapeWavesDemo;
