import CRTWarp from './CRTWarp';

const CRTWarpDemo = () => (
  <div class="h-96 w-full">
    <CRTWarp
      color="#c755f7"
      backgroundColor="#120f17"
      speed={0.5}
      columns={80}
      mask="aperture"
      bloom={1.5}
      vignette={0.3}
    />
  </div>
);

export default CRTWarpDemo;
