// Source: github.com/magicuidesign/magicui apps/www/registry/example/shine-border-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream demo wraps a shadcn Card/Input/Button; replaced with an equivalent
// self-contained login card so the demo has no component dependencies.
import ShineBorder from './ShineBorder'

function ShineBorderDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8 text-white">
      <div class="relative w-full max-w-[350px] overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-6">
        <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
        <div class="flex flex-col gap-1.5">
          <p class="text-lg font-semibold">Login</p>
          <p class="text-sm text-gray-400">Enter your credentials to access your account</p>
        </div>
        <div class="mt-6 grid gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="demo-email">
              Email
            </label>
            <input
              id="demo-email"
              type="email"
              placeholder="name@example.com"
              class="h-9 rounded-md border border-gray-700 bg-gray-950 px-3 text-sm placeholder:text-gray-500"
            />
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="demo-password">
              Password
            </label>
            <input
              id="demo-password"
              type="password"
              placeholder="••••••••"
              class="h-9 rounded-md border border-gray-700 bg-gray-950 px-3 text-sm placeholder:text-gray-500"
            />
          </div>
          <button
            type="button"
            class="mt-1 h-9 w-full cursor-pointer rounded-md bg-gray-100 text-sm font-medium text-gray-900"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShineBorderDemo
