import CardNav from './CardNav'

function CardNavDemo() {
  return (
    <div class="flex h-96 w-full items-start justify-center overflow-hidden bg-gray-950 p-4">
      <CardNav
        logo={<span class="text-sm font-bold tracking-tight">solid·bits</span>}
        items={[
          {
            label: 'About',
            description: 'The people and the story.',
            links: [
              { label: 'Company', href: '#' },
              { label: 'Careers', href: '#' },
            ],
          },
          {
            label: 'Projects',
            description: 'Selected work.',
            links: [
              { label: 'Featured', href: '#' },
              { label: 'Case studies', href: '#' },
            ],
          },
          {
            label: 'Contact',
            description: 'Say hello.',
            links: [{ label: 'Email', href: '#' }],
          },
        ]}
        cta={{ label: 'Get started', href: '#' }}
      />
    </div>
  )
}

export default CardNavDemo
