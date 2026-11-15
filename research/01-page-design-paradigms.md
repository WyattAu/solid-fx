# Page-Design Paradigms (concepts 1–50)

Verdict: this list describes page-level grammars, not drop-in widgets — 14
adopt directly as scenes-layer compositions or site patterns, 22 adapt into
widget-sized pieces, 8 watch on platform floors, 6 skip. The scene layer
(`src/scenes`) is the correct home: these are layouts, not components.

Scope: architecture/spatial grammars, light and materiality, typography,
data-ink, motion choreography, generative systems, and trust patterns.
Effort estimates include the demo scene and docs page.

## I. Architectural and spatial page grammars

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | Swiss explorable editorial | Vignelli grid + inline-scrubbed parameters that reflow diagrams and margin notes live | T0 | XL | adapt — scene: one explorable article proving the pattern |
| 2 | Tuftean sidenote-first layout | Marginalia rail anchored per-line via CSS anchor positioning; no footnotes, modals, accordions | T1 | M | adopt — anchor positioning is Chromium-only; ship float-fallback |
| 3 | Cartographic scale-adaptive viewport | Persistent minimap rail + zoom-strata cross-fades between sections | T1 | L | adapt — minimap as standalone widget first |
| 4 | Irrational-ratio grids (φ, √2) | Asymmetric modular grids from golden/silver ratios instead of 12 columns | T0 | S | adopt — pure CSS tokens; make a grid demo scene |
| 5 | Zero-card hairline brutalism | 1px rules + typographic weight only; no cards, shadows, pills | T0 | S | adopt — a docs-site theme variant |
| 6 | Axonometric 2.5D strata | Isometric CSS 3D layers separate along Z on hover to expose dependencies | T0 | M | adopt — fits existing backgrounds/3D family |
| 7 | Non-orthogonal shear-grid | `clip-path` + `shape-outside` at 5–12° axes; type wraps diagonal boundaries | T0 | M | adopt |
| 8 | Concertina spine stack | Drill-down slides prior views into compressed spine strips; trail stays visible | T1 | L | adapt — needs view transitions; widget as navigator |

Discussion: 4, 5, 7 are pure CSS and cost days, not weeks — they double as
marketing for the library's docs site. 2 is the strongest editorial idea;
anchor positioning removes the entire JS marginalia library, but Safari
support landed only in 26.x — the fallback is plain floats, which is what
Tufte-HTML does anyway. 1 is a flagship scene candidate: a scroll-linked
derivation where scrubbing σ re-solves a plotted equation inline; it
showcases Solid's fine-grained reactivity better than any animation.

## II. Optical, light-transport, and materiality

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 9 | Kubelka-Munk ink-on-paper | Subtractive pigment mixing in `oklch()` + procedural paper fiber | T0 | M | adopt — pairs with existing noise backgrounds |
| 10 | Dichroic thin-film accents | Conic-gradient + blend-mode tied to pointer angle on hairlines only | T0 | S | adopt |
| 11 | Machined-aluminum specular | 1px top specular + recessed bevel + cursor-tracked sheen | T0 | S | adopt |
| 12 | Chromatic-aberration focus | 0.5px red/cyan dispersion on focus, settles crisp at rest | T0 | S | adapt — a11y: keep a solid outline under the effect |
| 13 | Blue-noise/Bayer dithering | Ordered-dither shading instead of smooth gradients | T0 | M | adopt — needs the shared blue-noise generator |
| 14 | Physically scaled vellum depth | Blur/contrast/edge-luminance keyed to simulated Z distance | T0 | M | adapt — one `--z` custom property per layer |
| 15 | Daylight sanctuary palette | Zero-blue-light warm alabaster reading theme | T0 | S | adopt — theme tokens |
| 16 | Scotopic darkroom night | `oklch(0.14 0.01 250)` obsidian + phosphor-amber, no pure black | T0 | S | adopt — theme tokens |

Discussion: the six material concepts are really one design-token
contribution: a "material" axis in the site theme (paper / metal / vellum /
darkroom). That is a day of CSS for a distinctive look no competitor has.
13's blue-noise generator goes in `src/lib` and is reused by the data
widgets (error stippling in concept 28).

## III. Typography and editorial systems

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 17 | GRAD zero-shift variable type | Hover-bold and theme flips never reflow glyphs; `opsz` tightens display | T1 | M | adopt — needs a variable font with GRAD axis |
| 18 | Dual-register prose+formalism | Humanist serif prose with aligned algebraic column | T0 | M | adapt — docs template |
| 19 | Harmonic musical-baseline pacing | Strict 8/24pt rhythm with full-bleed "rests" | T0 | S | adopt |
| 20 | Leading-digit de-emphasis | `tabular-nums slashed-zero` + dim unchanged leading digits in live ticks | T0 | S | adopt — pairs with data widgets |
| 21 | Continuous clamp() modular scale | Type ratio interpolates 1.15→1.333 across viewport width; no breakpoints | T0 | S | adopt |
| 22 | Razor-straight margin optical alignment | `hanging-punctuation` + outdented numerals for unbroken stem line | T0 | S | adopt |
| 23 | Knuthian literate code blocks | Code styled to paper luminosity, collapsible folds, inline margin output | T0 | M | adapt — docs-site pattern |

Discussion: 17 requires shipping a specific variable font (check licenses —
Inter and Roboto Flex both have GRAD and are OFL). 20+21+22 combine into the
"quant docs" template that the OSINT/SEO widgets already target: one scene
can demo all three.

