import LetterGlitch from './LetterGlitch';

const LetterGlitchDemo = () => (
  <div class="h-96 w-full">
    <LetterGlitch
      glitchColors={['#ffffff', '#61dca3', '#5227FF']}
      baseOpacity={0.2}
      glitchAmount={0.65}
      speed={1}
    />
  </div>
);

export default LetterGlitchDemo;
