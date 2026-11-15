# Drop-In Widgets 101–150

Verdict: the strongest list in the survey — 43 adopt, 7 adapt, 0 skip. Every
concept is a self-contained control, input, or inline visualizer with no GPU
requirement and no Wasm; all fit the per-component install model that defines
solid-fx. This list should drive extras batches 11–12.

Scope: quantitative/analytical inputs, precision numeric and financial
controls, information-dense micro-visualizations, spatial/graph manipulation,
text and expression widgets, tactile control primitives, diagnostics and
trust widgets.

Shared infrastructure this list needs in `src/lib/num/` (each ≤ 60 lines):
seeded PRNG, Welford running moments, P² quantile estimator, 1D/2D Kalman
filter, cooley-tukey FFT, blue-noise/Bayer matrices, monotone-chain convex
hull, `$1` gesture recognizer, Schur-complement PSD check.

## I. Quantitative and analytical inputs

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 101 | Complex-plane dual pad | One puck sets (σ,ω) or (r,θ); live pole-zero/resonance curves behind | T0 | M | adopt |
| 102 | Markov transition grid | N×N cells as micro-bars; row-normalized drags; power-iteration π live | T0 | M | adopt |
| 103 | PSD-guarded correlation editor | Cholesky/Schur clamp keeps slider inside feasible ρ interval | T0 | M | adopt |
| 104 | Piecewise step/hazard editor | Snap segments; split/merge breakpoints; optional integral-conservation toggle | T0 | M | adopt |
| 105 | Stern-Brocot rational stepper | Nearest Farey neighbors shown; one-click snap to 355/113-class fractions | T0 | M | adopt |
| 106 | S³ quaternion arcball | Stereographic trackball, lockable axis rings, (w,x,y,z) out | T0 | M | adapt — niche; tie to 3D scenes |
| 107 | Zn star-polygon picker | Modular clock; residue selection draws star chords; GCD/cycle visible | T0 | S | adopt |
| 108 | Harmonic basis mixer | 8–16 faders → live waveform/kernel/easing thumbnail; L2 normalize button | T0 | M | adopt |

Discussion: 102 and 103 are the flagship pieces — row-stochastic
normalization and PSD clamping are the two places where "impossible states
are unreachable" converts directly into user trust. All eight run on
Canvas2D or SVG with `Float64Array` state; pointer events + `setPointerCapture`
give the drag mechanics; none need a RAF loop at idle.

## II. Precision numeric, time, and financial controls

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 109 | VWAP trajectory slicer | Drag order quantity across volume silhouette; impact-vs-timing overlay | T0 | L | adapt — domain-heavy demo data needed |
| 110 | Scrubbable semantic number tokens | Inline numbers grow a ruler on hover; flick toggles units | T0 | M | adopt |
| 111 | Blast-radius execution button | Hold-progress ring resists inversely to VaR/row-count | T0 | S | adopt |
| 112 | Bid-ask pinch bracket | Two linked handles on a price axis; auto-peg toggle to micro-price drift | T0 | M | adapt — needs a live feed to demo |
| 113 | Mantissa-exponent split spinner | Wheel scrubs 1.00–9.99; pill steps base-10/1e3k exponent; spans 1e±18 | T0 | S | adopt |
| 114 | Rolling-window timeline brush | Center-slide window; anchor-lock cumulative mode; wheel dilates around midpoint | T0 | M | adopt |
| 115 | Hysteresis dual-threshold slider | Trigger + reset handles with shaded deadband | T0 | S | adopt |
| 116 | Multi-detent safety slide-rail | Validate→Stage→Commit notches; early release snaps back | T0 | S | adopt |

Discussion: 113/115/116 are the three best "boring-genius" widgets — small,
universally useful, absent from every competing library. 110 generalizes
into the docs site itself (scrubbable parameters in component demos). 111's
resistance must remain a perception aid, never a security control — note
that in the widget docs.

## III. Information-dense micro-visualizations

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 117 | Bullet-violin KPI strip | 48px KDE violin + IQR band + yesterday tick + live needle | T0 | M | adopt |
| 118 | Rolling covariance spark-pill | Badge with 30d correlation sparkline; hue shift on regime inversion | T0 | M | adopt |
| 119 | Zero-centered residual fold | Toggle folds two lines into a signed error strip exposing bias | T0 | S | adopt |
| 120 | 24px profile fingerprint | N-dim feature vector as vertical tick barcode per table row | T0 | S | adopt |
| 121 | Variance-bridge waterfall pill | Opening→closing through +α/−β/+γ contributors; share-on-hover | T0 | S | adopt |
| 122 | Header ACF/PACF correlogram | 100×36px lag bars with 95% Bartlett bounds in column headers | T0 | M | adopt |
| 123 | Q-Q normality badge | 32×32px quantile thumbnail; 45° line = Gaussian, S-bend = fat tails | T0 | S | adopt |
| 124 | 24h circadian polar ring | Radial day/night arcs exposing market bursts, cron storms | T0 | S | adopt |
| 125 | Bottleneck streamgraph ribbon | 28px CPU/Mem/IO strata; thickness = load, band ratio = saturation | T0 | M | adopt |

Discussion: this is the highest-density section: nine widgets, average
effort between S and M, all SVG/Canvas2D. 120+123 together turn any dense
table into a scannable instrument panel — demo them as one composite scene
("quant table") in the scenes layer. Welford/P² from `src/lib/num` powers
117/118/122/123.