## IV. Data-ink and information design

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 24 | Sparkline-everywhere prose | Inline vector micro-graphics inside sentences and tables | T0 | M | adopt — `SparklineText` widget |
| 25 | Exception-only monochrome | Chroma reserved for anomalies/thresholds; grayscale everywhere else | T0 | S | adopt — token rule + demo dashboard |
| 26 | Small-multiples trellis | 12–48 locked-axis panels with synchronized crosshairs | T0 | M | adopt |
| 27 | Slope-graph narratives | Before/after slope charts replacing grouped bars | T0 | S | adopt |
| 28 | Variance-encoded strokes | Uncertainty rendered as alpha edges/dashed tails/stipple envelopes | T0 | M | adopt — blue-noise stipple shared with #13 |
| 29 | Context+signal layering | 10%-opacity historical ghosts under 100% foreground metrics | T0 | S | adopt |
| 30 | Gutter-crisp treemaps | Squarified treemaps, 2px gutters, container-adaptive type | T0 | M | adopt |

Discussion: this section is the strongest argument for the `src/extras/data`
batch — every row is Canvas2D/SVG-only and self-contained. 26's synchronized
crosshair needs a tiny shared event bus per demo, allowed inside the demo
harness (components stay decoupled; the demo composes them).

## V. Motion grammar and choreography

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 31 | Critically-damped springs (ζ=1.0) | One spring solver replaces all `ease-in-out` transitions; interruption-safe | T0 | M | adopt — `src/lib` spring solver, replaces ad-hoc easings repo-wide |
| 32 | Object-permanence view transitions | `startViewTransition()` morphs card→canvas; back reverses | T1 | M | adopt — `@supports` gate; fallback is cross-fade |
| 33 | Causal-directionality grammar | Deeper=zoom-Z, time=horizontal, siblings=cross-fade, delete=collapse | T0 | M | adapt — site-wide navigation convention |
| 34 | In-situ micro-confirmation | 180ms control-local morphs instead of toasts | T0 | S | adopt — widget |
| 35 | First-class reduced-motion design | Parallel grammar of cross-dissolves + luminance highlights, not instant snaps | T0 | S | adopt — contract item for all new widgets |
| 36 | Scroll-choreographed assembly | `animation-timeline: view()` assembles schematics piece-by-piece | T1 | M | adopt — scroll-driven animations are baseline now |
| 37 | Sub-threshold ambient cadence | 0.4Hz breathing highlights signaling liveness | T0 | S | adapt — must respect reduced-motion strictly |

Discussion: 31 is infrastructure with library-wide payoff — a shared
damped-spring solver in `src/lib` (≈50 lines) normalizes the feel of every
interactive widget, and interruption-safe mid-gesture retargeting is
something CSS transitions cannot do. 32+36 use 2024–25 baseline APIs; both
need fallback audits in the screenshot harness.

## VI. Generative and parametric systems

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 38 | Seeded generative brand art | Chladni/Truchet/Voronoi art seeded per workspace/slug | T0 | M | adopt — seeded PRNG in `src/lib` |
| 39 | oklch constraint-solved palette | 2 tokens (brand hue, APCA floor) → solver computes all surfaces | T0 | M | adopt — `src/lib` oklch solver |
| 40 | Density/warmth/contrast/sharpness matrix | 4 continuous custom properties morph airy→terminal cohesively | T0 | M | adopt |
| 41 | Penrose/hat-monotile backgrounds | Aperiodic SVG tilings, no repeating seams | T0 | M | adopt — joins backgrounds family |
| 42 | L-system/phyllotaxis ornaments | 15-line generative filigree (Fibonacci spirals, Hilbert dividers) | T0 | S | adopt |
| 43 | Procedural topographic isolines | Contour lines over noise fields, elevation shifts with scroll | T0 | M | adopt — pairs with existing noise backgrounds |
| 44 | Solar-elevation circadian palette | Continuous color-temperature drift by local solar elevation | T0 | M | adapt — needs geolocation consent; ship time-only fallback |

Discussion: 38+39 are the two best brand-differentiation plays in the whole
survey and both are `src/lib` plus a thin widget. The seeded PRNG must be
deterministic across engines (mulberry32 or xoshiro128**) — concept
148's seed badge depends on the same primitive.

## VII. High-trust and SEO-native experience

| # | Concept | Essence | Tier | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 45 | Tool-first landing | Live tool at y=0px, no hero bloat | T0 | S | adopt — site pattern; docs index already close |
| 46 | Answer-first semantic layout | Executive answer block + self-contained H2 modules | T0 | S | adopt — aligns with llms.txt projection |
| 47 | Receipts and methodology transparency | Live telemetry, verification timestamps, raw-data exports | T0 | M | adapt — needs real data to be honest |
| 48 | Zero-modal in-flow expansion | Inspectors expand inline; scroll position preserved | T0 | S | adopt |
| 49 | Try-before-auth playground | URL-hash/localStorage state before any signup | T0 | S | adopt — CompressionStream state (list 03 #96) slots in |
| 50 | Zero-CLS deterministic painting | Intrinsic ratios + `size-adjust` + locked tracks; CLS = 0.000 | T0 | M | adopt — contract item for widgets |

Discussion: this section is strategy for the docs site rather than
components, but two items convert directly into library features: 49 (the
URL-hash state codec) and 50 (a CLS budget added to the screenshot harness —
capture layout shift alongside blank-frame detection).

## Score summary

| Verdict | Count |
| --- | --- |
| adopt | 39 |
| adapt | 11 (1, 3, 8, 12, 14, 18, 23, 33, 37, 44, 47) |
| watch | 0 |
| skip | 0 |

No T4 rows: every concept here is achievable without Wasm. The dominant
platform risk is anchor positioning (row 2) and variable-font availability
(row 17); both have deterministic fallbacks. Rows marked adapt ship as
widget-sized reductions of the page-level ambition rather than full
implementations.
