// Source: github.com/codse/animata animata/progress/animatedtimeline.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: React useState maps to createSignal (functional setState keeps the
// same no-op-when-unchanged semantics; returning the same object skips the
// update). The events .map renders via <For>; React style objects use camelCase
// and are rewritten with hyphenated CSS properties (Solid contract). Upstream
// merges classes with cn(); this port template-joins, equivalent for the plain
// strings passed here.
import type { JSX } from 'solid-js'
import { createSignal, For } from 'solid-js'

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  date?: string
  [key: string]: unknown // Allow additional custom fields
}

interface TimelineStyles {
  lineColor: string
  activeLineColor: string
  dotColor: string
  activeDotColor: string
  dotSize: string
  titleColor: string
  activeTitleColor: string
  descriptionColor: string
  dateColor: string
}

const DOT_DURATION = 0.12
const LINE_DURATION = 0.15
const STAGGER = 0.08
const LINE_OFFSET = 0.04

function computeDelays(
  index: number,
  active: number | null,
  prev: number | null,
): { dotDelay: number; lineDelay: number } {
  const a = active ?? -1
  const p = prev ?? -1

  // Extending: top-to-bottom cascade from the previous frontier
  if (a > p) {
    if (p < 0) {
      return { dotDelay: index * STAGGER, lineDelay: index * STAGGER + LINE_OFFSET }
    }
    return {
      dotDelay: index > p ? (index - p) * STAGGER : 0,
      lineDelay: index === p ? 0 : index > p ? (index - p) * STAGGER + LINE_OFFSET : 0,
    }
  }

  // Retracting: bottom-to-top reverse cascade
  if (a < p) {
    return {
      dotDelay: index <= p && index > a ? (p - index) * STAGGER : 0,
      lineDelay: index >= Math.max(a, 0) && index < p ? (p - 1 - index) * STAGGER + LINE_OFFSET : 0,
    }
  }

  return { dotDelay: 0, lineDelay: 0 }
}

interface TimelineItemProps {
  event: TimelineEvent
  index: number
  isDotActive: boolean
  isLineActive: boolean
  isLast: boolean
  dotDelay: number
  lineDelay: number
  onEnter: () => void
  onClick?: () => void
  styles: TimelineStyles
  customRender?: (event: TimelineEvent) => JSX.Element
}

