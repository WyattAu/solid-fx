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

// ---------------------------------------------------------------------------
// Linear algebra / filtering kernels
// ---------------------------------------------------------------------------

export interface JacobiResult {
  /** Eigenvalues, ascending. */
  values: number[]
  /** Eigenvectors as rows (v[i] pairs with values[i]). */
  vectors: number[][]
}

/**
 * Cyclic Jacobi eigen-decomposition of a symmetric matrix (~70 lines, the
 * zero-Wasm substitute for a linear-algebra binary). Returns eigenvalues
 * ascending with matching orthonormal eigenvector rows.
 */
export function jacobiEigen(matrix: number[][]): JacobiResult {
  const n = matrix.length
  const a = matrix.map(row => row.slice())
  const v: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array(n).fill(0)
    row[i] = 1
    return row
  })
  for (let sweep = 0; sweep < 64; sweep++) {
    let off = 0
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j]
    if (off < 1e-20) break
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(a[i][j]) < 1e-15) continue
        const theta = (a[j][j] - a[i][i]) / (2 * a[i][j])
        const sign = theta >= 0 ? 1 : -1
        const t = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const s = t * c
        for (let k = 0; k < n; k++) {
          const aik = a[i][k]
          const ajk = a[j][k]
          a[i][k] = c * aik - s * ajk
          a[j][k] = s * aik + c * ajk
        }
        for (let k = 0; k < n; k++) {
          const vki = v[k][i]
          const vkj = v[k][j]
          v[k][i] = c * vki - s * vkj
          v[k][j] = s * vki + c * vkj
        }
      }
    }
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((x, y) => a[x][x] - a[y][y])
  return {
    values: order.map(i => a[i][i]),
    vectors: order.map(i => Array.from({ length: n }, (_, k) => v[k][i])),
  }
}

/** Minimal 1D Kalman filter (scalar state + measurement noise). */
export class Kalman1D {
  private x: number | null = null
  private p = 1
  constructor(
    private readonly processNoise: number,
    private readonly measurementNoise: number,
  ) {}

  /** Feed one raw measurement, returns the filtered estimate. */
  update(z: number): number {
    if (this.x === null) {
      this.x = z
      this.p = this.measurementNoise
      return z
    }
    // predict
    this.p += this.processNoise
    // correct
    const k = this.p / (this.p + this.measurementNoise)
    this.x += k * (z - this.x)
    this.p *= 1 - k
    return this.x
  }

  reset(): void {
    this.x = null
    this.p = 1
  }
}

/** Savitzky–Golay smoothing coefficients for a window (odd) and poly order. */
export function savgolSmooth(data: number[], window: number, polyOrder = 2): number[] {
  const w = window % 2 === 0 ? window + 1 : window
  const half = (w - 1) / 2
  const n = data.length
  if (n < w) return data.slice()
  // least-squares fit coefficients: rows of the Vandermonde pseudo-inverse
  const coeffs: number[][] = []
  for (let c = -half; c <= half; c++) {
    const row: number[] = []
    for (let m = 0; m <= polyOrder; m++) row.push(c ** m)
    coeffs.push(row)
  }
  // normal equations AᵀA x = Aᵀ y solved per window via precomputed pinv(AᵀA)Aᵀ row 0
  const ata: number[][] = Array.from({ length: polyOrder + 1 }, () =>
    new Array(polyOrder + 1).fill(0),
  )
  for (let i = 0; i <= polyOrder; i++)
    for (let j = 0; j <= polyOrder; j++) for (const row of coeffs) ata[i][j] += row[i] * row[j]
  // gaussian elimination inverse of ata (small: ≤ 4×4)
  const inv: number[][] = ata.map((row, i) => row.map((_, j) => (i === j ? 1 : 0)))
  for (let col = 0; col <= polyOrder; col++) {
    let pivot = col
    for (let r = col + 1; r <= polyOrder; r++)
      if (Math.abs(inv[r][col]) > Math.abs(inv[pivot][col])) pivot = r
    ;[inv[col], inv[pivot]] = [inv[pivot], inv[col]]
    ;[ata[col], ata[pivot]] = [ata[pivot], ata[col]]
    const d = ata[col][col] || 1e-12
    for (let j = 0; j <= polyOrder; j++) {
      ata[col][j] /= d
      inv[col][j] /= d
    }
    for (let r = 0; r <= polyOrder; r++) {
      if (r === col) continue
      const f = ata[r][col]
      for (let j = 0; j <= polyOrder; j++) {
        ata[r][j] -= f * ata[col][j]
        inv[r][j] -= f * inv[col][j]
      }
    }
  }
  // smoothing kernel row (value coefficient at each offset)
  const kernel = new Array(w).fill(0)
  for (let k = 0; k < w; k++)
    for (let m = 0; m <= polyOrder; m++) kernel[k] += inv[0][m] * coeffs[k][m]
  const out = new Array(n)
  for (let i = 0; i < n; i++) {
    let acc = 0
    for (let k = 0; k < w; k++) {
      const j = Math.min(n - 1, Math.max(0, i - half + k))
      acc += data[j] * kernel[k]
    }
    out[i] = acc
  }
  return out
}

