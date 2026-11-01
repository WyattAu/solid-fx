import Grainient from './Grainient';

const GrainientDemo = () => (
  <div class="h-96 w-full">
    <Grainient colors={['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa']} type="linear" angle={55} flow={0.8} />
  </div>
);

export default GrainientDemo;
