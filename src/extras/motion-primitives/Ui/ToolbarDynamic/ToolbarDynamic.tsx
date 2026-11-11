// Source: github.com/ibelick/motion-primitives components/core/toolbar-dynamic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: MotionConfig has no vanilla-motion equivalent; the shared spring
// transition is passed to each animate() call. initial={false} (no enter
// animation) maps to applying the first width synchronously in a ref effect.
// The `useClickOutside` hook is inlined (document mousedown + touchstart,
// disposed in onCleanup). lucide-react icons are inlined as identical SVGs
// (ShiningButton precedent). React `autoFocus` maps to a ref-callback focus.

import { animate } from 'motion'
import type { AnimationPlaybackControls, Transition } from 'motion'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import type { JSX } from 'solid-js'

const transition: Transition = {
  type: 'spring',
  bounce: 0.1,
  duration: 0.2,
}

function UserIcon(props: { class?: string }) {
  return (
    // Inline of lucide-react `User` (24×24, stroke 2).
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function SearchIcon(props: { class?: string }) {
  return (
    // Inline of lucide-react `Search` (24×24, stroke 2).
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  )
}

function ArrowLeftIcon(props: { class?: string }) {
  return (
    // Inline of lucide-react `ArrowLeft` (24×24, stroke 2).
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function Button(props: {
  children: JSX.Element
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      class="relative flex h-9 w-9 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      type="button"
      onClick={() => props.onClick?.()}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
    >
      {props.children}
    </button>
  )
}

export default function ToolbarDynamic() {
  const [isOpen, setIsOpen] = createSignal(false)
  let containerEl: HTMLDivElement | undefined
  let widthEl: HTMLDivElement | undefined
  let controls: AnimationPlaybackControls | undefined
  let appliedWidth = false

  // Inlined upstream `useClickOutside` (mousedown + touchstart, React parity).
  onMount(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const el = containerEl
      if (!el || el.contains(event.target as Node)) {
        return
      }
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    })
  })

  createEffect(() => {
    const el = widthEl
    if (!el) {
      return
    }
    // @todo upstream: here I want to remove the width
    const width = isOpen() ? '300px' : '98px'
    if (!appliedWidth) {
      // initial={false} parity: no enter animation on mount.
      appliedWidth = true
      el.style.width = width
      return
    }
    controls?.stop()
    controls = animate(el, { width }, transition)
  })

  return (
    <div class="absolute bottom-8" ref={containerEl}>
      <div class="h-full w-full rounded-xl border border-zinc-950/10 bg-white">
        <div
          ref={(node: HTMLDivElement) => {
            widthEl = node
            onCleanup(() => {
              controls?.stop()
              widthEl = undefined
            })
          }}
        >
          <div class="overflow-hidden p-2">
            <Show
              when={!isOpen()}
              fallback={
                <div class="flex space-x-2">
                  <Button onClick={() => setIsOpen(false)} ariaLabel="Back">
                    <ArrowLeftIcon class="h-5 w-5" />
                  </Button>
                  <div class="relative w-full">
                    <input
                      class="h-9 w-full rounded-lg border border-zinc-950/10 bg-transparent p-2 text-zinc-900 placeholder-zinc-500 focus:outline-hidden"
                      placeholder="Search notes"
                      ref={(el: HTMLInputElement) => {
                        queueMicrotask(() => el.focus())
                      }}
                    />
                    <div class="absolute right-1 top-0 flex h-full items-center justify-center" />
                  </div>
                </div>
              }
            >
              <div class="flex space-x-2">
                <Button disabled ariaLabel="User profile">
                  <UserIcon class="h-5 w-5" />
                </Button>
                <Button onClick={() => setIsOpen(true)} ariaLabel="Search notes">
                  <SearchIcon class="h-5 w-5" />
                </Button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
