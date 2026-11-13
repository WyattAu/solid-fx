// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: Google DNS-over-HTTPS (dns.google/resolve, no key).
import { createEffect, createResource, createSignal, onCleanup, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import TypingAnimation from '@/extras/magic-ui/Ui/TypingAnimation/TypingAnimation'

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'SOA' | 'TXT'

export interface DnsRecordsProps {
  /** Initial domain; the user can search for others via the input. */
  domain: string
  /** Record types to query (default: all seven). */
  types?: DnsRecordType[]
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface DohAnswer {
  name?: string
  type?: number
  TTL?: number
  data?: string
}

interface DohResponse {
  Status?: number
  Answer?: DohAnswer[]
}

interface DnsRecord {
  type: DnsRecordType
  name: string
  ttl: number
  data: string
}

const TYPE_IDS: Record<number, DnsRecordType> = {
  1: 'A',
  5: 'CNAME',
  6: 'SOA',
  15: 'MX',
  16: 'TXT',
  2: 'NS',
  28: 'AAAA',
}

const ALL_TYPES: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'SOA', 'TXT']

// Row order for the table: address records first, then delegation, then metadata.
const TYPE_ORDER: Record<DnsRecordType, number> = {
  A: 0,
  AAAA: 1,
  CNAME: 2,
  MX: 3,
  NS: 4,
  TXT: 5,
  SOA: 6,
}

const DnsRecords = (props: DnsRecordsProps) => {
  const types = () => (props.types && props.types.length > 0 ? props.types : ALL_TYPES)
  const [draft, setDraft] = createSignal(props.domain ?? '')
  const [domain, setDomain] = createSignal(props.domain ?? '')

  let controller: AbortController | null = null

  const queryDomain = async (
    host: string,
    wanted: DnsRecordType[],
    signal: AbortSignal,
  ): Promise<DnsRecord[]> => {
    if (!host) return []
    const requests = wanted.map(async type => {
      const url = `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${type}`
      const response = await fetch(url, { signal })
      if (!response.ok) throw new Error(`DNS query failed (HTTP ${response.status})`)
      const data = (await response.json()) as DohResponse
      // Status 3 = NXDOMAIN; other non-zero codes still carry answers sometimes.
      if (data.Status === 3) throw new Error(`NXDOMAIN — ${host} does not exist`)
      return (data.Answer ?? []).map<DnsRecord>(answer => ({
        type: TYPE_IDS[answer.type ?? 0] ?? type,
        name: answer.name ?? host,
        ttl: answer.TTL ?? 0,
        data: answer.data ?? '',
      }))
    })
    const settled = await Promise.all(requests)
    return settled
      .flat()
      .sort(
        (a, b) =>
          TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
          a.name.localeCompare(b.name) ||
          a.data.localeCompare(b.data),
      )
  }

  const [records, { refetch }] = createResource(domain, host => {
    controller?.abort()
    controller = new AbortController()
    return queryDomain(host, types(), controller.signal)
  })

  onCleanup(() => controller?.abort())

  // Follow caller-side domain changes.
  createEffect(() => {
    if (props.domain !== undefined && props.domain !== domain()) {
      setDomain(props.domain)
      setDraft(props.domain)
    }
  })

  const submit = (e: Event) => {
    e.preventDefault()
    const host = draft()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
    setDraft(host)
    setDomain(host)
  }

  const error = () => (records.error instanceof Error ? records.error.message : undefined)

  return (
    <div
      class={`flex h-full w-full flex-col gap-3 ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    >
      <form class="flex items-center gap-2" onSubmit={submit}>
        <input
          type="text"
          value={draft()}
          placeholder="domain.tld"
          spellcheck={false}
          class="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm text-sky-200 outline-none placeholder:text-neutral-500 focus:border-sky-400/50"
          onInput={(e: Event) => setDraft((e.currentTarget as HTMLInputElement).value)}
        />
        <button
          type="submit"
          class="shrink-0 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-400/20"
        >
          Resolve
        </button>
      </form>

      <Show
        when={!records.error}
        fallback={
          <p class="my-auto self-center font-mono text-sm text-rose-400">
            {error() ?? 'Query failed'}
          </p>
        }
      >
        <Show
          when={!records.loading}
          fallback={
            <div class="my-auto self-center font-mono text-sm text-sky-300/80">
              <TypingAnimation as="span" typeSpeed={45}>
                {`resolving ${domain()} via dns.google…`}
              </TypingAnimation>
            </div>
          }
        >
          <Show
            when={(records.latest?.length ?? 0) > 0}
            fallback={
              <p class="my-auto self-center font-mono text-sm text-neutral-400">
                No {types().join('/')} records for {domain()}
              </p>
            }
          >
            <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-white/10">
              <table class="w-full border-collapse text-left font-mono text-xs">
                <thead class="sticky top-0 bg-black/60 text-neutral-400">
                  <tr>
                    <th class="px-3 py-2 font-medium tracking-widest uppercase">Type</th>
                    <th class="px-3 py-2 font-medium tracking-widest uppercase">Name</th>
                    <th class="px-3 py-2 font-medium tracking-widest uppercase">TTL</th>
                    <th class="px-3 py-2 font-medium tracking-widest uppercase">Data</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={records.latest}>
                    {record => (
                      <tr class="border-t border-white/5 transition-colors hover:bg-white/5">
                        <td class="px-3 py-1.5">
                          <span class="rounded bg-sky-400/10 px-1.5 py-0.5 font-semibold text-sky-300">
                            {record.type}
                          </span>
                        </td>
                        <td class="max-w-[10rem] truncate px-3 py-1.5 text-neutral-300">
                          {record.name}
                        </td>
                        <td class="px-3 py-1.5 text-neutral-500">{record.ttl}s</td>
                        <td class="break-all px-3 py-1.5 text-neutral-100">{record.data}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
            <p class="shrink-0 text-right text-[11px] text-neutral-500">
              {records.latest?.length} records · Google DNS-over-HTTPS
              <button
                type="button"
                class="ml-2 text-neutral-400 underline-offset-2 hover:text-sky-300 hover:underline"
                onClick={() => refetch()}
              >
                refresh
              </button>
            </p>
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default DnsRecords
