# PLAN.md — working ledger (uncommitted scratch; do not publish)

## solid-fx status (as of 2026-11-05 ~02:10 UTC)

- Repo: /home/wyatt/dev/src/github.com/WyattAu/solid-fx (local dir still
  named solid-bits? NO — renamed to solid-fx, matches GitHub). HEAD
  ~29584c9..e76024c lineage; latest pushed: e76024c + d812e8a/29584c9
  (markdown-exclude + a11y downgrades) + d8e81e2/… (landing StarBorder fix).
- 218/218 components ported. tsc clean (CI). Site live:
  https://wyattau.github.io/solid-fx/ (dark default planted via
  src/site/ThemeProvider.astro localStorage plant).
- Landing: src/site/Landing.astro + PageFrame.astro override
  (starlight-sites pattern) + Hero.astro suppression.
- Registry: jsrepo.config.ts (218 blocks). CI: ci.yml, deploy-docs.yml,
  sync-check.yml (weekly upstream drift), screenshots.yml (weekly baseline).

## Task table

| Task | Status | Evidence / next |
| --- | --- | --- |
| 218 ports | done | barrel = 218; CI green (run 41607421525+) |
| 8 missing demos | done | commit "fix: write 8 missing demos" |
| PORT-NOTEs 21→0 | done | `bun run contract` → markers: 0 |
| RotatingText FLIP + sync | done | commit 2f63fe2 lineage (agent work, formatted) |
| 5 interactive demos self-animate | done | src/lib/syntheticPointer.ts; 4 verified in CI shots (std 10–57) |
| CRTWarp black frame | **DOING** | Real browser also black (std 0.1) — NOT a CI artifact. Vertex shader + uniforms identical to upstream. Next: instrument the port's render loop (log uResolution/uTime per frame, check rAF actually runs, check renderer.setSize called after mount) — compare vs upstream loop lines ~340-420 in upstream CRTWarp.tsx. |
| SoftAurora black frame | **DOING** | Same symptom class as CRTWarp (0.0 std). Same instrumentation approach. Both files share the "settings memo + onMount engine" shape — check onMount actually fires (island hydration OK?) and that sizes() returns non-zero (container 0px at init → early return, never re-measured?). |
| ModelViewer empty | todo | OBJ data-URL renders empty in CI; live-browser check: OBJLoader parse + lighting black-on-black. |
| DodgeField near-blank | todo | std 3.6 — synthetic pointer amplitude/host tuning in DodgeFieldDemo.tsx. |
| Shredder timing | todo | Capture earlier or loop the shred. |
| MaskedHeading timing | todo | Check intro vs 2.5s settle. |
| AeroShards/ShapeWaves | blocked | WebGPU on CI — verify locally in WebGPU browser. |
| Magic UI pilot (extras) | todo | LICENSE-SOURCES.md row approved; port 1-2 components into src/extras/magic-ui/. |
| estate.yml | done+pushed | engineering-standards@25fdcfc (re-applied after convergence drop) |

## Environment hazards

- Box SIGTERMs builds/tsc under load; restarts kill children. Use
  `setsid nohup ... < /dev/null &` for long jobs; watch via log files.
- CI (GitHub runners) is the reliable oracle: push and `gh run watch`.
- Screenshot baseline: `gh workflow run screenshots -R WyattAu/solid-fx`,
  artifact `screenshots` (218 PNGs), pixel-scan with the Pillow snippet in
  git history ("blank frames" scan).

## Resume block v5 (2026-11-20, post-v0.2.0)

State (2026-11-20, Phase A — demand generation): 218 content + 207 extras
+ 11 scenes = 437 pages; 22 extras sources; **v0.2.0 tagged and released**.
QA baseline v8: 439/439 frames OK, zero blanks. 22 unit tests. **The
jsrepo registry is now actually installable** — it 404'd for every
consumer until 2026-11-20 (no registry.json at repo root; found by the
first end-to-end consumer test, never worked before). Manifest fixed:
bare item names (the GitHub provider matches the last path segment only;
15 extras mirrors of taken names are source-prefixed — MagicUi-,
MotionPrimitives-, Animata-, Kokonut-, TsParticles*), shared lib modules
shipped as registry items (lib/num etc., auto-wired registryDependencies),
targets landing in src/components/<Name>/ + src/lib/, freshness gated in
CI via `registry:check` (jsrepo build + git diff --exit-code). Verified
end to end in a scratch consumer: bare add + strict tsc green under
solid-js@1.9.20.

