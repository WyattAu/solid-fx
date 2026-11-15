# Zero-Wasm Widgets 51–100

Verdict: this list validates the repo's existing dependency contract — 24
adopt now on baseline APIs, 15 adapt behind `@supports` gates or shared
`src/lib` kernels, 5 watch on WebGPU compute (blocked on the same coverage
gate as the AeroShards/ShapeWaves scenes), 6 skip (platform-frontier items
with no fleet-testable path). The TypedArray kernel section (58–65) is the
single highest-leverage block: one `src/lib/num` layer serves all of it.

Scope: zero-JS compositor CSS, JIT-native TypedArray numerical widgets,
WebGL2/WebGPU compute, quantitative visualizations, direct-manipulation
geometry, platform-native synergies, compression-first architecture.

## I. Zero-JS compositor and pure-CSS engines

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 51 | Trig-driven orbital menus | CSS `sin()/cos()/atan2()` + `@property --angle`; radial palettes with 0 bytes JS | T0 | S | adopt |
| 52 | Scroll-timeline kinematics | `animation-timeline: scroll()/view()` drives orbital/3D paths, no listeners | T0 | S | adopt |
| 53 | Anchor-positioning connectors | `anchor()` + `atan2()` orient arrows between moving nodes; no `getBoundingClientRect` | T1 | M | adapt — Chromium-only; SVG-line fallback |
| 54 | oklch relative color ramps | `oklch(from var(--base) l c calc(h + Δ))` uniform ramps for charts | T0 | S | adopt |
| 55 | `:has()` logic matrices | Filter dependencies and truth-table highlighting in relational selectors | T0 | S | adopt |
| 56 | SVG `feDisplacementMap` refraction | Live DOM under `<feTurbulence>`+`<feDisplacementMap>` glass/heat-haze | T0 | M | adopt |
| 57 | `feConvolveMatrix` edge overlay | Sobel/Laplacian over live charts via 3 lines of filter markup | T0 | S | adopt |

Discussion: 51/52/54/55 are free wins — demo scenes showing "0 KB of JS"
interactivity are also the best possible advertisement for the CSS-first
philosophy. 56 overlaps the existing Noise/Grain text family but adds
live-DOM refraction, which no current component does; keep filter regions
small (filter-region blowups are the classic perf trap).

## II. TypedArray and JIT-native numerical widgets

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 58 | SoA micro-chart core | <3 KB chart core; 500k ticks in `Float64Array` columns; zero GC | T0 | M | adopt |
| 59 | Kalman pointer stabilizer | `getCoalescedEvents()` → 35-line 2D Kalman; tremor/intent separation | T0 | S | adopt |
| 60 | Streaming Welford + P² | O(1) mean/var/skew/kurtosis + median/p99 per cell | T0 | S | adopt |
| 61 | Bitset faceted search | `Uint32Array` masks; AND/OR/XOR + popcount over 500k rows <1ms | T0 | M | adopt |
| 62 | Spatial-hash canvas hit-testing | 50k-node canvas + `Int32Array` grid; O(1) hover at 120fps | T0 | M | adopt |
| 63 | In-place radix-2 FFT | ~1 KB Cooley-Tukey over `Float32Array`; live PSD | T0 | S | adopt |
| 64 | Savitzky-Golay hover brushing | Local convolution under cursor → smoothed f′, f″, inflections | T0 | S | adopt |
| 65 | SharedArrayBuffer SPSC ring | Worker parses WS binary → SAB ring; render thread reads snapshots | T3 | M | watch — needs COOP/COEP headers; GitHub Pages can't set them |

Discussion: 58–64 are the numerics layer. All eight kernels land in
`src/lib/num/` in one batch (S effort each), then widgets wrap them. 65 is
architecturally correct but unshippable on GitHub Pages (no custom headers);
revisit if the site moves to Cloud Pages. The honest note: the JIT claim is
sound — monomorphic typed-array loops are the right zero-Wasm idiom, and
this repo's dependency list already forbids Wasm packages.

