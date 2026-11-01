import LightTunnel from './LightTunnel';

const LightTunnelDemo = () => (
  <div class="relative h-96 w-full overflow-hidden bg-black">
    <LightTunnel
      cableColor="#ffffff"
      pulseColor="#61dca3"
      tunnelOpacity={0.25}
      speed={0.15}
      pulseSpeed={2.2}
      cableCount={64}
      brightness={1.1}
    />
  </div>
);

export default LightTunnelDemo;