**Gates (pre-committed):**
- Phase B (consumption hardening) triggers on the first external issue or
  star. Phase C (maintenance mode — stop all widget batches, keep sync +
  QA + deps) triggers if **stars < 10 and external issues == 0 on
  2027-01-15**. Ledger: `metrics/DEMAND.md` via `scripts/traffic-snapshot.py`.
- Upstream sync SLA: new react-bits components are ported when ≥3
  accumulate or monthly, whichever first.
- **Solid 2.0 audit (now concrete):** `bun add solid-js` resolves 2.0.3
  and solid-fx blocks do NOT typecheck under it (verified 2026-11-20 —
  onMount/JSX exports differ). All blocks target 1.9.x; README documents
  the prerequisite. The 1.x→2.x compat audit is the single biggest
  maintenance workstream and gates any 1.0 release. Do NOT start it
  before a Phase B signal.
- License re-vet of the 22 sources is quarterly; next due 2027-02-20.
- Launch copy lives in `launch/LAUNCH-KIT.md` — never auto-post; every
  post goes out under WyattAu's hand after re-verifying the install
  command in a scratch dir.

Prior state: 218 content + 205 extras + 11 scenes = 434 pages; 21 extras sources
(gradient-gl ×2, paper-shaders ×3, lenis ×2 docs pages newly wired)
(12 new sources added since v0.1.0: splitting, canvas-confetti,
auto-animate, gl-transitions, animate-ui pilots)
with sidebar navigation; CI + deploy green on 24273e6 lineage; **v0.1.0 tagged**; jsrepo registry
now covers all 12 extras sources + 218 content blocks; llms.txt
projects the whole site (403 links, was content-only 218). QA baseline v5
(run 43805434440, scanned by the new scripts/scan-screenshots.py):
**399/399 OK, zero blanks** — all legacy environment classifications
obsolete (headless CI gained WebGPU + float WebGL2). shoot.mjs now captures
scenes; next screenshots run should emit 410 frames. PoincareDisk shipped
(research 04 #1 promoted watch→adopt): hyperbolic tree navigation, CPU
per-frame Möbius transforms uploaded as uniform arrays, branchless fragment
loop. License vetting refresh (2026-11-17, LICENSE-SOURCES.md): Animate UI
added (MIT + Commons Clause — same grant structure as react-bits, approved,
pilot pending), rough-notation added (MIT engine — RoughNotation pilot
shipped, TextAnimations ×1), Skiper UI added (conditional —
Aceternity-recreation provenance risk), Aceternity downgraded to
technique-only (licence forbids redistribution as a competing library),
stale statuses corrected (MP 43, Animata 36, Kokonut 3, Lenis 2 marked
Ported). LICFlowField shipped (research 04 #22 promoted — CPU LIC over typed
arrays, vortex/source/saddle field, hover tracer; fx ×6). PhysarumGrowth shipped (research 04 #24 promoted —
emergent ×4; CPU typed-array trail field, 3-sensor agents, deterministic
per seed). VaRHistogram
shipped (research 03 #67 CPU form — sorted-quantile VaR/CVaR, live
re-binning; data ×14). AnimatedAccordion shipped (Animate UI deeper pilot
flagged in the roadmap — rebuilt on Kobalte, Solid's Radix-equivalent
headless layer; animate-ui ×3). DocSearch wasm
rewrite (parallel session) reverted to last-good — half-written FST reader
typed broken; re-land when docs_search reader ships in CI-able form. Engine pilots landed (2026-11-18): SplittingText (splitting),
ConfettiBurst (canvas-confetti, ISC), AutoAnimateList (@formkit/
auto-animate FLIP), GlTransitionPane (verbatim gl-transitions Swap/Wind
GLSL), Animate UI pilots ×2 (HighlightText, RippleButton). Deps added:
splitting, canvas-confetti, @formkit/auto-animate + @types/canvas-confetti
(dev). CI lint-gate lesson: piped `| tail` masks exit codes — always echo
PIPESTATUS. Batch 16 landed: instruments +3 (PhaseSpacePendulum, LangevinScrubber,
VernierCaliper) + new emergent category ×3 (BoidsFlocking, HilbertTree,
SandpileQueue) — the T0 adopt rows from research 04.
M17-M19 complete: num kernel unit tests (17/17), 8 quant/geometry widgets
(PSD correlation editor, Stern-Brocot stepper, harmonic mixer, logit
sliders, rolling-window brush, ACF correlogram, Kalman pointer, bitset
facets), URL-state codec (src/lib/urlState.ts) wired into the PSD demo,
num kernels extended (jacobiEigen, Kalman1D, savgolSmooth, popcount/bitset
ops, ifftInPlace). M20 JFA callout placer deferred — multi-pass ping-pong
needs a focused session — **shipped 2026-11-17 as M20 (JfaCalloutPlacer,
fx ×4; baseline v6: 426/426 frames OK, new-widget std 29.9–39.7)** —
**baseline v7 (run 44537871533): 434/434 frames OK, zero blanks — a perfect
sweep matching the catalog page count exactly; every batch 16/17, M20, and
newly-wired pilot frame verified (std 29.2–66.3)** —
jump-flood distance transform over a 256² typed-array grid (8 log₂ passes,
branchless neighbor walk), CPU-side by design for determinism + headless
safety; maps 1:1 to fragment ping-pong at larger grids. **v0.1.0
announcement published** as the GitHub release notes
(https://github.com/WyattAu/solid-fx/releases/tag/v0.1.0) — distribution
milestone complete: registry + release + announcement live. Old blank
frames closed by evidence in QA-TRIAGE v5/v6 sections.

Debugging session notes (PoincareDisk black-frame hunt): (1) SwiftShader
miscompiles conditionals + conditional array reads inside fragment loops —
whole loops silently stop iterating; keep fragment loops branchless, min()
forms only, no array reads inside loop conditionals. (2) Complex division
must use the full (num·den)/|den|² form — componentwise num/den divides by
(1, −0) at rest focus and infests uniforms with Inf/NaN (JSON.stringify
renders NaN as null — that's the tell in getUniform dumps). (3) role=
"application" on a canvas is an a11y error — dropped. (4) A parallel
session's biome.json linter.rules block (preset recommended) newly errors
on noUnusedFunctionParameters/useIterableCallbackReturn/useForOf — demoted
to warn in that block.

Done since v3: Motion Primitives exhausted (43 pages), anime.js promoted
(5), tsParticles (9), Magic UI batches through 10 (40), Animata batch 8
(4), OSINT ×8 + SEO ×10 wired with docs + sidebar (gen-docs EXTRAS +
astro.config EXTRAS_GROUPS), scenes ×8, batch-8 TS repairs (motion
DOMKeyframes cast + ease option fix; WordRotate Required defaults;
autoplay/playsinline casing; FaqSchemaGen createMemo import).

Next tasks (in order):
1. Extras batch 11 — `src/extras/instruments/` per research/README roadmap:
   MarkovTransitionGrid, HysteresisSlider, DetentSlideRail,
   MantissaExponentSpinner, SeedBadge, DecayHaloBadge (T0, no new deps).
2. Extras batch 12 — `src/extras/data/`: BulletViolinKpi, QQBadge,
   ProfileFingerprint, SparklineText, HorizonStrips, MonteCarloBar.
3. `src/lib/num/` batch — seeded PRNG, Welford/P2, FFT, Kalman, oklch
   solver, blue-noise generator (enables batches 12-13).
4. Screenshots baseline v5 — verify osint/seo pages render (CI pixel scan;
   `gh workflow run screenshots -R WyattAu/solid-fx`).
5. WebGPU coverage gate — verify vgpu scenes on a WebGPU browser before
   batch 14 (fx) per research/03 watch rows.
6. Minor: Starlight prev/next pagination container renders empty (sidebar +
   search cover navigation; low priority).

Environment hazards (unchanged): box SIGTERMs builds under load; CI is the
oracle. Parallel sessions commit to this tree — always `git log` + `git
status` before staging, and expect absorb-races on shared files.


