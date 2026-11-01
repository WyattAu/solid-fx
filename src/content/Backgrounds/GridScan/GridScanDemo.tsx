import GridScan from './GridScan'

const GridScanDemo = () => (
  <div class="h-96 w-full">
    <GridScan cells={8} lineStyle="solid" scanDirection="forward" glow={0.6} />
  </div>
)

export default GridScanDemo
