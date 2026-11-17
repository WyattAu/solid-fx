// solid-fx Instruments widget — original component (not a port).
import LogitSliders from './LogitSliders'

function LogitSlidersDemo() {
  return (
    <div class="flex w-full flex-col gap-6 p-6">
      <LogitSliders label="spam classifier threshold" value={0.95} />
      <LogitSliders
        label="medical screening (evidence matters at 4 nines)"
        value={0.999}
        logitMax={8}
      />
    </div>
  )
}

export default LogitSlidersDemo
