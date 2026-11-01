import Lightning from './Lightning';

const LightningDemo = () => (
  <div class="relative h-96 w-full overflow-hidden bg-black">
    <Lightning color="#4d6bff" intensity={1.1} speed={1} glow={1.1} flicker={0.6} bolts={1} />
  </div>
);

export default LightningDemo;
