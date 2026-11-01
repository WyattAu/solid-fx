import ReflectiveCard from './ReflectiveCard'

function ReflectiveCardDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-900">
      <ReflectiveCard
        name="Alexander Doe"
        badge="Verified"
        status="Active"
        idLabel="ID number"
        idValue="8901 2345 6789"
      />
    </div>
  )
}

export default ReflectiveCardDemo
