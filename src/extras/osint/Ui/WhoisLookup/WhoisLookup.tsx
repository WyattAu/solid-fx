// solid-fx OSINT widget — original component (not a port). Free OSINT APIs: RDAP (rdap.org/domain, IETF registration data access protocol, no key).
import { createEffect, createResource, createSignal, onCleanup, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import TypingAnimation from '@/extras/magic-ui/Ui/TypingAnimation/TypingAnimation'

export interface WhoisLookupProps {
  /** Initial domain (must have an RDAP service, e.g. .com/.net/.io). */
  domain: string
  /** Look up on mount (default true). */
  auto?: boolean
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface RdapEvent {
  eventAction?: string
  eventDate?: string
}

interface RdapVcardArray {
  // ['vcard', [ [name, params, type, value], ... ]]
  1?: Array<[string, Record<string, never> | undefined, string, unknown]>
}

interface RdapEntity {
  roles?: string[]
  vcardArray?: RdapVcardArray
}

interface RdapNameserver {
  ldhName?: string
}

interface RdapDomainResponse {
  ldhName?: string
  status?: string[]
  events?: RdapEvent[]
  entities?: RdapEntity[]
  nameservers?: RdapNameserver[]
  secureDNS?: { delegationSigned?: boolean }
}

interface WhoisRow {
  label: string
  value: string
}

const registrarName = (entities: RdapEntity[] | undefined): string => {
  const registrar = entities?.find(entity => entity.roles?.includes('registrar'))
  const fields = registrar?.vcardArray?.[1]
  const fn = fields?.find(field => field[0] === 'fn')
  const name = fn?.[3]
  return typeof name === 'string' && name ? name : '—'
}

const formatDate = (iso: string | undefined): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toISOString().slice(0, 10)
}

const WhoisLookup = (props: WhoisLookupProps) => {
  const [draft, setDraft] = createSignal(props.domain ?? '')
  const [domain, setDomain] = createSignal(props.domain ?? '')

  let controller: AbortController | null = null

  const lookup = async (host: string, signal: AbortSignal): Promise<RdapDomainResponse> => {
    if (!host) throw new Error('Enter a domain to look up')
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(host)}`, { signal })
    if (response.status === 404) throw new Error(`No RDAP record for ${host}`)
    if (response.status === 429) throw new Error('RDAP rate-limited — retry in a moment')
    if (!response.ok) throw new Error(`RDAP query failed (HTTP ${response.status})`)
    return (await response.json()) as RdapDomainResponse
  }

  const [data] = createResource(domain, host => {
    controller?.abort()
    controller = new AbortController()
    return lookup(host, controller.signal)
  })

  onCleanup(() => controller?.abort())

  createEffect(() => {
    if (props.domain !== undefined && props.domain !== domain()) {
      setDomain(props.domain)
      setDraft(props.domain)
    }
  })

  const rows = (): WhoisRow[] => {
    const d = data.latest
    if (!d) return []
    const event = (action: string) => d.events?.find(e => e.eventAction === action)?.eventDate
    const nameservers = (d.nameservers ?? [])
      .map(ns => ns.ldhName ?? '')
      .filter(Boolean)
      .join(', ')
    return [
      { label: 'Registrar', value: registrarName(d.entities) },
      { label: 'Created', value: formatDate(event('registration')) },
      { label: 'Expires', value: formatDate(event('expiration')) },
      { label: 'Updated', value: formatDate(event('last changed')) },
      { label: 'Nameservers', value: nameservers || '—' },
      { label: 'Status', value: (d.status ?? []).join(', ') || '—' },
      { label: 'DNSSEC', value: d.secureDNS?.delegationSigned ? 'signed' : 'unsigned' },
    ]
  }

  const submit = (e: Event) => {
    e.preventDefault()
    const host = draft()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
    setDraft(host)
    setDomain(host)
  }

  return (
    <div
      class={`flex h-full w-full flex-col gap-3 text-left ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    >
      <form class="flex items-center gap-2" onSubmit={submit}>
        <input
          type="text"
          value={draft()}
          placeholder="domain.tld"
          spellcheck={false}
          class="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm text-amber-200 outline-none placeholder:text-neutral-500 focus:border-amber-400/50"
          onInput={(e: Event) => setDraft((e.currentTarget as HTMLInputElement).value)}
        />
        <button
          type="submit"
          class="shrink-0 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-400/20"
        >
          Whois
        </button>
      </form>

      <Show
        when={!data.error}
        fallback={
          <p class="my-auto self-center font-mono text-sm text-rose-400">
            {data.error instanceof Error ? data.error.message : 'RDAP query failed'}
          </p>
        }
      >
        <Show
          when={!data.loading}
          fallback={
            <div class="my-auto self-center font-mono text-sm text-amber-300/80">
              <TypingAnimation as="span" typeSpeed={45}>
                {`querying rdap.org for ${domain()}…`}
              </TypingAnimation>
            </div>
          }
        >
          <dl class="flex flex-1 flex-col justify-center gap-2 overflow-auto">
            <For each={rows()}>
              {row => (
                <div class="flex items-baseline justify-between gap-4 border-b border-white/5 pb-1.5">
                  <dt class="shrink-0 text-xs tracking-widest text-neutral-400 uppercase">
                    {row.label}
                  </dt>
                  <dd class="max-w-[70%] text-right font-mono text-sm break-words text-neutral-100">
                    {row.value}
                  </dd>
                </div>
              )}
            </For>
          </dl>
          <p class="shrink-0 text-[11px] text-neutral-500">via RDAP (rdap.org)</p>
        </Show>
      </Show>
    </div>
  )
}

export default WhoisLookup
