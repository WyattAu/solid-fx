// Source: github.com/ibelick/motion-primitives components/core/toolbar-expandable.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: MotionConfig has no vanilla-motion equivalent; the shared spring
// transition is passed to each animate() call. AnimatePresence (mode='sync')
// is sequenced manually: the exit height animation runs, then the element
// unmounts on completion (PORTING.md §5). react-use-measure maps to a local
// ResizeObserver (border-box, matching useMeasure's default). The upstream
// `useClickOutside` hook is inlined (document mousedown + touchstart). ITEM
// `content` JSX is created per mount via functions — a Solid JSX node cannot
// be mounted twice. lucide-react icons are inlined as identical SVGs
// (ShiningButton precedent).

import { animate } from 'motion'
import type { AnimationPlaybackControlsWithThen, Transition } from 'motion'
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

const transition: Transition = {
  type: 'spring',
  bounce: 0.1,
  duration: 0.25,
}

// Inlined react-use-measure default (border box) via ResizeObserver.
function useMeasure(): {
  ref: (el: HTMLElement) => void
  size: Accessor<{ width: number; height: number }>
} {
  const [size, setSize] = createSignal({ width: 0, height: 0 })
  const measureRef = (el: HTMLElement) => {
    const update = (width: number, height: number) => {
      setSize(prev => (prev.width !== width || prev.height !== height ? { width, height } : prev))
    }
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      const box = entry && Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : undefined
      if (box) {
        update(box.inlineSize, box.blockSize)
      } else {
        update(el.offsetWidth, el.offsetHeight)
      }
    })
    observer.observe(el)
    update(el.offsetWidth, el.offsetHeight)
    onCleanup(() => observer.disconnect())
  }
  return { ref: measureRef, size }
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

