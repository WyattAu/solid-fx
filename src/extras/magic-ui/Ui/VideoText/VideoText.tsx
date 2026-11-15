// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/video-text.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.

import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

export interface VideoTextProps {
  /**
   * The video source URL
   */
  src: string
  /**
   * Additional className for the container
   */
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  /**
   * Whether to autoplay the video
   */
  autoPlay?: boolean
  /**
   * Whether to mute the video
   */
  muted?: boolean
  /**
   * Whether to loop the video
   */
  loop?: boolean
  /**
   * Whether to preload the video
   */
  preload?: 'auto' | 'metadata' | 'none'
  /**
   * The content to display (will have the video "inside" it)
   */
  children: JSX.Element
  /**
   * Font size for the text mask (in viewport width units)
   * @default 20
   */
  fontSize?: string | number
  /**
   * Font weight for the text mask
   * @default "bold"
   */
  fontWeight?: string | number
  /**
   * Text anchor for the text mask
   * @default "middle"
   */
  textAnchor?: string
  /**
   * Dominant baseline for the text mask
   * @default "middle"
   */
  dominantBaseline?: string
  /**
   * Font family for the text mask
   * @default "sans-serif"
   */
  fontFamily?: string
  /**
   * The element type to render for the text
   * @default "div"
   */
  // PORT-NOTE: upstream accepts any React ElementType; the Solid port
  // supports intrinsic tag names only (rendered through `Dynamic`).
  as?: string
}

export const VideoText = (props: VideoTextProps) => {
  const [own] = splitProps(props, [
    'src',
    'children',
    'class',
    'className',
    'autoPlay',
    'muted',
    'loop',
    'preload',
    'fontSize',
    'fontWeight',
    'textAnchor',
    'dominantBaseline',
    'fontFamily',
    'as',
  ])

  const fontSize = () => own.fontSize ?? 20
  const fontWeight = () => own.fontWeight ?? 'bold'
  const textAnchor = () => own.textAnchor ?? 'middle'
  const dominantBaseline = () => own.dominantBaseline ?? 'middle'
  const fontFamily = () => own.fontFamily ?? 'sans-serif'
  const autoPlay = () => own.autoPlay ?? true
  const muted = () => own.muted ?? true
  const loop = () => own.loop ?? true
  const preload = () => own.preload ?? 'auto'
  const as = () => own.as ?? 'div'

  // Upstream: React.Children.toArray(children).join("").
  // PORT-NOTE: Solid children are DOM nodes, not strings — only string
  // children can be embedded in the SVG text mask, so non-strings are
  // dropped (upstream demos pass text only).
  const content = (): string => {
    const children = own.children
    if (typeof children === 'string') return children
    if (Array.isArray(children)) {
      return children.filter(part => typeof part === 'string').join('')
    }
    return ''
  }

  const [svgMask, setSvgMask] = createSignal('')

  const buildSvgMask = (): string => {
    const responsiveFontSize = typeof fontSize() === 'number' ? `${fontSize()}vw` : fontSize()
    return `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><text x='50%' y='50%' font-size='${responsiveFontSize}' font-weight='${fontWeight()}' text-anchor='${textAnchor()}' dominant-baseline='${dominantBaseline()}' font-family='${fontFamily()}'>${content()}</text></svg>`
  }

  const updateSvgMask = () => setSvgMask(buildSvgMask())

  // Upstream useEffect on [content, fontSize, fontWeight, textAnchor,
  // dominantBaseline, fontFamily].
  createEffect(() => {
    updateSvgMask()
  })

  onMount(() => {
    window.addEventListener('resize', updateSvgMask)
    onCleanup(() => window.removeEventListener('resize', updateSvgMask))
  })

  const dataUrlMask = createMemo(() => `url("data:image/svg+xml,${encodeURIComponent(svgMask())}")`)

  return (
    <Dynamic
      component={as()}
      class={`relative size-full ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {/* Create a container that masks the video to only show within text */}
      <div
        class="absolute inset-0 flex items-center justify-center"
        style={{
          'mask-image': dataUrlMask(),
          '-webkit-mask-image': dataUrlMask(),
          'mask-size': 'contain',
          '-webkit-mask-size': 'contain',
          'mask-repeat': 'no-repeat',
          '-webkit-mask-repeat': 'no-repeat',
          'mask-position': 'center',
          '-webkit-mask-position': 'center',
        }}
      >
        <video
          ref={videoEl => {
            // PORT-NOTE: Solid sets `muted` as an attribute, which some
            // browsers ignore for autoplay policy — set the property too.
            if (muted()) videoEl.muted = true
          }}
          class="h-full w-full object-cover"
          autoplay={autoPlay()}
          muted={muted()}
          loop={loop()}
          preload={preload()}
          playsinline
        >
          <source src={own.src} />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Add a backup text element for SEO/accessibility */}
      <span class="sr-only">{content()}</span>
    </Dynamic>
  )
}

export default VideoText
