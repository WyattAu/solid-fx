// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import FaqSchemaGen from './FaqSchemaGen'

function FaqSchemaGenDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 70% 15%, rgba(16,185,129,0.12), transparent 55%), radial-gradient(circle at 30% 85%, rgba(139,92,246,0.1), transparent 50%)',
        }}
      />
      <FaqSchemaGen publisher="Estate Docs" class="h-full" />
    </div>
  )
}

export default FaqSchemaGenDemo
