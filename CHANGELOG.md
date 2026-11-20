# Changelog

All notable changes to solid-fx. Format follows Keep a Changelog; versions
are tagged on GitHub Releases.

## [0.2.0] — 2026-11-20

The GPU/instruments wave: jump-flood placement, HDR bloom, GPU-resident
histogramming, LIC flow fields, a Physarum transport network, and the
first headless-engine pilots (Kobalte, rough-notation, gl-transitions).

### Added

- **Data**: VaRHistogram (re-binnable histogram with VaR/CVaR markers),
  GpuHistogram — 60-bin parallel reduction over 102,400 GPU-resident R32F
  samples, counts stay in an RGBA32F texture until a single readback;
  zero CPU counting (WebGL2 fragment form of research 03 #67, capability
  probe + Canvas2D fallback).
- **FX**: HdrBloomOutliers — RGBA16F bloom pipeline (scene FBO →
  bright-pass → separable blur → Reinhard composite) with capability
  probe and Canvas2D fallback (research 03 #72); LICFlowField — CPU
  line-integral convolution phase portraits over typed arrays
  (vortex/source/saddle field, hover tracer; research 04 #22);
  JfaCalloutPlacer — jump-flood empty-void placement over a 256² typed
  grid (CPU JFA passes, Canvas2D render; M20).
- **Emergent**: PhysarumGrowth — slime-mold transport network: agents
  deposit trail, field diffuses+decays, agents steer toward the strongest
  trail (3-sensor sampling); deterministic per seed (research 04 #24).
- **Engine pilots**: AnimatedAccordion on Kobalte (Solid's Radix-
  equivalent headless layer — first deeper Animate UI rebuild);
  RoughNotation on the rough-notation engine (MIT); GlTransitionPane with
  verbatim gl-transitions GLSL (Swap, Wind); SplittingText, ConfettiBurst,
  AutoAnimateList, HighlightText, RippleButton.
- **Catalog**: gradient-gl, paper-shaders, and lenis sources wired into
  gen-docs + sidebar — 22 extras sources total.

### Changed

- License vetting refresh (LICENSE-SOURCES.md): Animate UI (MIT + Commons
  Clause) and rough-notation (MIT) approved for porting; Skiper UI marked
  conditional (Aceternity-recreation provenance); Aceternity downgraded
  to technique-only (licence forbids redistribution as a competing
  library).
- Docs compiler pinned to 0.7.6 with canonical Pages-origin base_url and
  sky accent via generated site.toml.

### Fixed

- DocSearch reverted to the last-good implementation (a parallel
  wasm/FST rewrite typed broken; re-lands only when CI-able upstream).

### QA

- Baseline v7: 434/434 frames OK across the full catalog (zero blanks);
  baseline v8 recorded post-release covering PhysarumGrowth +
  GpuHistogram frames.

## [0.1.0] — 2026-11-17

First tagged release. The library is now a product, not just a port.

### Added

- **218 react-bits components** ported component-for-component to SolidJS
  idioms (TypeScript + Tailwind), 0 PORT-NOTE markers, React-free contract
  enforced by `make contract`.
- **180 extras widgets across 12 sources**:
  - Magic UI ×40, Motion Primitives ×43, Animata ×36, tsParticles ×9,
    anime.js ×5, Kokonut ×3 ports.
  - Original widget families: OSINT ×8, SEO ×11, Instruments ×11
    (MarkovTransitionGrid, HysteresisSlider, DetentSlideRail,
    MantissaExponentSpinner, SeedBadge, DecayHaloBadge, BarycentricMixer,
    PolarDial, PhaseSpacePendulum, LangevinScrubber, VernierCaliper,
    PSDCorrelationEditor, SternBrocotStepper, HarmonicMixer, LogitSliders),
    Data ×9 (SparklineText, MonteCarloBar, BulletViolinKpi, QQBadge,
    ProfileFingerprint, HorizonStrips, FftSpectrum, ParetoFrontier,
    SpatialHashScatter, RollingWindowBrush, ACFCorrelogram, KalmanPointer,
    BitsetFacets), FX ×3 (ReactionDiffusion, DitherField, PoincareDisk),
    Emergent ×3 (BoidsFlocking, HilbertTree, SandpileQueue).
- **11 full-page scenes** composing multiple components (Hero, CTA, Stats,
  FeatureGrid, FeatureShowcase, Login, Showcase, Testimonial, TufteDoc,
  Explorable, ZeroCls).
- **`src/lib/num.ts`** — zero-Wasm numerics: mulberry32, Welford/SE,
  Beasley–Springer–Moro normal quantile, Box-Muller + exponential samplers,
  Gaussian KDE, excess kurtosis, radix-2 FFT + inverse, Hann window,
  magnitude spectrum, Pareto frontier sweep, CSR spatial hash, cyclic
  Jacobi eigen-decomposition, Kalman1D, Savitzky–Golay smoothing, SWAR
  bitset ops. **17 unit tests** in `tests/num.test.ts`.
- **`src/lib/urlState.ts`** — shareable instrument state via
  `CompressionStream('deflate-raw')` + base64url with a plain-JSON
  fallback (4 tests).
- **Starlight docs site** with live Solid islands for every component,
  sidebar navigation across all 12 extras sources, `llms.txt` full-site
  projection, and DocSearch.
- **QA harness**: `scripts/shoot.mjs` (Playwright capture with synthetic
  pointer sweeps), `scripts/scan-screenshots.py` (blank-frame classifier —
  baseline v6: 411/411 frames OK).

### Fixed

- Poincaré disk complex division (componentwise division broke at rest
  focus); SwiftShader fragment-loop miscompilation worked around with
  branchless loops.
- Batch-8 type repairs (motion overload cast, `ease` option, Solid prop
  casing), HeadingOutline createMemo import.

[0.1.0]: https://github.com/WyattAu/solid-fx/releases/tag/v0.1.0
