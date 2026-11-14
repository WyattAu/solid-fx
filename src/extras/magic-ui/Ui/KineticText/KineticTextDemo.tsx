// Source: github.com/magicuidesign/magicui apps/www/registry/example/kinetic-text-demo.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream demo renders one large word on the docs page; staged here on a
// dark surface so the outlined letters stay legible without interaction.
import KineticText from './KineticText'

function KineticTextDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <KineticText text="solid-fx" class="text-8xl tracking-tight text-white" />
    </div>
  )
}

export default KineticTextDemo
