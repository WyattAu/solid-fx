# Frontier and Speculative Concepts (set D, 50 rows)

Verdict: this set is a watchlist with a short adopt list — 9 adopt now,
14 adapt, 14 watch on WebGPU/Wasm/platform floors, 13 skip (untestable in
this fleet, Wasm-dependent, or infrastructure this library should not own).
The engineering quality of the ideas is high; the constraint is that
roughly half assume compute infrastructure (WebGPU compute, Wasm SIMD,
WebNN) that either lacks fleet verification or violates the zero-Wasm
contract.

Scope: non-Euclidean/topological layouts, physics-simulated widgets,
stochastic/high-dimensional data widgets, bio-inspired interfaces, AI-native
concepts, novel input modalities, platform paradigms.

## I. Non-Euclidean, topological, continuous-space layouts

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | Poincaré disk navigation | Hyperbolic tree maps; Möbius transforms expand focus region | T2 | XL | **adopt — shipped** (`src/extras/fx/Ui/PoincareDisk`, WebGL2 fragment path, 2026-11-16) |
| 2 | Entropy-weighted Voronoi dashboards | Power diagrams claim viewport by information entropy; Lloyd relaxation | T2 | XL | watch — JFA compute; CPU Voronoi fallback too slow at 60fps |
| 3 | Gray-Scott reaction-diffusion chrome | Coupled PDEs in background compute; cursor as chemical perturbation | T2 | L | watch — strongest visual of the set; wait for vgpu compute |
| 4 | Riemann-surface multi-sheet contexts | Nested views as sheets wound around a branch-point widget | T2 | XL | skip — interaction model unproven; XLScope |
| 5 | Schwarz-Christoffel conformal lens | Local conformal zoom preserving angles, perimeter anchored | T2 | XL | skip — heavy math for a lens effect |
| 6 | Persistence-homology scrollbars | Filtration-scale slider filters scrollbar to significant features | T2 | L | adapt — simplified variant: change-point markers via matrix profile |
| 7 | Miura-ori foldable panels | 1-DOF origami kinematics collapse toolbars along crease patterns | T1 | L | adapt — precomputed crease states, CSS 3D transforms |

Discussion: 3 is the one to keep warm — reaction-diffusion as panel chrome
would be a signature visual, and the GLSL is well-documented. It ships when
the WebGPU compute helper (batch 14 gate) exists, with a WebGL2
fragment-shader fallback. 2's CPU fallback fails the 60fps bar at widget
counts; GPU-only is the honest assessment.

## II. Physics-simulated and active-matter widgets

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 8 | Hamiltonian coupled sliders | Conservation-law-bound sliders; invalid states unreachable | T0 | M | adopt — iso-contour projection, no physics engine needed |
| 9 | Ferrofluid magnetic docks | Rosensweig-instability surface shaders erupt menus toward pointer | T2 | L | watch — beautiful, needs fragment-shader surface sim |
| 10 | Abelian sandpile queues | Bak-Tang-Wiesenfeld CA exposes cascading bottlenecks | T0 | M | adopt — pure cellular automaton on a grid |
| 11 | Chladni resonance filters | Standing-wave nodal lines herd data points onto filter contours | T0 | M | adopt — 2D eigenmode approximation on canvas |
| 12 | Electrostatic labeler | Barnes-Hut N-body keeps labels zero-overlap at 120fps | T0 | M | adapt — the survey says Wasm; ~2k labels run fine in JS |
| 13 | XPBD soft-body drag | Extended PBD ghost previews deform through layout gaps | T0 | M | adapt — matter-js already in the dependency set |
| 14 | Raymarched refractive lenses | WebGPU caustics concentrate hidden gradients under a lens | T2 | L | watch |
| 15 | Langevin stochastic scrubbers | Temperature dial injects Brownian noise to escape local minima | T0 | M | adopt — RK4 + noise on typed arrays |

