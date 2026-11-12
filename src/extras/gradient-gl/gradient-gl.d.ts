// Built with gradient-gl (github.com/metaory/gradient-gl) — MIT.
//
// Ambient declarations for the `gradient-gl` npm package (v2.1.0): it ships
// plain ESM JavaScript with no TypeScript types. Shape verified against
// `node_modules/gradient-gl/index.js` (exports `shaderIds` + default
// `boot(seed, selector)`; program methods `isMounted`, `updateSeed`,
// `destroy`).
declare module 'gradient-gl' {
  /** Live program handle returned by the default export. */
  export interface GradientGlProgram {
    /** Shader id parsed from the seed prefix (e.g. 'c1'). */
    shaderId: string
    /**
     * True while the program is active, its canvas is connected, and the
     * canvas belongs to `target` (identity check when `target` is a
     * `<canvas>`, parent check otherwise).
     */
    isMounted(target: Element): boolean
    /**
     * Re-parse a seed in place — only valid for the same shader id on the
     * same target (upstream reuse path).
     */
    updateSeed(seed: readonly [string, Uint8Array]): void
    /**
     * Free the GL program and stop its rAF loop. Library-owned canvases are
     * removed (context lost) unless `preserveCanvas` is the program's own
     * canvas; caller-provided canvases always stay in the DOM.
     */
    destroy(preserveCanvas?: HTMLCanvasElement): void
  }
  /** Seed format `{shader}.{speed}{hue}{sat}{light}` — e.g. `'c1.eba9'`. */
  export type GradientGlSeed = string
  /** Live shader id list (b1…s3), sorted. */
  export const shaderIds: string[]
  /**
   * Mount a deterministic, seed-driven gradient animation. `selector` targets
   * an element (upstream appends its own full-viewport canvas) or a
   * `<canvas>` (used in place, no DOM or style changes). Resolves after the
   * shader module loads; rejects on unknown seeds. Only one program is alive
   * per document — a second boot with a different shader destroys the first.
   */
  export default function gradientGL(
    seed: GradientGlSeed,
    selector?: string,
  ): Promise<GradientGlProgram>
}
