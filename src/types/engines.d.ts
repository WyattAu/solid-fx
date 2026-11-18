// Minimal ambient declarations for the three engine deps that ship no types.
// Only the API surface solid-fx uses is declared.

declare module 'splitting' {
  interface SplittingResult {
    target: HTMLElement
    chars?: HTMLElement[]
    words?: HTMLElement[]
    lines?: HTMLElement[]
  }
  interface SplittingOptions {
    target?: Element | string
    by?: 'chars' | 'words' | 'lines' | 'items'
    whitespace?: boolean
  }
  function splitting(targets?: unknown, options?: SplittingOptions): SplittingResult[]
  export default splitting
  export { splitting as Splitting }
}
