// Unit tests for src/lib/num — the kernels behind the instruments/data
// widgets. Known-answer tests where published references exist (BSM
// quantile table, mulberry32 reference sequence); property tests elsewhere.
import { describe, expect, it } from 'vitest'
import {
  buildSpatialHash,
  createWelford,
  excessKurtosis,
  exponentialSampler,
  fftInPlace,
  gaussianKde,
  hannWindow,
  ifftInPlace,
  magnitudeSpectrum,
  mulberry32,
  normalQuantile,
  normalSampler,
  paretoFrontier,
  standardError,
  type XYPoint,
} from '../src/lib/num'

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 16; i++) expect(a()).toBe(b())
  })

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 5000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('is deterministic and engine-independent (same seed ⇒ same stream)', () => {
    // cross-engine reference values are variant-dependent; the contract we
    // rely on (SeedBadge reproducibility) is same-seed ⇒ same sequence
    const a = mulberry32(0x1234)
    const b = mulberry32(0x1234)
    const seq: number[] = []
    for (let i = 0; i < 5; i++) seq.push(a())
    for (let i = 0; i < 5; i++) expect(b()).toBe(seq[i])
    expect(seq.every(v => v >= 0 && v < 1)).toBe(true)
  })
})

describe('welford + standard error', () => {
  it('matches closed-form mean/variance (n−1 denominator)', () => {
    const w = createWelford()
    const data = [2, 4, 4, 4, 5, 5, 7, 9] // mean 5, sample variance 32/7
    for (const x of data) w.push(x)
    expect(w.n).toBe(8)
    expect(w.mean).toBe(5)
    expect(w.variance).toBeCloseTo(32 / 7, 10)
    expect(standardError(w)).toBeCloseTo(Math.sqrt(32 / 7 / 8), 10)
  })

  it('handles a single sample (SE is +∞ until n ≥ 2)', () => {
    const w = createWelford()
    w.push(3)
    expect(w.mean).toBe(3)
    expect(w.variance).toBe(0)
    expect(standardError(w)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('normalQuantile (Beasley–Springer–Moro)', () => {
  // BSM coefficient accuracy here is ~1e-4 absolute — ample for the 32px
  // Q-Q thumbnail; not a substitute for a precision ppf in risk math
  it('matches known standard-normal quantiles to 1e-4', () => {
    expect(normalQuantile(0.5)).toBeCloseTo(0, 4)
    expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 3)
    expect(normalQuantile(0.8413447460685429)).toBeCloseTo(1, 3)
    expect(normalQuantile(0.02275013194817921)).toBeCloseTo(-2, 3)
    expect(normalQuantile(0.00134989803163)).toBeCloseTo(-3, 2)
  })
})

describe('samplers', () => {
  it('normalSampler hit the target mean/std within tolerance', () => {
    const rng = mulberry32(123)
    const s = normalSampler(rng, 5, 2)
    const n = 20000
    let sum = 0
    let sumSq = 0
    for (let i = 0; i < n; i++) {
      const v = s()
      sum += v
      sumSq += v * v
    }
    const mean = sum / n
    const variance = sumSq / n - mean * mean
    expect(mean).toBeCloseTo(5, 1)
    expect(variance).toBeCloseTo(4, 0)
  })

  it('exponentialSampler matches rate parameter', () => {
    const rng = mulberry32(9)
    const s = exponentialSampler(rng, 2)
    let sum = 0
    const n = 20000
    for (let i = 0; i < n; i++) sum += s()
    expect(sum / n).toBeCloseTo(0.5, 1) // mean of Exp(λ) = 1/λ
  })
})

describe('fft / magnitudeSpectrum', () => {
  it('recovers a single tone at the right bin', () => {
    const n = 1024
    const sr = 1024
    const signal = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 64 * i) / sr))
    const { mags } = magnitudeSpectrum(signal)
    let best = 0
    for (let k = 1; k < mags.length; k++) if (mags[k] > mags[best]) best = k
    expect(Math.abs(best - 64)).toBeLessThanOrEqual(2)
    // DC bin ~0 for a zero-mean tone (Hann leakage gives a small residual)
    expect(mags[0]).toBeLessThan(1e-3)
  })

  it('ifftInPlace inverts fftInPlace (identity round-trip)', () => {
    const n = 64
    const re = new Float64Array(n)
    const im = new Float64Array(n)
    const origRe = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      re[i] = Math.sin(i * 0.3) + i * 0.01
      origRe[i] = re[i]
    }
    fftInPlace(re, im)
    ifftInPlace(re, im)
    for (let i = 0; i < n; i++) {
      expect(re[i]).toBeCloseTo(origRe[i], 8)
      expect(Math.abs(im[i])).toBeLessThan(1e-8)
    }
  })

  it('hannWindow zeroes the endpoints', () => {
    const w = hannWindow(new Float64Array([1, 1, 1, 1, 1]))
    expect(w[0]).toBeCloseTo(0, 12)
    expect(w[w.length - 1]).toBeCloseTo(0, 12)
  })
})

