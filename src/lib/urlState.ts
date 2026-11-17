// solid-fx URL-state codec — original code. Shareable instrument state with
// zero backend: JSON → deflate-raw (native CompressionStream) → base64url,
// or a plain JSON fallback when CompressionStream is unavailable. The
// 'v' prefix version-gates the format (research 03 #96 / 01 #49).
const VERSION = 'fx1'

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw')
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(cs)
  const buf = await new Response(stream).arrayBuffer()
  return new Uint8Array(buf)
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds)
  const buf = await new Response(stream).arrayBuffer()
  return new Uint8Array(buf)
}

/** Encode a state object to a compact URL-hash string (deflate when available). */
export async function encodeState(state: unknown): Promise<string> {
  const json = JSON.stringify(state)
  if (typeof CompressionStream !== 'undefined' && typeof ReadableStream !== 'undefined') {
    try {
      const bytes = new TextEncoder().encode(json)
      const packed = await deflate(bytes)
      return `${VERSION}d${toBase64Url(packed)}`
    } catch {
      // streaming pipeline unavailable — fall through to the JSON format
    }
  }
  return `${VERSION}j${encodeURIComponent(json)}`
}

/** Decode a string produced by encodeState (both formats accepted). */
export async function decodeState<T>(s: string): Promise<T | null> {
  if (!s.startsWith(VERSION)) return null
  const body = s.slice(VERSION.length)
  try {
    if (body.startsWith('j')) return JSON.parse(decodeURIComponent(body.slice(1))) as T
    if (body.startsWith('d')) {
      const bytes = await inflate(fromBase64Url(body.slice(1)))
      return JSON.parse(new TextDecoder().decode(bytes)) as T
    }
    return null
  } catch {
    return null
  }
}

/**
 * Copy a shareable URL (current location + encoded state in the hash) to the
 * clipboard. Returns the URL string for UI feedback.
 */
export async function copyStateUrl(state: unknown): Promise<string> {
  const encoded = await encodeState(state)
  const url = `${location.origin}${location.pathname}#${encoded}`
  await navigator.clipboard.writeText(url)
  return url
}

/** Read state from the current location hash, if any. */
export async function readStateFromHash<T>(): Promise<T | null> {
  const hash = decodeURIComponent(location.hash.slice(1))
  if (!hash) return null
  return decodeState<T>(hash)
}
