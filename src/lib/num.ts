// solid-fx shared numerics — pure functions over typed arrays, zero deps.
// Consumers: src/extras/instruments, src/extras/data. Layering: components
// import this via '@/lib/num' (see PORTING.md layer rules).

/**
 * mulberry32 — deterministic 32-bit seeded PRNG. Same seed ⇒ same sequence
 * on every engine (required for the SeedBadge reproducibility contract).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Welford running moments: exact mean/variance in O(1) space, numerically stable. */
export interface Welford {
  readonly n: number
  readonly mean: number
  readonly variance: number // sample variance (n-1 denominator); 0 when n < 2
  push(x: number): void
}

export function createWelford(): Welford {
  let n = 0
  let mean = 0
  let m2 = 0 // sum of squared deviations from the mean
  return {
    get n() {
      return n
    },
    get mean() {
      return mean
    },
    get variance() {
      return n > 1 ? m2 / (n - 1) : 0
    },
    push(x: number) {
      n += 1
      const delta = x - mean
      mean += delta / n
      m2 += delta * (x - mean)
    },
  }
}

/** Standard error of the mean for a Welford accumulator. */
export function standardError(w: Welford): number {
  return w.n > 1 ? Math.sqrt(w.variance / w.n) : Number.POSITIVE_INFINITY
}

/**
 * Standard normal quantile via Beasley-Springer-Moro (accepted error < 3e-9
 * in the central region; adequate for Q-Q thumbnails, not for risk math).
 * p in (0, 1).
 */
export function normalQuantile(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577875759784e2,
    -3.066479806614716e1, 2.506628277459239,
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const pLow = 0.02425
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }
  if (p <= 1 - pLow) {
    const q = p - 0.5
    const r = q * q
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    )
  }
  const q = Math.sqrt(-2 * Math.log(1 - p))
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  )
}

/** Box-Muller normal sampler bound to a seeded PRNG (deterministic per seed). */
export function normalSampler(rng: () => number, mu = 0, sigma = 1): () => number {
  let spare: number | null = null
  return () => {
    if (spare !== null) {
      const v = spare
      spare = null
      return mu + sigma * v
    }
    let u = 0
    let v = 0
    let s = 0
    do {
      u = rng() * 2 - 1
      v = rng() * 2 - 1
      s = u * u + v * v
    } while (s === 0 || s >= 1)
    const factor = Math.sqrt((-2 * Math.log(s)) / s)
    spare = v * factor
    return mu + sigma * u * factor
  }
}

/** Exponential sampler (rate λ) via inverse CDF, bound to a seeded PRNG. */
export function exponentialSampler(rng: () => number, rate: number): () => number {
  return () => -Math.log(1 - rng()) / rate
}

/** Gaussian kernel density evaluated at `points` over `data` (Silverman bandwidth). */
export function gaussianKde(data: number[], points: number[]): number[] {
  const n = data.length
  if (n === 0) return points.map(() => 0)
  let mean = 0
  for (const x of data) mean += x
  mean /= n
  let m2 = 0
  for (const x of data) m2 += (x - mean) * (x - mean)
  const sigma =
    Math.sqrt(m2 / Math.max(1, n - 1)) || (points[1] !== undefined ? points[1] - points[0] || 1 : 1)
  const h = 1.06 * sigma * n ** -0.2 || 1e-6
  return points.map(p => {
    let sum = 0
    for (const x of data) {
      const z = (p - x) / h
      sum += Math.exp(-0.5 * z * z)
    }
    return sum / (n * h * Math.sqrt(2 * Math.PI))
  })
}

/** Excess kurtosis (Fisher) — >0 marks heavy tails for the Q-Q verdict chip. */
export function excessKurtosis(data: number[]): number {
  const n = data.length
  if (n < 4) return 0
  let mean = 0
  for (const x of data) mean += x
  mean /= n
  let m2 = 0
  let m4 = 0
  for (const x of data) {
    const d = x - mean
    m2 += d * d
    m4 += d * d * d * d
  }
  m2 /= n
  m4 /= n
  return m2 === 0 ? 0 : m4 / (m2 * m2) - 3
}
