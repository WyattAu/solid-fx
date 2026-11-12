// Source: github.com/codse/animata animata/card/led-board.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream `animate-led` is a Tailwind theme token over
// --animate-led (styles/globals.css); the keyframes and class ship inline so
// the component is self-contained under this repo's Tailwind setup (same
// approach as the WaveReveal port). The forceUpdate re-render counter becomes
// a tick signal; the hover-gated interval lives in a createEffect with
// onCleanup. React's nested array map with null-filtering becomes nested <For>
// + <Show>. dotState replaces upstream's per-dot shouldAnimate/delay block.
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js'

function seededRandom(rowIndex: number, colIndex: number, salt: number) {
  const seed = rowIndex * 374761393 + colIndex * 668265263 + salt * 1442695041
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const charMap: Record<string, number[][]> = {
  C: [
    [0, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [0, 1, 1, 1],
  ],
  O: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  P: [
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
  ],
  Y: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  ' ': [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  0: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  1: [
    [0, 0, 1],
    [0, 1, 1],
    [1, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  3: [
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 1, 1, 0],
    [0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  2: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  4: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
  ],
  5: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  6: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  7: [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  8: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  9: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
  ],
}

function createMatrix(rows: number, cols: number) {
  return Array(rows)
    .fill('')
    .map(() => Array(cols).fill(false))
}

interface Board {
  rows: number
  cols: number
  matrix: boolean[][]
}

function createBoard(word: string) {
  const rows = 15
  const wordArray = word.trim().toUpperCase().split('')
  const cols =
    wordArray
      // +1 for extra padding
      .map(char => (charMap[char] || charMap[' '])[0].length + 1)
      .reduce((a, b) => a + b, 1) * 2

  const matrix = createMatrix(rows, cols)
  const startRow = 2
  let startCol = 2

  for (const charIndex in wordArray) {
    const char = wordArray[charIndex]
    const charPattern = charMap[char] || charMap[' ']

    for (const rowIndex in charPattern) {
      const row = charPattern[rowIndex]
      for (const colIndex in row) {
        const isLit = row[colIndex]
        if (isLit) {
          matrix[startRow + +rowIndex * 2][startCol + +colIndex * 2] = true
        }
      }
    }

    // +1 for extra spacing
    startCol += (charPattern[0].length + 1) * 2
  }

  return {
    rows,
    cols,
    matrix,
  }
}

const ledStyles = `
  /* PORT-NOTE: upstream --animate-led theme token + @keyframes led
     (styles/globals.css) */
  @keyframes led {
    0% {
      fill: currentColor;
      brightness: 1;
    }
    50% {
      fill: #a855f7;
      brightness: 500%;
    }
    100% {
      fill: currentColor;
      brightness: 1;
    }
  }
  .animate-led {
    animation: led 100ms ease-in-out;
  }
`

interface LEDBoardProps {
  /**
   * The word to display on the LED board.
   * Currently only supports "C", "O", "P" and "Y". But you can add more in the `charMap` object.
   */
  word: string
}

export default function LEDBoard(props: LEDBoardProps) {
  const word = () => props.word ?? 'COPY'
  const board = createMemo(() => createBoard(word()))

  const [isHovering, setIsHovering] = createSignal(false)
  const [tick, setTick] = createSignal(0)

  createEffect(() => {
    if (isHovering()) {
      return
    }

    const interval = setInterval(() => {
      // Force a re-render so the random dots are animated
      setTick(current => current + 1)
      // max animation duration is 3000ms (2000ms + 1000ms)
    }, 3000)

    onCleanup(() => clearInterval(interval))
  })

  // Reactive equivalent of upstream's per-dot shouldAnimate/delay block:
  // reads the hover + tick signals, so both stay tracked inside the JSX.
  const dotState = (rowIndex: number, colIndex: number, isLit: boolean) => {
    const shouldAnimate = !isHovering() && isLit && seededRandom(rowIndex, colIndex, tick()) > 0.8
    let delay = 0
    if (shouldAnimate) {
      delay = Math.floor(seededRandom(rowIndex, colIndex, tick() + 1) * 1000)
    }
    return { shouldAnimate, delay }
  }

  return (
    <div
      class="group/led rounded-xl border border-gray-600 bg-linear-to-bl from-zinc-950/80 via-zinc-900 via-30% to-zinc-950 to-75% p-4 dark:border-zinc-800"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <style>{ledStyles}</style>
      <svg class="h-auto w-full text-zinc-800" viewBox={`0 0 ${board().cols - 1} ${board().rows}`}>
        <For each={board().matrix}>
          {(row, rowIndex) => (
            <For each={row}>
              {(isLit, colIndex) => (
                // Hide all odd rows and columns
                <Show when={rowIndex() % 2 === 0 && colIndex() % 2 === 0}>
                  <circle
                    cx={colIndex() + 0.25}
                    cy={rowIndex() + 0.25}
                    r={0.25}
                    style={{
                      'transition-delay': !isHovering() ? `${colIndex() * 15}ms` : '0ms',
                      'animation-duration': '2000ms',
                      'animation-delay': `${dotState(rowIndex(), colIndex(), isLit).delay}ms`,
                    }}
                    class="fill-zinc-800 transition-colors duration-200 ease-in-out"
                    classList={{
                      'group-hover/led:fill-purple-500': isLit,
                      'animate-led ease-in-out': dotState(rowIndex(), colIndex(), isLit)
                        .shouldAnimate,
                    }}
                  />
                </Show>
              )}
            </For>
          )}
        </For>
      </svg>
    </div>
  )
}
