import WebThreads from './WebThreads';

const WebThreadsDemo = () => (
  <div class="h-96 w-full">
    <WebThreads colors={['#5227FF', '#FF9FFC']} threadCount={6} frequency={5} glow={0.02} />
  </div>
);

export default WebThreadsDemo;
