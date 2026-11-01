import FlowingMenu from './FlowingMenu'
import type { FlowingMenuItem } from './FlowingMenu'

const ITEMS: FlowingMenuItem[] = [
  { text: 'About', meta: '01', marquee: 'About us' },
  { text: 'Work', meta: '02', marquee: 'Selected work' },
  { text: 'Journal', meta: '03', marquee: 'Notes & ideas' },
  { text: 'Contact', link: '#', meta: '04', marquee: 'Say hello' },
]

function FlowingMenuDemo() {
  return (
    <div class="h-96 w-full bg-gray-950">
      <FlowingMenu
        items={ITEMS}
        bgColor="#120F17"
        marqueeBgColor="#f4f4f5"
        marqueeTextColor="#120F17"
      />
    </div>
  )
}

export default FlowingMenuDemo
