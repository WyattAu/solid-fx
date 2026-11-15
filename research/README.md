# solid-fx Research Notes — 200 Browser-Native UI Concepts

State: 271 components shipped across `src/content` (218 react-bits ports) and
`src/extras` (53 widgets from Magic UI, tsParticles, anime.js, Motion
Primitives, Animata, plus original OSINT ×8 and SEO ×10 categories). CI green
on `6b83d1b`. This directory records an external survey of 200 design and
widget concepts, assigns each a feasibility verdict against the solid-fx
stack, and derives the adoption roadmap.

## Files

| File | Contents | Count |
| --- | --- | --- |
| [01-page-design-paradigms.md](01-page-design-paradigms.md) | Page-level spatial, typographic, material, motion, and trust grammars | 50 |
| [02-widgets-drop-in.md](02-widgets-drop-in.md) | Self-contained widgets 101–150: analytical inputs, micro-visualizations, controls, diagnostics | 50 |
| [03-widgets-zero-wasm.md](03-widgets-zero-wasm.md) | Widgets 51–100: compositor CSS, TypedArray numerical kernels, WebGL2/WebGPU compute, platform APIs | 50 |
| [04-frontier-speculative.md](04-frontier-speculative.md) | Speculative set: non-Euclidean layouts, active-matter widgets, AI-native concepts | 50 |

## Method

Each concept is scored on three axes. Scores are engineering estimates for a
single contributor working in this repo, not measurements.

**Tier** — what the concept needs:

| Tier | Meaning | Browser floor |
| --- | --- | --- |
| T0 | Pure CSS/SVG/Canvas2D/JS over baseline APIs | All evergreen browsers |
| T1 | Recent-but-stable platform APIs (View Transitions, scroll-driven animations, anchor positioning, `:has()`, container queries, `oklch()` relative color) | One-engine gaps possible; `@supports` gate |
| T2 | WebGL2 / WebGPU compute shaders | WebGPU ≈ Chrome/Edge/Safari 26/Firefox partial — verify before shipping; WebGL2 universal |
| T3 | Frontier platform (WebNN, WebMCP, WebHID/MIDI, SharedArrayBuffer, WebCodecs, gaze) | Flagged/origin-trial territory |
| T4 | Out of scope for this repo (requires Wasm, a server, or hardware the fleet cannot test) | — |

**Effort** — S ≤ 1 day, M 2–3 days, L ≤ 1 week, XL > 1 week.

**Verdict**:

| Verdict | Meaning |
| --- | --- |
| adopt | Belongs in `src/extras` as an original widget; schedule it |
| adapt | Valuable idea, reshape to fit the drop-in widget contract |
| watch | Right idea, wrong dependency floor; revisit when platform support lands |
| skip | No realistic fit (server-side, hardware-bound, or duplicated by an existing component) |

## Headline verdicts

1. **122 of 200 concepts (61%) adopt outright; 166 (83%) are achievable
   within the existing repo contract** (adopt or adapt). The zero-Wasm,
   typed-array, GPU-native thesis of lists 03 and 04 matches the dependency
   rules already in `PORTING.md`: components may use
   `solid-js`, vanilla `motion`, `gsap`, `ogl`, `three`, `matter-js`,
   `vgpu`, `@tsparticles`, `animejs` — no React, no Wasm packages.
2. **The highest-value batch is 02 (widgets 101–150).** Self-contained
   analytical controls (Markov grid, hysteresis slider, Monte Carlo
   convergence bar, seed pill) need no GPU, no new dependencies, and fit the
   per-component install model exactly. They also differentiate solid-fx from
   every competing animation library, which ships none of this.
3. **A `src/lib/num/` layer unlocks a dozen widgets at once.** Welford/P²
   streaming stats, a 40-line FFT, a Kalman filter, a seeded PRNG, an oklch
   contrast solver, and a blue-noise generator are each ≤ 60 lines and shared
   by 3–8 concepts. The layering contract already routes shared code through
   `src/lib`.
4. **GPU-compute concepts (T2) should wait for the vgpu scene harness to
   prove WebGPU coverage**, not because of difficulty. Reaction-diffusion
   chrome, JFA empty-void placement, and prefix-sum histogrammers are all
   one-week ports once a compute-pipeline helper exists. SplashCursor already
   covers the WebGL2 fluid case (concept 68 overlap).
5. **The speculative set (04) is a watchlist, not a backlog.** Hyperbolic
   disks, Physarum menus, and CRDT scrubbers are real techniques, but each
   needs either WebGPU compute, Wasm, or infrastructure this library should
   not own. Two exceptions are cheap and worth adopting now: boids clustering
   (Canvas2D) and Hilbert-curve tree layout (pure math).

## Adoption roadmap

| Batch | Category | Source list | First components |
| --- | --- | --- | --- |
| 11 | `src/extras/instruments` | 02 (101–150) | MarkovTransitionGrid, HysteresisSlider, DetentSlideRail, MantissaExponentSpinner, SeedBadge, DecayHaloBadge |
| 12 | `src/extras/data` | 02 + 03 | BulletViolinKpi, QQBadge, ProfileFingerprint, SparklineText, HorizonStrips, MonteCarloBar |
| 13 | `src/lib/num` + consumers | 03 | WelfordTable, FftSpectrum, SpatialHashScatter, BarycentricMixer, PolarDial |
| 14 | `src/extras/fx` (T2, gated) | 03 + 04 | ReactionDiffusionChrome, JfaCalloutPlacer, HdrBloomOutliers |
| 15 | Scenes | 01 | TufteSidenoteDoc, ExplorableSwissArticle, ZeroClsLanding |

Batches 11–12 are T0: no platform risk, no new dependencies. Batch 13 adds
the numerics layer. Batch 14 waits on a WebGPU capability probe (the same
gate the AeroShards/ShapeWaves scenes already need). Batch 15 are page-level
compositions in the scenes layer, which is the only layer allowed to compose
multiple components.

## Contract compliance notes

- All 200 concepts are original implementations (techniques, not ported
  code). They land in `src/extras/<category>` with the
  `solid-fx <Category> widget — original component` header, matching the
  OSINT/SEO convention.
- Accessibility is a hard gate, not a follow-up: every animated or
  physics-driven widget ships a `prefers-reduced-motion` path (`@/lib/useReducedMotion`)
  and a keyboard-operable control path. Concepts that are inherently
  pointer-only (ferveated rendering, sonification, gesture strokes) are
  marked adapt with an a11y note.
- Zero-CLS (concept 50, list 01) applies to the new categories themselves:
  every widget reserves intrinsic aspect ratio at first paint.
