import SplitFlapText from './SplitFlapText'

function SplitFlapTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-6">
      <SplitFlapText
        words={['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE']}
        fontSize={44}
        tileColor="#111827"
        textColor="#f8fafc"
        depth={0.5}
        glare={0.25}
      />
    </div>
  )
}

export default SplitFlapTextDemo
