import AccordionGallery from './AccordionGallery'

function AccordionGalleryDemo() {
  return (
    <div class="h-96 w-full overflow-hidden bg-gray-950 p-4">
      <AccordionGallery height={340} defaultIndex={2} />
    </div>
  )
}

export default AccordionGalleryDemo
