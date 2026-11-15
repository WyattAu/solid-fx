// solid-fx Data widget — original component (not a port).
import { normalSampler, mulberry32, exponentialSampler } from '@/lib/num'
import QQBadge from './QQBadge'

function QQBadgeDemo() {
  const gauss = normalSampler(mulberry32(0x51), 100, 15)
  const normalData = Array.from({ length: 400 }, gauss)
  const expo = exponentialSampler(mulberry32(0x52), 40)
  const heavyData = Array.from({ length: 400 }, expo)
  return (
    <div class="flex w-full flex-col items-start gap-5 p-6 text-sm text-gray-300">
      <span>
        request latency (well-behaved) <QQBadge data={normalData} />
      </span>
      <span>
        queue wait (heavy tail) <QQBadge data={heavyData} />
      </span>
      <span>
        tiny sample n=30 <QQBadge data={normalData.slice(0, 30)} />
      </span>
    </div>
  )
}

export default QQBadgeDemo