function TimelineItem(props: TimelineItemProps) {
  return (
    <div
      class="flex last:mb-0"
      onMouseEnter={() => props.onEnter()}
      onFocus={() => props.onEnter()}
      onClick={props.onClick}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          props.onClick?.()
        }
      }}
    >
      <div class="relative mr-4 flex flex-col items-center">
        <div
          class={`absolute bottom-0 top-0 w-1 ${props.isLast ? 'hidden' : 'block'}`}
          style={{ 'background-color': props.styles.lineColor }}
        >
          <div
            class="h-full w-full"
            style={{
              'background-color': props.styles.activeLineColor,
              transform: props.isLineActive ? 'scaleY(1)' : 'scaleY(0)',
              'transform-origin': 'top',
              'transition-property': 'transform',
              'transition-duration': `${LINE_DURATION}s`,
              'transition-delay': `${props.lineDelay}s`,
              'transition-timing-function': 'ease-in-out',
            }}
          />
        </div>
        <div
          class="relative z-10 rounded-full border-4"
          style={{
            width: props.styles.dotSize,
            height: props.styles.dotSize,
            'border-color': props.isDotActive ? props.styles.activeDotColor : props.styles.dotColor,
            'background-color': props.isDotActive
              ? props.styles.activeDotColor
              : 'hsl(var(--background))',
            transform: props.isDotActive ? 'scale(1.2)' : 'scale(1)',
            'transition-property': 'background-color, border-color, transform',
            'transition-duration': `${DOT_DURATION}s`,
            'transition-delay': `${props.dotDelay}s`,
            'transition-timing-function': 'ease',
          }}
        />
      </div>
      <div class={`grow leading-5 ${!props.isLast ? 'mb-3' : ''}`}>
        {props.customRender ? (
          props.customRender(props.event)
        ) : (
          <>
            <h3
              class="text-lg font-semibold"
              style={{
                color: props.isDotActive ? props.styles.activeTitleColor : props.styles.titleColor,
                'transition-property': 'color',
                'transition-duration': `${DOT_DURATION}s`,
                'transition-delay': `${props.dotDelay}s`,
              }}
            >
              {props.event.title}
            </h3>
            <p style={{ color: props.styles.descriptionColor }}>{props.event.description}</p>
            <span class="text-sm" style={{ color: props.styles.dateColor }}>
              {props.event.date}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

interface AnimatedTimelineProps {
  events: TimelineEvent[]
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  styles?: Partial<TimelineStyles>
  customEventRender?: (event: TimelineEvent) => JSX.Element
  onEventHover?: (event: TimelineEvent | null) => void
  onEventClick?: (event: TimelineEvent) => void
  initialActiveIndex?: number
}

const defaultStyles: TimelineStyles = {
  lineColor: '#d1d5db',
  activeLineColor: '#22c55e',
  dotColor: '#d1d5db',
  activeDotColor: '#22c55e',
  dotSize: '1.5rem',
  titleColor: 'inherit',
  activeTitleColor: '#22c55e',
  descriptionColor: 'inherit',
  dateColor: 'inherit',
}

export function AnimatedTimeline(props: AnimatedTimelineProps) {
  const [state, setState] = createSignal<{ active: number | null; prev: number | null }>({
    active: props.initialActiveIndex ?? null,
    prev: null,
  })

  const setActive = (index: number | null) => {
    setState(s => (s.active === index ? s : { active: index, prev: s.active }))
    props.onEventHover?.(index !== null ? props.events[index] : null)
  }

  return (
    <div
      class={`relative py-4 ${props.class ?? ''} ${props.className ?? ''}`}
      onMouseLeave={() => setActive(null)}
    >
      <For each={props.events}>
        {(event, index) => (
          <TimelineItem
            event={event}
            index={index()}
            isDotActive={state().active !== null && index() <= (state().active ?? -1)}
            isLineActive={state().active !== null && index() < (state().active ?? 0)}
            isLast={index() === props.events.length - 1}
            dotDelay={computeDelays(index(), state().active, state().prev).dotDelay}
            lineDelay={computeDelays(index(), state().active, state().prev).lineDelay}
            onEnter={() => setActive(index())}
            onClick={props.onEventClick ? () => props.onEventClick?.(event) : undefined}
            styles={{ ...defaultStyles, ...(props.styles ?? {}) }}
            customRender={props.customEventRender}
          />
        )}
      </For>
    </div>
  )
}

interface AnimatedTimelinePageProps {
  events?: TimelineEvent[]
  title?: string
  containerClassName?: string
  timelineStyles?: Partial<TimelineStyles>
  customEventRender?: (event: TimelineEvent) => JSX.Element
  onEventHover?: (event: TimelineEvent | null) => void
  onEventClick?: (event: TimelineEvent) => void
  initialActiveIndex?: number
}

export default function AnimatedTimelinePage(props: AnimatedTimelinePageProps) {
  const DefaultEvents: TimelineEvent[] = [
    { id: '1', title: 'Event 1', description: 'Description 1', date: '2023-01-01' },
    { id: '2', title: 'Event 2', description: 'Description 2', date: '2023-02-01' },
    { id: '3', title: 'Event 3', description: 'Description 3', date: '2023-03-01' },
  ]

  return (
    <div
      class={`container mx-auto rounded-lg bg-background px-8 pt-6 text-foreground ${props.containerClassName ?? ''}`}
    >
      <h1 class="text-2xl font-bold">{props.title || 'Timeline'}</h1>
      <AnimatedTimeline
        events={props.events || DefaultEvents}
        class="max-w-2xl"
        styles={props.timelineStyles}
        customEventRender={props.customEventRender}
        onEventHover={props.onEventHover}
        onEventClick={props.onEventClick}
        initialActiveIndex={props.initialActiveIndex}
      />
    </div>
  )
}
