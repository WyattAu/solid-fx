import PeekRating from './PeekRating'

function PeekRatingDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-10 bg-zinc-950 p-8 text-white">
      <PeekRating defaultValue={3} labels={['Meh', 'Okay', 'Good', 'Great', 'Amazing']} />
      <PeekRating shape="heart" count={4} defaultValue={2} activeColor="#f43f5e" size={24} />
    </div>
  )
}

export default PeekRatingDemo