function MessageCircleIcon(props: { class?: string }) {
  return (
    // Inline of lucide-react `MessageCircle` (24×24, stroke 2).
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
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

function FolderIcon(props: { class?: string }) {
  return (
    // Inline of lucide-react `Folder` (24×24, stroke 2).
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
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  )
}

function WalletCardsIcon(props: { class?: string }) {
  return (
    // Inline of lucide-react `WalletCards` (24×24, stroke 2).
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
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />
      <path d="M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21" />
    </svg>
  )
}

// Per-item opacity panel (upstream: inner motion.div with initial opacity 0,
// animated to 1/0 by selection; exit is covered by the wrapper unmount).
function ItemPanel(props: { children: JSX.Element; selected: boolean }) {
  let el: HTMLDivElement | undefined
  let controls: AnimationPlaybackControlsWithThen | undefined
  let started = false

  createEffect(() => {
    const node = el
    if (!node) {
      return
    }
    const target = props.selected ? 1 : 0
    if (!started) {
      started = true
      node.style.opacity = '0'
    }
    controls?.stop()
    controls = animate(node, { opacity: target }, transition)
  })

  onCleanup(() => controls?.stop())

  return <div ref={el}>{props.children}</div>
}

export default function ToolbarExpandable() {
  const [active, setActive] = createSignal<number | null>(null)
  const contentMeasure = useMeasure()
  const menuMeasure = useMeasure()
  const [isOpen, setIsOpen] = createSignal(false)
  const [maxWidth, setMaxWidth] = createSignal(0)

  // upstream module-level ITEMS uses React JSX nodes; defined per instance
  // here, with `content` as a factory so panels can remount (AnimatePresence
  // parity). See the PORT-NOTE above.
  const ITEMS: { id: number; label: string; title: JSX.Element; content: () => JSX.Element }[] = [
    {
      id: 1,
      label: 'User',
      title: <UserIcon class="h-5 w-5" />,
      content: () => (
        <div class="flex flex-col space-y-4">
          <div class="flex flex-col space-y-1 text-zinc-700">
            <div class="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-blue-400" />
            <span>Ibelick</span>
          </div>
          <button
            class="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-zinc-950/10 px-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98]"
            type="button"
          >
            Edit Profile
          </button>
        </div>
      ),
    },
    {
      id: 2,
      label: 'Messages',
      title: <MessageCircleIcon class="h-5 w-5" />,
      content: () => (
        <div class="flex flex-col space-y-4">
          <div class="text-zinc-700">You have 3 new messages.</div>
          <button
            class="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-zinc-950/10 px-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98]"
            type="button"
          >
            View more
          </button>
        </div>
      ),
    },
    {
      id: 3,
      label: 'Documents',
      title: <FolderIcon class="h-5 w-5" />,
      content: () => (
        <div class="flex flex-col space-y-4">
          <div class="flex flex-col text-zinc-700">
            <div class="space-y-1">
              <div>Project_Proposal.pdf</div>
              <div>Meeting_Notes.docx</div>
              <div>Financial_Report.xls</div>
            </div>
          </div>
          <button
            class="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-zinc-950/10 px-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98]"
            type="button"
          >
            Manage documents
          </button>
        </div>
      ),
    },
    {
      id: 4,
      label: 'Wallet',
      title: <WalletCardsIcon class="h-5 w-5" />,
      content: () => (
        <div class="flex flex-col space-y-4">
          <div class="flex flex-col text-zinc-700">
            <span>Current Balance</span>
            <span>$1,250.32</span>
          </div>
          <button
            class="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-zinc-950/10 px-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98]"
            type="button"
          >
            View Transactions
          </button>
        </div>
      ),
    },
  ]

  let containerEl: HTMLDivElement | undefined
  let contentEl: HTMLDivElement | undefined
  let heightControls: AnimationPlaybackControlsWithThen | undefined

  // Inlined upstream `useClickOutside` (mousedown + touchstart, React parity).
  createEffect(() => {
    const el = containerEl
    if (!el) {
      return
    }
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (el.contains(event.target as Node)) {
        return
      }
      setIsOpen(false)
      setActive(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    })
  })

  createEffect(() => {
    const width = menuMeasure.size().width
    if (!width || maxWidth() > 0) {
      return
    }
    setMaxWidth(width)
  })

  // AnimatePresence mode='sync' parity: keep the panel mounted while the exit
  // height animation plays, unmount on completion.
  const [present, setPresent] = createSignal(false)

  createEffect(() => {
    if (isOpen()) {
      if (!present()) setPresent(true)
    } else if (present()) {
      heightControls?.stop()
      if (contentEl) {
        heightControls = animate(contentEl, { height: 0 }, transition)
        void heightControls.then(() => {
          if (!isOpen()) setPresent(false)
        })
      } else {
        setPresent(false)
      }
    }
  })

  // Grow to the measured content height (also retargets when the selected
  // item's content height changes).
  createEffect(() => {
    const el = contentEl
    if (!el || !present() || !isOpen()) {
      return
    }
    const target = contentMeasure.size().height || 0
    heightControls?.stop()
    heightControls = animate(el, { height: target }, transition)
  })

  return (
    <div
      class="absolute bottom-8"
      ref={(node: HTMLDivElement) => {
        containerEl = node
      }}
    >
      <div class="h-full w-full rounded-xl border border-zinc-950/10 bg-white">
        <div class="overflow-hidden">
          <Show when={present()}>
            <div
              style={{ width: `${maxWidth()}px` }}
              ref={(node: HTMLDivElement) => {
                contentEl = node
                // upstream initial={{ height: 0 }}
                node.style.height = '0px'
                onCleanup(() => {
                  heightControls?.stop()
                  contentEl = undefined
                })
              }}
            >
              <div ref={contentMeasure.ref} class="p-2">
                <For each={ITEMS}>
                  {item => (
                    <ItemPanel selected={active() === item.id}>
                      <div class="px-2 pt-2 text-sm" classList={{ hidden: active() !== item.id }}>
                        {item.content()}
                      </div>
                    </ItemPanel>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
        <div class="flex space-x-2 p-2" ref={menuMeasure.ref}>
          <For each={ITEMS}>
            {item => (
              <button
                aria-label={item.label}
                class={`relative flex h-9 w-9 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98] ${
                  active() === item.id ? 'bg-zinc-100 text-zinc-800' : ''
                }`}
                type="button"
                onClick={() => {
                  if (!isOpen()) setIsOpen(true)
                  if (active() === item.id) {
                    setIsOpen(false)
                    setActive(null)
                    return
                  }
                  setActive(item.id)
                }}
              >
                {item.title}
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
