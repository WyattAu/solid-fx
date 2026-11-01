import LightPillar from './LightPillar';

const LightPillarDemo = () => (
  <div class="relative h-96 w-full overflow-hidden bg-black">
    <LightPillar
      topColor="#5227FF"
      bottomColor="#FF9FFC"
      intensity={1.2}
      rotationSpeed={0.3}
      pillarRotation={25}
      glowAmount={0.002}
    />
  </div>
);

export default LightPillarDemo;
