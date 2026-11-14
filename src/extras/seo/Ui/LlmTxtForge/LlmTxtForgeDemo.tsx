// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import LlmTxtForge from './LlmTxtForge'

function LlmTxtForgeDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950 p-5">
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(16,185,129,0.12), transparent 55%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.1), transparent 50%)',
        }}
      />
      <LlmTxtForge siteTitle="Estate Docs" author="Wyatt" class="h-full" />
    </div>
  )
}

export default LlmTxtForgeDemo