## III. GPU-resident compute paradigms

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 66 | Transform-feedback particle econometrics | 1M Monte Carlo paths in ping-pong VBOs; CPU never touches state | T2 | L | watch — WebGL2 path feasible; needs scene harness |
| 67 | WGSL prefix-sum histogrammer | Blelloch scan compute; rebin at 120fps; live VaR cutoffs | T2 | L | watch — vgpu compute helper first |
| 68 | Navier-Stokes ping-pong fluid | Eulerian fluid in fragment shaders; vorticity advection of HUD tags | T2 | L | skip — SplashCursor already ships the WebGL fluid case |
| 69 | GPU jump-flooding void placement | JFA EDT over UI boxes → maximal empty void for callouts, log₂(N) passes | T2 | M | watch — do CPU grid version first |
| 70 | Instanced SDF bezier edges | 100k edges in one `drawElementsInstanced`; exact quadratic distance in FS | T2 | M | adapt — ogl/three path, WebGL2 universal |
| 71 | Anisotropic Kuwahara map filter | Edge-preserving smoothing beneath data overlays | T2 | M | watch |
| 72 | RGBA16F HDR outlier bloom | >3σ anomalies bloom via mip-chain Gaussian; pre-attentive salience | T2 | M | adapt — WebGL2 float-buffer path |
| 73 | WGSL simplex/FBM micro-materiality | 30-line noise shaders replace texture assets | T2 | S | adapt — GLSL versions already exist in backgrounds family |

Discussion: the GPU block is where the survey's WebGPU-coverage claim
(~89%) needs verification before any adopt decision — the fleet's phone
verification backlog (AeroShards/ShapeWaves blanks) is the same gate. 70
and 72 have WebGL2 fallbacks that run everywhere and belong in a
`src/extras/fx` batch behind a capability probe. 68 stays skipped: SplashCursor
owns the fluid niche in this library.

## IV. Quantitative and information-theoretic visualizations

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 74 | Folded-band horizon strips | 16px rows fold ±deviation into intensity-graded bands; scan 100+ series | T0 | M | adopt |
| 75 | KL-divergence event feeds | Events scored by KL vs rolling prior; regime shifts expand, noise folds | T0 | M | adopt |
| 76 | Jacobi eigen portfolio scrubber | ~70-line cyclic Jacobi; PC1 projection exposes arb residuals | T0 | M | adopt |
| 77 | Logit-scale probability inputs | Sliders on ln(p/1−p); 99→99.9% distance matches +10dB evidence | T0 | S | adopt |
| 78 | Activity-clock warped time axes | Candles on volume/variance axes, not wall-clock | T0 | M | adopt |
| 79 | Canvas2D footprint ladder | DOM-free order-flow ladder; diagonal absorption highlights | T0 | M | adapt — niche audience |
| 80 | Mutual-information matrix brush | Pairwise Shannon MI via adaptive binning; non-linear dependence | T0 | M | adopt |
| 81 | Live Pareto-frontier envelopes | Monotone chain hull (~25 lines) shades dominated vs efficient sets | T0 | S | adopt |

Discussion: 74/77/81 are the best general-purpose rows — horizon strips and
logit sliders have no dependency on finance-specific data, and the Pareto
hull is a 25-line kernel with broad dashboard use. 76 is a genuinely
impressive demo of zero-Wasm numerics: cyclic Jacobi in 70 lines beats the
perceived need for a linear-algebra Wasm blob.

