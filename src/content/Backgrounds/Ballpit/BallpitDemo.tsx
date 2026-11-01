import Ballpit from './Ballpit';

const BallpitDemo = () => (
  <div class="h-96 w-full">
    <Ballpit count={200} colors={['#ff4fb8', '#3b6bff', '#ffffff']} material="satin" gravity={0.5} />
  </div>
);

export default BallpitDemo;
