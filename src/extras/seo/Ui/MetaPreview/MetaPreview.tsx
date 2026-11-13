// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props; favicon via Google S2, optional).
import { createMemo, Show } from 'solid-js'
import type { JSX } from 'solid-js'

export type MetaPreviewVariant = 'google' | 'og' | 'twitter' | 'all'

export interface MetaPreviewProps {
  title: string
  description: string
  url: string
  /** Preview image URL (OG / Twitter card). Falls back to a gradient placeholder. */
  image?: string
  /** Overrides the domain derived from `url` for the card byline. */
  siteName?: string
  /** Twitter/X @handle shown as the card author. */
  twitterHandle?: string
  /** Which previews to render. @default 'all' */
  variant?: MetaPreviewVariant
  class?: string
  /** Solid class alias, merged alongside `class`. */
  className?: string
}

interface ParsedUrl {
  domain: string
  path: string
  ok: boolean
}

function parseUrl(raw: string): ParsedUrl {
  const empty: ParsedUrl = { domain: raw, path: '', ok: false }
  if (!raw) return empty
  try {
    const u = new URL(raw)
    return {
      domain: u.hostname,
      path: u.pathname === '/' ? '' : decodeURIComponent(u.pathname),
      ok: true,
    }
  } catch {
    return empty
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

/** One Google-style search result listing (light stage, as the real SERP). */
function GooglePreview(props: { p: MetaPreviewProps; parsed: ParsedUrl; favicon: string }) {
  return (
    <div class="w-full max-w-2xl rounded-xl bg-white p-4 font-sans text-left shadow-sm">
      <div class="flex items-center gap-2">
        <span class="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
          <Show when={props.favicon} fallback={<span class="text-[10px] text-gray-400">G</span>}>
            <img src={props.favicon} alt="" class="size-4" loading="lazy" />
          </Show>
        </span>
        <div class="min-w-0 leading-tight">
          <div class="truncate text-sm text-gray-800">
            {props.p.siteName || props.parsed.domain}
          </div>
          <div class="truncate text-xs text-gray-600">
            {props.parsed.ok ? `https://${props.parsed.domain}${props.parsed.path}` : props.p.url}
          </div>
        </div>
      </div>
      <div class="mt-1.5 truncate text-xl leading-snug text-[#1a0dab] hover:underline">
        {props.p.title}
      </div>
      <p class="mt-1 text-sm leading-snug text-gray-600">{truncate(props.p.description, 160)}</p>
    </div>
  )
}

/** Gradient placeholder block used when no `image` prop is given. */
function ImageOrPlaceholder(props: { src?: string; alt: string; class: string }) {
  return (
    <Show
      when={props.src}
      fallback={
        <div
          class={`${props.class} flex items-center justify-center bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-amber-500/30`}
        >
          <span class="text-xs tracking-widest text-white/40 uppercase">no image</span>
        </div>
      }
    >
      <img src={props.src} alt={props.alt} class={props.class} loading="lazy" />
    </Show>
  )
}

/** Generic Open Graph link preview (dark stage). */
function OgPreview(props: { p: MetaPreviewProps; domain: string }) {
  return (
    <div class="w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-zinc-900 text-left">
      <ImageOrPlaceholder
        src={props.p.image}
        alt="Open Graph preview"
        class="aspect-[1.91/1] w-full object-cover"
      />
      <div class="space-y-1 p-4">
        <div class="text-xs tracking-wide text-zinc-500 uppercase">
          {props.p.siteName || props.domain}
        </div>
        <div class="truncate text-base font-semibold text-zinc-100">{props.p.title}</div>
        <div class="line-clamp-2 text-sm text-zinc-400">{props.p.description}</div>
      </div>
    </div>
  )
}

/** Twitter/X large-summary card (dark stage). */
function TwitterPreview(props: { p: MetaPreviewProps; domain: string }) {
  const handle = () => props.p.twitterHandle || `@${props.domain.split('.')[0]}`
  return (
    <div class="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-black text-left">
      <ImageOrPlaceholder
        src={props.p.image}
        alt="Twitter card preview"
        class="aspect-[2/1] w-full object-cover"
      />
      <div class="space-y-2 p-3">
        <div class="flex items-center gap-2">
          <span class="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-xs font-bold text-white">
            {handle().replace('@', '').charAt(0).toUpperCase()}
          </span>
          <div class="leading-tight">
            <div class="text-sm font-semibold text-zinc-100">{handle()}</div>
            <div class="text-xs text-zinc-500">{props.p.siteName || props.domain}</div>
          </div>
        </div>
        <div class="truncate text-base font-semibold text-zinc-100">{props.p.title}</div>
        <div class="line-clamp-2 text-sm text-zinc-400">{props.p.description}</div>
        <div class="flex items-center gap-4 pt-1 text-xs text-zinc-500">
          <span>Reply</span>
          <span>Repost</span>
          <span>Like</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Renders Google SERP, Open Graph and Twitter/X card previews for the same
 * page metadata so you can eyeball a URL's share appearance before shipping.
 * Fully computed from props — no fetching.
 */
export default function MetaPreview(props: MetaPreviewProps): JSX.Element {
  const variant = () => props.variant ?? 'all'
  const parsed = createMemo(() => parseUrl(props.url))
  const domain = () => parsed().domain || props.url
  const favicon = () =>
    parsed().ok ? `https://www.google.com/s2/favicons?domain=${domain()}&sz=32` : ''

  const merged = (extra: string) => `${extra} ${props.class ?? ''} ${props.className ?? ''}`.trim()

  const previews = (): JSX.Element => (
    <>
      <Show when={variant() === 'all' || variant() === 'google'}>
        <GooglePreview p={props} parsed={parsed()} favicon={favicon()} />
      </Show>
      <Show when={variant() === 'all' || variant() === 'og'}>
        <OgPreview p={props} domain={domain()} />
      </Show>
      <Show when={variant() === 'all' || variant() === 'twitter'}>
        <TwitterPreview p={props} domain={domain()} />
      </Show>
    </>
  )

  return (
    <Show
      when={variant() !== 'google'}
      fallback={<div class={merged('flex w-full justify-center')}>{previews()}</div>}
    >
      <div
        class={merged('flex w-full flex-col items-center gap-6')}
        role="group"
        aria-label="Search and social card previews"
      >
        {previews()}
      </div>
    </Show>
  )
}
