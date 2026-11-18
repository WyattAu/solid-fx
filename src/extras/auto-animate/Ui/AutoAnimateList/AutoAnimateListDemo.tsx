// solid-fx Data widget — original component (not a port).
import AutoAnimateList from './AutoAnimateList'

function AutoAnimateListDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <AutoAnimateList label="fleet members (duration 250ms)" />
      <AutoAnimateList
        label="slow glide (600ms ease-in-out)"
        duration={600}
        easing="ease-in-out"
        seed={0x42}
        items={['edge-fra', 'core-iad']}
      />
    </div>
  )
}

export default AutoAnimateListDemo
