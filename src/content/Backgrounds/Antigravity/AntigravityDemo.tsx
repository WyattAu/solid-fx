import Antigravity from './Antigravity';

const AntigravityDemo = () => (
  <div class="h-96 w-full">
    <Antigravity
      count={1500}
      magnetRadius={9}
      ringRadius={7}
      colors={['#5227FF', '#FF9FFC', '#B497CF']}
      colorMode="conic"
    />
  </div>
);

export default AntigravityDemo;
