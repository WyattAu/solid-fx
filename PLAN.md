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

## Resume block v2 (2026-11-06, context near limit)

State: 218 + 3 extras components; site live; CI green on 33a1de1; sidebar
navigation fixed (PageFrame named-slot forwarding + explicit sidebar entries
+ slugified content ids — see commits 8c5f23e, 6bcf06f).

Next tasks (in order):
1. Visual pass on user-flagged demos: GlitchText (frameHTMLLen 2141, text
   renders — verify the glitch interval RUNS in prod), PixelTrail (canvas
   mounts; needs pointer sweep — verify autoPointer), scroll-driven ones
   (ScrollReveal/ScrollVelocity/FadeContent — verify ScrollTrigger fires on
   the docs page; if not, demos need an immediate-fire when already in view).
   Tool: scripts/debug-blanks.mjs + scripts/shoot.mjs (both committed).
2. WebGPU pair + SoftAurora + ModelViewer visual re-verify (Chrome context
   cap contaminated earlier phone tests — use a fresh profile).
3. Magic UI batch 2 (Grid Pattern, Shimmer Button) + anime.js v4 pilot per
   EXTRAS-ROADMAP.md.
4. Minor: Starlight prev/next pagination container renders empty (investigate
   sidebar-order hints).

Known-good reference: AnimatedContent/Aurora verified pixel-perfect in
deployed site + CI. GlitchText/PixelTrail confirmed mounting + hydrating in
prod (DOM evidence, 2026-11-05).