## IV. Spatial, geometric, and graph widgets

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 126 | Radial ego-bloom inspector | 1–2-hop neighbor rings on click; no global hairball | T0 | M | adopt |
| 127 | Crosshair conditional marginals | 2D density + live KDE slices P(Y|x₀), P(X|y₀) on borders | T0 | M | adopt |
| 128 | MAUP-busting aggregation slider | Morph points→hexbin→grid continuously to expose aggregation artifacts | T0 | M | adopt |
| 129 | Dependency comb | DAG untangled into parallel strata; critical path + slack on hover | T0 | L | adapt — topological sort layer needed |
| 130 | Sankey throttle valves | Pinch-valves on branches; live spillover rerouting | T0 | L | adapt — needs a Sankey base first |
| 131 | Table-lens fisheye matrix | 60×60 in 320px; hyperbolic row/col magnification on hover | T0 | M | adopt |
| 132 | Frustum face-snap gizmo | Corner orientation cube; one-click XY/XZ/YZ snaps | T1 | M | adapt — only with 3D scenes |
| 133 | Quadtree declutter loupe | Magnifier collapses clutter to contours, expands top-K outliers | T0 | M | adopt |

Discussion: 126/131/133 share a spatial-index primitive (`Int32Array` grid,
list 03 #62) — build that first and all three drop to M effort. 127 is the
best statistics-teaching widget of the list; ship it with a bivariate-normal
default dataset so the demo is honest.

## V. Text, code, and expression widgets

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 134 | Greek-sensitivity formula bar | Equations as AST pills; hover shows ∂f/∂x; drag re-evaluates | T0 | L | adapt — needs an expression parser in `src/lib` |
| 135 | RegEx railroad flasher | Typing unfolds a finite-automaton diagram; flags catastrophic backtracking | T0 | M | adopt — NFA builder is ~150 lines |
| 136 | Proportional structural diff | Unchanged lines collapse to 1px/10-line strips; AST moves as color bridges | T0 | L | adapt — line-level first, AST later |
| 137 | CLI/pill query token bar | `latency:>45ms` crystallizes to typed pills; click cycles operators | T0 | M | adopt |
| 138 | Stroke-sketch symbol recognizer | 64px scratchpad + $1 recognizer (~40 lines) inserts ∇, ⊮, ⊗ | T0 | S | adopt |
| 139 | Multi-row transform preview strip | Live first-5-row previews while authoring splits/parses | T0 | M | adopt |

Discussion: 135 and 137 are the most immediately useful to the target
audience (developers reading docs). 138 is a delight-feature with a tiny
footprint — the $1 recognizer is public-domain and 40 lines.

## VI. Tactile and ergonomic control primitives

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 140 | Momentary-peek switch | Overlays visible only while pressed; safety latch notch for lock-open | T0 | S | adopt |
| 141 | Flick-through radial ring | 8-sector ring; selection on perimeter crossing via atan2 | T0 | M | adapt — pointer-only; add keyboard ring nav |
| 142 | Inertial flywheel scrubber | Angular momentum + viscous drag; flick coasts, rest brakes to 1-line steps | T0 | M | adopt |
| 143 | Gravity-well detent slider | Quadratic attraction to notches; park between wells for continuous blend | T0 | M | adopt |
| 144 | Live dry-run command palette | Palette highlight renders translucent preview before Enter | T0 | M | adapt — needs a workspace surface to preview onto |
| 145 | Container-query density morph | 40px badge→pill→chart→table transforms at `@container` breakpoints | T1 | M | adopt |

Discussion: 142+143 pair into one "kinetic input" family with the
critically-damped spring solver (list 01 #31). 145 is baseline now and
becomes the standard pattern for every responsive widget in batches 11+.

## VII. Diagnostics, state, simulation, trust

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 146 | Monte Carlo convergence bar | Running μ̂ₙ ± SEₙ strip; "Accept & Stop" when CI inside tolerance | T0 | M | adopt |
| 147 | Half-life decay halo | Freshness ring decays luminance past configured half-life | T0 | S | adopt |
| 148 | Seed and rewind pill | Seed badge: reroll, hex-edit for bit-identical repro, last-5 hover | T0 | S | adopt |
| 149 | Frame-time ECG strip | 60×20px rAF delta plot; GC pauses visible as spikes | T0 | S | adopt |
| 150 | Calculation lineage popover | Hover any derived number → hop-trace with intermediates + timestamps | T0 | M | adapt — most useful inside the docs' own demos |

Discussion: 146/147/148 are the trust triad — determinism (seed),
freshness (decay), convergence (progress-with-meaning). They apply to
solid-fx's own scenes (every generative scene gets a seed pill). 149 is a
meta-widget: the repo's QA harness can embed it in scene demos to prove
frame budgets live.

## Score summary

| Verdict | Count |
| --- | --- |
| adopt | 39 |
| adapt | 11 (106, 109, 112, 129, 130, 132, 134, 136, 141, 144, 150) |
| watch | 0 |
| skip | 0 |

No dependency additions required for any adopt row: everything runs on
`solid-js` + Canvas2D/SVG + `motion` where easing is wanted. The enabling
investment is `src/lib/num/`, not per-widget heroics.
