// Source: github.com/magicuidesign/magicui apps/www/registry/example/avatar-circles-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream demo pins GitHub profile avatars; deterministic picsum seeds keep
// the demo network-light on the dark stage.
import AvatarCircles from './AvatarCircles'

const avatars = [
  { imageUrl: 'https://picsum.photos/seed/avatar-1/80/80', profileUrl: 'https://example.com/1' },
  { imageUrl: 'https://picsum.photos/seed/avatar-2/80/80', profileUrl: 'https://example.com/2' },
  { imageUrl: 'https://picsum.photos/seed/avatar-3/80/80', profileUrl: 'https://example.com/3' },
  { imageUrl: 'https://picsum.photos/seed/avatar-4/80/80', profileUrl: 'https://example.com/4' },
  { imageUrl: 'https://picsum.photos/seed/avatar-5/80/80', profileUrl: 'https://example.com/5' },
  { imageUrl: 'https://picsum.photos/seed/avatar-6/80/80', profileUrl: 'https://example.com/6' },
]

function AvatarCirclesDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <AvatarCircles numPeople={99} avatarUrls={avatars} />
    </div>
  )
}

export default AvatarCirclesDemo
