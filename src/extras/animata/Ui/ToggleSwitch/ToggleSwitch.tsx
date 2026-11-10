// Source: github.com/codse/animata animata/button/toggle-switch.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: React useId → createUniqueId; htmlFor → the Solid `for` attribute.
// `bg-muted`/`bg-foreground` are shadcn theme tokens absent from this repo's
// Tailwind setup — mapped to the shadcn default palette they resolve to
// (muted ≈ neutral-100, foreground ≈ neutral-950). Upstream's track ternary is
// the same class in both branches; kept verbatim for fidelity.
import { createSignal, createUniqueId } from 'solid-js'

interface ToggleSwitchProps {
  onChange?: (value: boolean) => void
  defaultChecked?: boolean
}

export default function ToggleSwitch(props: ToggleSwitchProps) {
  const id = createUniqueId()
  const [isChecked, setIsChecked] = createSignal(props.defaultChecked ?? false)

  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked()
    setIsChecked(newCheckedState)
    props.onChange?.(newCheckedState)
  }

  return (
    <label for={id} class="flex cursor-pointer select-none items-center">
      <div class="relative">
        <input
          id={id}
          type="checkbox"
          checked={isChecked()}
          onChange={handleCheckboxChange}
          aria-label="Toggle switch"
          class="sr-only"
        />
        <div
          class={`box block h-8 w-14 rounded-full ${isChecked() ? 'bg-neutral-100' : 'bg-neutral-100'}`}
        />
        <div
          class={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full transition-all ${
            isChecked() ? 'translate-x-full bg-neutral-950/75' : 'bg-neutral-950/50'
          }`}
        />
      </div>
    </label>
  )
}
