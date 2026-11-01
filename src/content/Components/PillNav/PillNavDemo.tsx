import PillNav from './PillNav'

function PillNavDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950 p-6">
      <PillNav
        logo="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f4f4f5'%3E%3Cpath d='M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z'/%3E%3C/svg%3E"
        logoAlt="Demo"
        defaultActiveIndex={0}
        theme="dark"
      />
    </div>
  )
}

export default PillNavDemo