## V. Direct-manipulation geometry controls

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 82 | Barycentric simplex mixers | Triangle puck → exact λ₁+λ₂+λ₃=1 weights; replaces 3 coupled sliders | T0 | S | adopt |
| 83 | Polar micrometer dials | Multi-turn atan2 rings with winding-number accumulation | T0 | S | adopt |
| 84 | Mean-width-skew interval handles | One gesture sets μ, σ, and asymmetric skew | T0 | M | adopt |
| 85 | Payoff/easing curve sketchers | Drag Catmull-Rom/Hermite knots → compile to `Float64Array` LUT | T0 | M | adopt |
| 86 | Basis-vector affine gizmos | Grab î/ĵ arrowheads; shear/rotation/determinant live | T0 | M | adopt |
| 87 | Winding-number elastic lassos | Freeform polygon select via ray-cast; boolean subtract/intersect | T0 | M | adopt |
| 88 | Exponential-sensitivity scrubbers | Horizontal gain × exp(k·|Δy|); decade spans without tool switch | T0 | M | adopt |
| 89 | CAD-grade intersection guides | Snap-to-tangent/perpendicular/equal-spacing in <50 lines | T0 | M | adapt — needs a canvas editor surface |

Discussion: 82/83/85 are instant classics for a component library — every
dashboard and every easing editor wants them. 85 has a second consumer: the
library's own demos can expose per-component easing curves via this widget.

## VI. Platform-native synergies

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 90 | WebCodecs VideoFrame scrubbing | Decoder → `importExternalTexture`; frame-accurate reverse at 60fps | T3 | L | watch — origin-trial-adjacent; large |
| 91 | AudioWorklet sonification | P99 latency/volatility → consonance/beating on audio thread | T3 | M | adapt — optional layer on data widgets; autoplay-policy gated |
| 92 | Parametric morphing icons | Coordinate arrays/Fourier epicycles interpolate play↔pause↔alert | T0 | S | adopt |
| 93 | View-transition topological morphing | `startViewTransition` + animated `clip-path` route morphs, 0 KB framework | T1 | S | adopt |
| 94 | WebHID/WebMIDI hardware binding | Rotary encoders/faders drive dashboards in ~30 lines | T3 | M | watch — hardware-dependent testing |
| 95 | BroadcastChannel multi-monitor | Windows linked by screenX/Y over zero-latency channel | T1 | M | watch — needs multi-window QA harness |

Discussion: 92 and 93 are T0/T1 and cheap — adopt. The rest of this section
is genuinely frontier: WebHID demos can't be verified in CI or on the phone
harness, and BroadcastChannel scenes need two synchronized windows in the
screenshot harness. Keep them on the watchlist with explicit testability
preconditions.

## VII. Compression-first architecture

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 96 | CompressionStream URL workspaces | Layout/filter ASTs → bitpacked `Uint8Array` → deflate-raw → URL hash | T0 | M | adopt |
| 97 | Streaming byte-chunk hydration | Varint/NDJSON parsers paint frame 1 while 100MB payload streams | T0 | M | adapt — site-level; needs real payloads |
| 98 | 1M×1M recycled-cell sparse grid | ~150 recycled divs + integer math + translate3d; no virtual DOM | T0 | M | adopt |
| 99 | Monomorphic `new Function` JIT filters | User expressions compile to tight typed-array loops | T0 | M | adapt — sandbox carefully; CSP `unsafe-eval` conflict |
| 100 | 20-line attractor micro-worlds | Lorenz/Rössler/double-pendulum RK4 replace Lottie spinners | T0 | S | adopt |

Discussion: 96+49 (list 01) are the same feature — a URL-state codec makes
every widget demo shareable and enables the try-before-auth pattern. 99 is
powerful but needs a hard note: `new Function` collides with strict CSPs,
so ship it as opt-in with an interpreter fallback. 100 is a perfect
"loading state" family for scenes — three attractors, one batch.

## Score summary

| Verdict | Count |
| --- | --- |
| adopt | 32 |
| adapt | 9 (53, 70, 72, 73, 79, 89, 91, 97, 99) |
| watch | 8 (65, 66, 67, 69, 71, 90, 94, 95) |
| skip | 1 (68 — SplashCursor already owns the WebGL fluid case) |

The one hard-blocked row is 65 (SharedArrayBuffer needs COOP/COEP headers
that GitHub Pages cannot serve); the watch rows share one precondition — a
verified WebGPU compute helper or a multi-window/hardware QA harness.
