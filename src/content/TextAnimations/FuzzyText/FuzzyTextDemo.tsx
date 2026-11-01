import FuzzyText from './FuzzyText'

function FuzzyTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950">
      <FuzzyText
        fontSize="clamp(2rem, 8vw, 6rem)"
        color="#ffffff"
        trigger="always"
        baseIntensity={0.18}
        hoverIntensity={0.6}
      >
        Fuzzy
      </FuzzyText>
    </div>
  )
}

export default FuzzyTextDemo
