// Demo harness for the Accordion port. Dark-stage friendly, self-contained.
// PORT-NOTE: upstream demos import ChevronDown from lucide-react; the
// identical SVG (24×24, stroke-based) is inlined here (ShiningButton precedent).
import Accordion, { AccordionContent, AccordionItem, AccordionTrigger } from './Accordion'
import { For } from 'solid-js'

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4 text-neutral-400 transition-transform duration-200 group-data-expanded:rotate-180"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const ITEMS = [
  {
    value: 'item-1',
    title: 'Can I use this in my project?',
    body: 'Yes. All components are MIT licensed and free for personal and commercial use.',
  },
  {
    value: 'item-2',
    title: 'How does it work?',
    body: 'Each item expands with a spring-driven height animation powered by motion.',
  },
  {
    value: 'item-3',
    title: 'Is it accessible?',
    body: 'Triggers are real buttons with aria-expanded, and panels collapse to zero height.',
  },
]

function AccordionDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <Accordion transition={{ duration: 0.2 }} class="w-full max-w-md">
        <For each={ITEMS}>
          {item => (
            <AccordionItem value={item.value} class="border-b border-neutral-800 last:border-b-0">
              <AccordionTrigger class="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium text-white">
                {item.title}
                <ChevronDownIcon />
              </AccordionTrigger>
              <AccordionContent>
                <p class="px-4 pb-4 text-sm text-neutral-400">{item.body}</p>
              </AccordionContent>
            </AccordionItem>
          )}
        </For>
      </Accordion>
    </div>
  )
}

export default AccordionDemo
