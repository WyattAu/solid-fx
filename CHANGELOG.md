# Changelog

All notable changes to solid-fx. Format follows Keep a Changelog; versions
are tagged on GitHub Releases.

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