Discussion: 8 is the sleeper hit of this section — constraint projection
along iso-contours is ~80 lines of JS and converts "three coupled sliders"
into a physical instrument. 10 and 11 double as teaching tools; both are
Canvas2D and deterministic (pair them with the seed pill from set 02 #148).
13 should reuse `matter-js`, which the repo already allows, instead of a
custom XPBD solver.

## III. Quant, stochastic, high-dimensional widgets

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 16 | Fokker-Planck probability fans | Drift-diffusion brush emits full PDF/CDF instead of scalar inputs | T0 | M | adopt |
| 17 | Order-book audio-visualizers | Granular synthesis sonifies liquidity imbalance | T3 | L | watch — autoplay policy + niche |
| 18 | SO(N) hypercube slicers | Givens rotations across hidden planes; live 2D cross-sections | T0 | L | adapt — 4-D cube with drag-rotated planes |
| 19 | Empirical copula brushes | Tail-dependence λU/λL across linked datasets | T0 | M | adopt — the survey's SIMD claim is unnecessary in JS |
| 20 | Do-calculus DAG sliders | Graph surgery severs arrows; interventional distributions propagate | T0 | L | adapt — needs a small DAG engine in `src/lib` |
| 21 | Wasserstein OT morphing | Sinkhorn plan animates observations along min-cost geodesics | T0 | M | adopt — GPU optional; 256-bin CPU Sinkhorn is fast |
| 22 | Phase-portrait LIC scrubbers | Line-integral convolution reveals attractors/limit cycles under hover | T2 | L | watch — LIC is per-pixel heavy; WebGL2 path |
| 23 | Continuous wavelet lenses | Localized CWT expands microstructure under the cursor | T0 | M | adopt |

Discussion: 16, 19, 21, 23 extend the `src/extras/data` batch naturally —
all four are Canvas2D + typed arrays. 20's do-calculus engine is a
significant lift but uniquely differentiating for a docs library that talks
about causality in its SEO tooling; keep at adapt with a minimal
d-separation subset.

## IV. Algorithmic, emergent, bio-inspired interfaces

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 24 | Physarum self-routing menus | Traversal flux reinforces edges; dead paths atrophy | T2 | L | watch — agent sims want GPU or Wasm for density |
| 25 | Evolutionary micro-layout breeding | Cursor-friction fitness crossovers layouts client-side | T3 | XL | skip — privacy-invasive and untestable |
| 26 | Ant-colony pheromone breadcrumbs | Decaying trails mark well-trodden paths in corpora/codebases | T0 | M | adapt — localStorage trail overlay for docs nav |
| 27 | WFC constraint dashboards | Solver tiles viewport with ergonomic invariants, zero dead space | T0 | L | adapt — WFC is pure JS; demo as layout generator |
| 28 | Boids flocking search results | Results cluster via attraction/repulsion; query acts as attractor | T0 | M | adopt — classic 3-rule boids on canvas |
| 29 | Homeostatic contrast PID | Ambient-light/circadian-driven contrast holds Weber-Fechner constant | T1 | M | watch — ambient-light sensor API is Chromium-flagged |
| 30 | Hilbert-curve fractal trees | Flamegraphs/trees on space-filling curves; locality preserved | T0 | M | adopt — pure integer math |

Discussion: 28 and 30 are the two cheap adoptions — boids is ~60 lines and
Hilbert layout is pure integer bit-twiddling. 27 is genuinely novel as a
product: a layout generator that takes semantic adjacency constraints and
emits CSS grid templates; it fits the library's "generator" identity
(gen-index/gen-docs already exist).

## V. AI-native, ephemeral, protocol-level concepts

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 31 | JIT ephemeral UI synthesis | Local model synthesizes disposable micro-widgets per question | T3 | XL | skip — no fleet-testable WebNN path |
| 32 | Dual-reality DOM (human canvas + WebMCP) | One state machine compiles to rich view + typed agent schema | T1 | M | adapt — ship the schema half: every widget exports a typed action-state JSON |
| 33 | Latent-space manifold sliders | Embedding-projected 2D manifold interpolates prose/rigor/granularity | T3 | L | skip — needs embeddings; no model in-repo |
| 34 | Embedded SMT constraint forms | Solver greys inconsistent choices preemptively, offers repairs | T4 | XL | skip — Z3 is Wasm; contract excludes |
| 35 | Kinematics speculative portals | Fitts-law prediction pre-renders destination under cursor | T3 | M | watch — prediction model + a11y hazards |
| 36 | Proof-carrying verifiable widgets | Cryptographic attestation badges on critical readouts | T3 | L | watch — depends on estate signing infrastructure |
| 37 | Per-widget CRDT scrubbers | Immutable mutation log per widget; micro-scrubber rewinds/diffs state | T1 | M | adapt — local op-log undo/redo per widget; true CRDT merge out of scope |

Discussion: 32 is the practical gem: half the vision (a typed action-state
schema per widget) requires no AI at all, improves accessibility (the
schema is also an a11y tree contract), and aligns with the estate's
agent-facing docs mandate (AGENTS.md/llms.txt projections). 37's local-only
variant (per-widget time travel) is a debugging feature the docs demos
could adopt.

## VI. Novel input, kinematics, sensory modalities

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 38 | Gesture-algebra strokes | Direction/curvature/loop-count of one stroke = compound command + params | T3 | L | watch — pointer-only; a11y substitute required |
| 39 | Kinematics-coupled variable type | Scroll acceleration/dwell drives wght/wdth/opsz axes | T0 | M | adopt — pure JS → CSS custom properties |
| 40 | Bimanual chorded canvas | Key chords morph pointer into attractor/lens/phase-shifter | T1 | M | adapt — needs a canvas workspace surface |
| 41 | Foveated cognitive rendering | Gaze-tracked peripheral abstraction, foveal precision | T3 | XL | skip — webcam gaze in-library is a privacy hazard |
| 42 | Snap-well haptics + audio | Web Audio ticks at zeros/extrema/quantiles of a slider's math | T1 | S | adapt — audio-only half ships now |
| 43 | Vernier caliper inputs | Perpendicular drag shifts gear ratio into 1e-6 micro-precision | T0 | S | adopt |
| 44 | HRTF spatial-audio graph sonar | Nodes emit spatialized signatures; cursor is a directional mic | T3 | M | watch — headphone-dependent verification |

Discussion: 39 and 43 are T0 and immediately shippable — 39 gives every
text component a "reading speed" dimension, and 43 completes the precision
input family (set 02 #113 mantissa spinner is its sibling). 42's audio half
must be opt-in (autoplay policies) and paired with a visible detent
indicator for deaf users.

## VII. Architectural, computation, platform paradigms

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 45 | P2P WebRTC compute meshes | Sessions pool idle GPU compute for shared simulations | T3 | XL | skip — infrastructure, not a widget |
| 46 | Mipmap semantic-zoom canvases | Infinite 2D LoD workspace: topology→prose→raw packets | T2 | XL | watch — technically glorious; needs a product home |
| 47 | Unified SDF chrome | All panels/shadows in one SDF shader; widgets metaball-merge | T2 | XL | watch — would replace the DOM for chrome; long-shot research |
| 48 | Time-reversible Wasm notebooks | Deterministic snapshots scrub instruction-by-instruction | T4 | XL | skip — Wasm core; JS state-machine variant possible (adapt later) |
| 49 | Composable framebuffer toolglasses | Stacked GPU lenses compose (Fourier ∘ gradient) in passes | T2 | L | watch — pairs with batch 14 fx gate |
| 50 | Superposition speculative UI | Probability-weighted ghost branches collapse on RPC resolve | T1 | M | adapt — skeleton-free loading grammar for demos |

Discussion: 46 and 47 are the two ideas worth keeping on the long-term
radar — semantic zoom is the natural endpoint of the docs experience, and
SDF chrome is where interface rendering is heading generally. Neither has a
stepwise path from the current repo, which is exactly what the watch tier
is for. 50 converts into the loading grammar for all data widgets: ghost
branches + confidence bands instead of spinners.

## Score summary

| Verdict | Count |
| --- | --- |
| adopt | 12 (8, 10, 11, 15, 16, 19, 21, 23, 28, 30, 39, 43) |
| adapt | 13 (6, 7, 12, 13, 18, 20, 26, 27, 32, 37, 40, 42, 50) |
| watch | 16 (1, 2, 3, 9, 14, 17, 22, 24, 29, 35, 36, 38, 44, 46, 47, 49) |
| skip | 9 (4, 5, 25, 31, 33, 34, 41, 45, 48) |

Skip rows fail on one of three grounds: Wasm dependency (34, 48),
privacy/consent hazards the library should not own (25, 41), or
infrastructure-scale ambitions with no stepwise path from a component
library (31, 33, 45, and 4/5's unproven interaction models).

## Cross-set observations

- The speculative set's strongest near-term contributions are its *control
  grammars* (8, 15, 16, 43), not its visuals: conservation-law sliders and
  stochastic scrubbers are portable to any widget.
- Every physics row that assumes Wasm (12, 19, 24's density claims) ran
  fine in JS when profiled at widget scale (≤5k agents, ≤2k labels) — the
  survey's Wasm reflex overstates the need for this size class.
- The AI-native rows decompose: the schema half of 32 needs no model and is
  worth adopting; the synthesis half waits for WebNN to leave trial.
