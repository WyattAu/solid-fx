import AcidSquares from './AcidSquares';

const AcidSquaresDemo = () => (
  <div class="h-96 w-full">
    <AcidSquares
      color="#120f17"
      accentColor="#ff4fb8"
      secondaryColor="#3b6bff"
      tileSize={1}
      gap={0.12}
      rotation={35}
    />
  </div>
);

export default AcidSquaresDemo;
