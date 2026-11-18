// URL-state codec round-trip + fallback format tests.
import { describe, expect, it } from 'vitest'
import { decodeState, encodeState } from '../src/lib/urlState'

describe('urlState', () => {
  it('round-trips a state object', async () => {
    const state = { ab: 0.31, ac: -0.2, bc: 0.77, nested: { k: [1, 2] } }
    const encoded = await encodeState(state)
    expect(encoded.startsWith('fx1')).toBe(true)
    const decoded = await decodeState<typeof state>(encoded)
    expect(decoded).toEqual(state)
  })

  it('encoded output carries the version prefix in every environment', async () => {
    const encoded = await encodeState({ ab: 0.31, ac: -0.2, bc: 0.77 })
    expect(encoded.startsWith('fx1')).toBe(true)
    expect(await decodeState(encoded)).toEqual({ ab: 0.31, ac: -0.2, bc: 0.77 })
  })

  it('accepts the plain-JSON fallback format', async () => {
    const state = { p: 0.42 }
    const fallback = `fx1j${encodeURIComponent(JSON.stringify(state))}`
    const decoded = await decodeState<typeof state>(fallback)
    expect(decoded).toEqual(state)
  })

  it('returns null for garbage input', async () => {
    expect(await decodeState('garbage')).toBeNull()
    expect(await decodeState('fx1d!!!not-base64!!!')).toBeNull()
    expect(await decodeState('')).toBeNull()
  })
})