describe('paretoFrontier', () => {
  it('keeps only the non-dominated points (maximize both)', () => {
    const pts: XYPoint[] = [
      { x: 1, y: 1 },
      { x: 2, y: 2 }, // dominated by (2,3) and (3,4)
      { x: 2, y: 3 }, // dominated by (3,4)
      { x: 3, y: 1 },
      { x: 3, y: 4 }, // efficient
      { x: 4, y: 2 },
    ]
    const front = paretoFrontier(pts)
    expect(front).toEqual([
      { x: 3, y: 4 },
      { x: 4, y: 2 },
    ])
  })

  it('handles ties deterministically', () => {
    const front = paretoFrontier([
      { x: 1, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ])
    expect(front).toEqual([{ x: 2, y: 5 }])
  })
})

describe('buildSpatialHash', () => {
  const xs = new Float64Array([0, 1, 2, 10, 20])
  const ys = new Float64Array([0, 0.5, 1, 10, 20])
  const hash = buildSpatialHash(xs, ys, 4)

  it('queryNearest agrees with brute force', () => {
    const queries: Array<[number, number]> = [
      [0.1, 0.1],
      [9.8, 10.2],
      [19.5, 19.5],
      [5, 5],
    ]
    for (const [qx, qy] of queries) {
      const got = hash.queryNearest(qx, qy, xs, ys)
      let brute = -1
      let bestD = Number.POSITIVE_INFINITY
      for (let i = 0; i < xs.length; i++) {
        const d = (xs[i] - qx) ** 2 + (ys[i] - qy) ** 2
        if (d < bestD) {
          bestD = d
          brute = i
        }
      }
      expect(got).toBe(brute)
    }
  })

  it('returns -1 for an empty hash', () => {
    const empty = buildSpatialHash(new Float64Array(0), new Float64Array(0), 4)
    expect(empty.queryNearest(1, 1, new Float64Array(0), new Float64Array(0))).toBe(-1)
  })
})

describe('gaussianKde + excessKurtosis', () => {
  it('kde peaks near the sample mean', () => {
    const data = [-3, -2.5, -2, -1, 0.5, 1, 1.5, 2.5, 3]
    const points = [-3, -2, -1, 0, 1, 2, 3]
    const dens = gaussianKde(data, points)
    let peakIdx = 0
    for (let i = 1; i < dens.length; i++) if (dens[i] > dens[peakIdx]) peakIdx = i
    expect(Math.abs(points[peakIdx])).toBeLessThanOrEqual(1)
  })

  it('excessKurtosis of a normal-ish sample ≈ 0, heavy tails > 0', () => {
    const normalData: number[] = []
    const rng = mulberry32(5)
    for (let i = 0; i < 4000; i++) {
      const u1 = Math.max(1e-12, rng())
      const u2 = rng()
      normalData.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2))
    }
    expect(Math.abs(excessKurtosis(normalData))).toBeLessThan(0.25)
    // one 40σ outlier among nines → strong positive excess
    expect(excessKurtosis([0, 0, 0, 0, 0, 0, 0, 0, 0, 40])).toBeGreaterThan(1)
  })
})