/** Popcount of a 32-bit word (SWAR). */
export function popcount32(w: number): number {
  let x = w - ((w >>> 1) & 0x55555555)
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
  x = (x + (x >>> 4)) & 0x0f0f0f0f
  return (Math.imul(x, 0x01010101) >>> 24) & 0x3f
}

/** Bitwise AND of two equal-length Uint32Array masks, into `out`. */
export function bitsetAnd(a: Uint32Array, b: Uint32Array, out: Uint32Array): Uint32Array {
  for (let i = 0; i < a.length; i++) out[i] = a[i] & b[i]
  return out
}

/** Bitwise OR of two equal-length Uint32Array masks, into `out`. */
export function bitsetOr(a: Uint32Array, b: Uint32Array, out: Uint32Array): Uint32Array {
  for (let i = 0; i < a.length; i++) out[i] = a[i] | b[i]
  return out
}

/** Number of set bits in a mask array. */
export function bitsetCount(mask: Uint32Array): number {
  let c = 0
  for (let i = 0; i < mask.length; i++) c += popcount32(mask[i])
  return c
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

// ---------------------------------------------------------------------------
// Spectral kernel
// ---------------------------------------------------------------------------

/**
 * Iterative radix-2 Cooley-Tukey FFT, in place over separate real/imaginary
 * buffers. Length must be a power of two. ~1 KB of logic, no allocation
 * beyond the caller's buffers — the zero-Wasm substitute for a DSP binary.
 */
export function fftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length
  if (n !== im.length || n === 0 || (n & (n - 1)) !== 0) {
    throw new Error('fftInPlace: length must be a nonzero power of two')
  }
  // bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const tre = re[i]
      re[i] = re[j]
      re[j] = tre
      const tim = im[i]
      im[i] = im[j]
      im[j] = tim
    }
  }
  // butterflies
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const stepRe = Math.cos(ang)
    const stepIm = Math.sin(ang)
    const half = len >> 1
    for (let base = 0; base < n; base += len) {
      let curRe = 1
      let curIm = 0
      for (let k = 0; k < half; k++) {
        const i = base + k
        const j = i + half
        const vRe = re[j] * curRe - im[j] * curIm
        const vIm = re[j] * curIm + im[j] * curRe
        re[j] = re[i] - vRe
        im[j] = im[i] - vIm
        re[i] += vRe
        im[i] += vIm
        const nextRe = curRe * stepRe - curIm * stepIm
        curIm = curRe * stepIm + curIm * stepRe
        curRe = nextRe
      }
    }
  }
}

/** inverse FFT: negate the spectrum, forward transform, negate + scale. */
export function ifftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 0; i < n; i++) im[i] = -im[i]
  fftInPlace(re, im)
  for (let i = 0; i < n; i++) {
    im[i] = -im[i]
    re[i] /= n
    im[i] /= n
  }
}

/** Hann window applied to a copy of the input. */
export function hannWindow(signal: Float64Array): Float64Array {
  const n = signal.length
  const out = new Float64Array(n)
  const denom = n > 1 ? n - 1 : 1
  for (let i = 0; i < n; i++) {
    out[i] = signal[i] * 0.5 * (1 - Math.cos((2 * Math.PI * i) / denom))
  }
  return out
}

/**
 * One-sided magnitude spectrum: zero-pads to a power of two, Hann-windows,
 * FFTs, returns magnitudes for bins 0..n/2. Bin k ↔ frequency
 * k * sampleRate / nextPow2(input length).
 */
export function magnitudeSpectrum(signal: ArrayLike<number>): { mags: Float64Array; n: number } {
  let n = 1
  while (n < signal.length) n <<= 1
  const re = new Float64Array(n)
  for (let i = 0; i < signal.length; i++) re[i] = signal[i]
  const win = hannWindow(re)
  const im = new Float64Array(n)
  fftInPlace(win, im)
  const half = n >> 1
  const mags = new Float64Array(half)
  for (let k = 0; k < half; k++) mags[k] = Math.hypot(win[k], im[k])
  return { mags, n }
}

// ---------------------------------------------------------------------------
// Pareto kernel
// ---------------------------------------------------------------------------

export interface XYPoint {
  x: number
  y: number
}

/**
 * Pareto-efficient subset for "bigger is better on both axes". O(n log n)
 * sort + reverse sweep with a running best-y. For minimize problems, flip
 * the signs of the coordinates first.
 */
export function paretoFrontier(points: XYPoint[]): XYPoint[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const out: XYPoint[] = []
  let bestY = Number.NEGATIVE_INFINITY
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    if (p.y > bestY) {
      out.push(p)
      bestY = p.y
    }
  }
  return out.reverse()
}

// ---------------------------------------------------------------------------
// Spatial hash kernel
// ---------------------------------------------------------------------------

export interface SpatialHash {
  /** Nearest point index within the hash, or -1. */
  queryNearest(x: number, y: number, xs: Float64Array, ys: Float64Array): number
  readonly cols: number
  readonly rows: number
}

/**
 * Uniform-grid spatial hash in flat typed arrays (CSR layout: cell → count
 * prefix → indices). O(1) expected nearest queries for the scatter widgets;
 * zero per-query allocation.
 */
export function buildSpatialHash(xs: Float64Array, ys: Float64Array, cell: number): SpatialHash {
  const n = xs.length
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (let i = 0; i < n; i++) {
    if (xs[i] < minX) minX = xs[i]
    if (xs[i] > maxX) maxX = xs[i]
    if (ys[i] < minY) minY = ys[i]
    if (ys[i] > maxY) maxY = ys[i]
  }
  const cols = Math.max(1, Math.ceil((maxX - minX) / cell))
  const rows = Math.max(1, Math.ceil((maxY - minY) / cell))
  const colOf = (x: number) => Math.min(cols - 1, Math.max(0, Math.floor((x - minX) / cell)))
  const rowOf = (y: number) => Math.min(rows - 1, Math.max(0, Math.floor((y - minY) / cell)))

  const counts = new Int32Array(cols * rows)
  for (let i = 0; i < n; i++) counts[rowOf(ys[i]) * cols + colOf(xs[i])] += 1
  const offsets = new Int32Array(cols * rows + 1)
  for (let c = 0; c < cols * rows; c++) offsets[c + 1] = offsets[c] + counts[c]
  const indices = new Int32Array(n)
  const cursor = new Int32Array(cols * rows)
  for (let i = 0; i < n; i++) {
    const c = rowOf(ys[i]) * cols + colOf(xs[i])
    indices[offsets[c] + cursor[c]] = i
    cursor[c] += 1
  }

  const queryNearest = (
    qx: number,
    qy: number,
    xsArr: Float64Array,
    ysArr: Float64Array,
  ): number => {
    if (n === 0) return -1
    const cx = colOf(qx)
    const cy = rowOf(qy)
    const maxRing = Math.max(cols, rows)
    let best = -1
    let bestD2 = Number.POSITIVE_INFINITY
    for (let ring = 0; ring <= maxRing; ring++) {
      const x0 = Math.max(0, cx - ring)
      const x1 = Math.min(cols - 1, cx + ring)
      const y0 = Math.max(0, cy - ring)
      const y1 = Math.min(rows - 1, cy + ring)
      for (let ry = y0; ry <= y1; ry++) {
        for (let rx = x0; rx <= x1; rx++) {
          // only the ring's perimeter (interiors were scanned at smaller r)
          if (ring > 0 && rx > x0 && rx < x1 && ry > y0 && ry < y1) continue
          const c = ry * cols + rx
          for (let k = offsets[c]; k < offsets[c + 1]; k++) {
            const idx = indices[k]
            const dx = xsArr[idx] - qx
            const dy = ysArr[idx] - qy
            const d2 = dx * dx + dy * dy
            if (d2 < bestD2) {
              bestD2 = d2
              best = idx
            }
          }
        }
      }
      // early exit: any point found in this ring is nearer than anything
      // a wider ring could contain, because the ring bound is the cell size
      if (best >= 0 && ring > 0) {
        const ringDist = (ring - 1) * cell
        if (bestD2 <= ringDist * ringDist) break
      }
    }
    return best
  }

  return { queryNearest, cols, rows }
}
