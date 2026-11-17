// solid-fx Data widget — original component (not a port).
import BitsetFacets from './BitsetFacets'

function BitsetFacetsDemo() {
  return (
    <div class="flex w-full justify-center p-6">
      <BitsetFacets label="tenant cohort" rows={100_000} seed={1} />
    </div>
  )
}

export default BitsetFacetsDemo
