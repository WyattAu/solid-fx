// solid-fx SEO widget — original component (not a port). Fetches the search corpus emitted by docs-compiler (search.json).
import DocSearch from './DocSearch'

// The chrome emits island props verbatim from site.toml: `index`
// (search.json, base-path-prefixed), `wasm` (docs_search.wasm), `bin`
// (search.bin). Mapping them here keeps the component installable
// standalone (indexUrl defaults to /search.json).
function DocSearchDemo(props: { index?: string; wasm?: string; bin?: string }) {
  return (
    <div class="relative h-40 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <DocSearch indexUrl={props.index} wasmUrl={props.wasm} binUrl={props.bin} />
    </div>
  )
}

export default DocSearchDemo
