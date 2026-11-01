import GridDistortion from './GridDistortion';

const GridDistortionDemo = () => (
  <div class="h-96 w-full">
    <GridDistortion imageSrc="https://picsum.photos/seed/grid-distortion/1024/640" grid={18} strength={0.2} />
  </div>
);

export default GridDistortionDemo;
