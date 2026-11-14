// Source: demo harness derived from github.com/codse/animata animata/progress/animatedtimeline.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import { AnimatedTimeline, type TimelineEvent } from './AnimatedTimeline'

const EVENTS: TimelineEvent[] = [
  { id: '1', title: 'Kickoff', description: 'Scope and milestones agreed', date: '2026-01-05' },
  { id: '2', title: 'Alpha', description: 'First internal build', date: '2026-02-14' },
  { id: '3', title: 'Beta', description: 'Public feedback round', date: '2026-03-30' },
  { id: '4', title: 'Launch', description: 'Shipped to everyone', date: '2026-05-01' },
]

function AnimatedTimelineDemo() {
  return (
    <div class="w-full rounded-lg border border-gray-800 bg-gray-950 p-6">
      <AnimatedTimeline
        events={EVENTS}
        initialActiveIndex={1}
        onEventClick={(event) => console.log('clicked', event.id)}
      />
    </div>
  )
}

export default AnimatedTimelineDemo
