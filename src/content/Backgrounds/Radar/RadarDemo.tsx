import Radar from './Radar'

export default function RadarDemo() {
  return (
    <div class="h-96 w-full">
      <Radar color="#3ef09a" mode="sweep" targets={6} clutter={0.35} />
    </div>
  )
}
