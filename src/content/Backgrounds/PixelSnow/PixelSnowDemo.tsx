import PixelSnow from './PixelSnow'

export default function PixelSnowDemo() {
  return (
    <div class="h-96 w-full">
      <PixelSnow variant="snowflake" color="#ffffff" density={0.6} sway={0.6} twinkle={0.4} />
    </div>
  )
}
