import SlingButton from './SlingButton'

function SlingButtonDemo() {
  return (
    <div class="flex h-72 items-center justify-center p-8">
      <SlingButton onSend={() => console.log('sling!')}>Send it</SlingButton>
    </div>
  )
}

export default SlingButtonDemo
