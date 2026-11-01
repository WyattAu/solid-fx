import ShapeGrid from './ShapeGrid'

const ShapeGridDemo = () => (
  <div class="h-96 w-full">
    <ShapeGrid
      shape="square"
      cellSize={40}
      direction="diagonal"
      speed={0.5}
      lineColor="#2a2734"
      hoverColor="#ffffff"
      glow={0.35}
    />
  </div>
)

export default ShapeGridDemo
