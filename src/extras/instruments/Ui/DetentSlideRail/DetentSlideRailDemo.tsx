// solid-fx Instruments widget — original component (not a port).
import DetentSlideRail from './DetentSlideRail'

function DetentSlideRailDemo() {
  return (
    <div class="flex w-full max-w-xl flex-col justify-center gap-6 p-6">
      <DetentSlideRail label="Deploy widget-frontend to production" />
      <DetentSlideRail label="Purge CDN cache" stages={['Acknowledge', 'Purge']} />
    </div>
  )
}

export default DetentSlideRailDemo
