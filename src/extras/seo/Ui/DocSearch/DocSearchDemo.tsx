// solid-fx SEO widget — original component (not a port). Fetches the search corpus emitted by docs-compiler (search.json).
import DocSearch from './DocSearch'

function DocSearchDemo() {
  return (
    <div class="relative h-40 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <DocSearch indexUrl="/search.json" />
    </div>
  )
}

export default DocSearchDemo
