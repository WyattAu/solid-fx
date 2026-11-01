import TechText from './TechText';

function TechTextDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950 text-white">
      <TechText text="Solid Bits" intro="assemble" fontSize={120} accentColor="#a78bfa" />
    </div>
  );
}

export default TechTextDemo;
