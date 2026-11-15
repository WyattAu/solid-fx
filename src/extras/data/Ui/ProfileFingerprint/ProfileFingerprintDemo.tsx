// solid-fx Data widget — original component (not a port).
import { normalSampler, mulberry32 } from '@/lib/num'
import { For, createSignal } from 'solid-js'
import ProfileFingerprint from './ProfileFingerprint'

interface Row {
  name: string
  vector: number[]
}

function makeRows(): Row[] {
  const rows: Row[] = []
  for (let r = 0; r < 24; r++) {
    const base = normalSampler(mulberry32(0x900 + r), 0.5, 0.18)
    const vector = Array.from({ length: 12 }, base)
    rows.push({ name: `tenant-${String(r).padStart(2, '0')}`, vector })
  }
  // plant one anomalous row: every dimension shifted high
  rows[7] = { name: 'tenant-07', vector: rows[7].vector.map(v => v + 0.9) }
  return rows
}

function ProfileFingerprintDemo() {
  const [rows] = createSignal(makeRows())
  return (
    <div class="w-full p-6">
      <div class="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 text-sm">
        <div class="grid grid-cols-[7rem_2rem_1fr] gap-2 border-b border-gray-800 px-3 py-1.5 text-[10px] tracking-wide text-gray-500 uppercase">
          <span>row</span>
          <span>profile</span>
          <span>score</span>
        </div>
        <For each={rows()}>
          {(row, i) => (
            <div class="grid grid-cols-[7rem_2rem_1fr] items-center gap-2 px-3 py-0.5 odd:bg-gray-800/40">
              <span class="font-mono text-xs text-gray-400">{row.name}</span>
              <ProfileFingerprint vector={row.vector} title={`${row.name} profile`} />
              <div class="h-1.5 w-full max-w-40 rounded-full bg-gray-800">
                <div
                  class={`h-1.5 rounded-full ${i() === 7 ? 'bg-rose-400' : 'bg-sky-500/70'}`}
                  style={{
                    width: `${Math.round((row.vector.reduce((a, b) => a + b, 0) / row.vector.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </For>
      </div>
      <p class="mt-2 text-xs text-gray-500">
        tenant-07 is the planted anomaly — its tick barcode breaks alignment.
      </p>
    </div>
  )
}

export default ProfileFingerprintDemo
