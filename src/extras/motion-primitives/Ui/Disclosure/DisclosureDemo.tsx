// Demo harness for the Disclosure port. Dark-stage friendly, self-contained.
import { Disclosure, DisclosureContent, DisclosureTrigger } from './Disclosure'
import { For } from 'solid-js'

const FAQS = [
  {
    question: 'What is the return policy?',
    answer:
      'Every component is MIT licensed — return it any time within 30 days for a full refund, no questions asked.',
  },
  {
    question: 'Does the panel animate its height?',
    answer:
      'Yes. Expanding animates height to auto and collapsing springs back to zero, then unmounts after the exit completes.',
  },
]

function DisclosureDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <div class="w-full max-w-md space-y-2">
        <For each={FAQS}>
          {faq => (
            <Disclosure class="rounded-lg border border-neutral-800 bg-neutral-900">
              <DisclosureTrigger>
                <button class="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium text-white">
                  {faq.question}
                  <span aria-hidden="true" class="text-neutral-500">
                    +
                  </span>
                </button>
              </DisclosureTrigger>
              <DisclosureContent>
                <p class="px-4 pb-4 text-sm text-neutral-400">{faq.answer}</p>
              </DisclosureContent>
            </Disclosure>
          )}
        </For>
      </div>
    </div>
  )
}

export default DisclosureDemo
