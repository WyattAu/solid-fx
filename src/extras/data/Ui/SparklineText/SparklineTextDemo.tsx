// solid-fx Data widget — original component (not a port).
import SparklineText from './SparklineText'

function SparklineTextDemo() {
  return (
    <div class="w-full space-y-3 p-6 text-sm leading-7 text-gray-300">
      <p>
        p99 latency{' '}
        <SparklineText
          data={[42, 45, 44, 61, 58, 63, 92, 74, 51, 48, 46, 44]}
          color="#7dd3fc"
          title="p99 latency"
        />{' '}
        stayed flat until the 15:02 deploy, then settled.
      </p>
      <p>
        orders/min{' '}
        <SparklineText
          type="bar"
          data={[8, 12, 9, 15, 22, 19, 24, 31, 28, 33]}
          color="#34d399"
          title="orders per minute"
        />{' '}
        with the afternoon ramp visible inline.
      </p>
      <p>
        error budget{' '}
        <SparklineText
          type="area"
          data={[100, 92, 88, 80, 71, 66, 58, 55, 49, 47]}
          color="#fbbf24"
          title="remaining error budget"
        />{' '}
        burn during the incident window.
      </p>
    </div>
  )
}

export default SparklineTextDemo
