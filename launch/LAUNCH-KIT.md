# Launch kit (Phase A — demand generation)

Ready-to-paste posts. **Never auto-post** — every draft goes out under
WyattAu's own hand, after a read-through. Order matters: show the thing
before telling people it exists. Each post links the docs site and names
the instruments family as the differentiator; effects are the tail, not
the pitch.

Verified facts these posts rely on (2026-11-25):

- Install is two steps: drop a 9-line `jsrepo.config.ts` (paths pick
  where blocks land), then `bunx jsrepo add GpuHistogram`. Shared lib
  modules come along automatically; verified typecheck-clean in a
  scratch consumer. A bare one-liner prompts interactively (CLI doesn't
  honor registry defaults for scripted adds — documented in README).
- **Requires Solid 1.9.x** — NOT compatible with solid-js 2.x yet
  (2.0.3 is what `bun add solid-js` resolves today; the 2.x compat audit
  is open work, see PLAN).
- QA baseline v8: 439/439 captured frames render, zero blanks.
- 418 registry items: 218 react-bits ports + 195 extras + 5 shared lib
  modules. 22 extras sources. MIT + Commons-Clause.
- Known-honest limitations: Solid-only; WebGL2-with-probes (software GL
  gets static fallbacks); screenshot-based component QA.

## 1. Show HN (post first — highest signal)

Title: `Show HN: solid-fx – 400+ SolidJS components as source you own`

Body:

> I ported all of react-bits (218 components) to SolidJS — and then kept
> going with ~200 analytical widgets and effects that don't exist in any
> ecosystem I could find: coupled quant instruments (Markov transition
> grids with power-iteration stationary distributions, PSD-checked
> covariance sliders, Kalman filters you can scrub), GPU experiments that
> stay honest about what runs where, and emergent systems (Boids,
> Physarum transport networks, sandpiles).
>
> Everything installs as single-file source you copy into your repo
> (jsrepo) — a 9-line config picks where blocks land, then:
>
>     bunx jsrepo add GpuHistogram
>
> so there's no runtime dependency and no wrapper layer.
>
> Design constraints I held to: zero React imports (CI-enforced), zero
> Wasm (numerics on typed arrays in `src/lib/num.ts`, ~22 known-answer
> tests), rendering through WebGL2 fragment shaders with capability
> probes and static fallbacks. Every widget has a live demo; visual QA
> screenshot-scans the whole catalog each week (439/439 render).
>
> Docs + live demos: https://wyattau.github.io/solid-fx/
> Source: https://github.com/WyattAu/solid-fx
>
> Honest limitations: Solid-only (that's the point), requires Solid 1.9
> (2.x compat is in progress), heavy shaders fall back to stills under
> software GL. MIT + Commons Clause.
>
> Feedback most wanted on the instruments family — it's the part I think
> is genuinely new.

Notes: post Tue–Thu, 8–10am ET. First comment can mention the Poincaré
disk / LIC flow field demos as quick things to click.

## 2. r/solidjs

Title: `solid-fx: 218 react-bits components + ~200 original widgets, installed as source you own`

Body: shorter, more direct, lead with the port (that sub's perennial
ask), then instruments. Include the install one-liner, docs link, and
the Solid 1.9 note up front (v2 users will ask). Ask for the roadmap
steer: "which instruments would you actually use?"

## 3. dev.to / X crosspost

Angle: "what porting 218 components taught me about Solid vs React
idioms" — the porting story travels further than the library announcement.
Second beat: one widget deep-dive (Kalman pointer or Physarum). Link the
repo at the end.

## 4. Solid Discord (#showcase)

Two sentences + demo link. Check showcase channel norms first.

## Gates and follow-through

- Before posting: `bun run ci` green on main, docs site reachable, the
  README install command re-verified in a scratch dir (this exact test
  caught the registry 404 — re-run it).
- After posting: `python3 scripts/traffic-snapshot.py` same day, then
  weekly. The ledger is `metrics/DEMAND.md`.
- Reply latency on HN/Reddit/Discord: hours, not days — the first hour
  decides the thread.
- Phase B triggers on the first external issue/star; Phase C trigger is
  pre-committed in PLAN (see metrics/DEMAND.md header).
