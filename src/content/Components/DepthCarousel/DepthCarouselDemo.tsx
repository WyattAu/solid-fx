import DepthCarousel from './DepthCarousel';

function DepthCarouselDemo() {
  return (
    <div class="h-96 w-full bg-[#05060a]">
      <DepthCarousel
        items={[
          'https://picsum.photos/seed/depth1/800/1000',
          'https://picsum.photos/seed/depth2/800/1000',
          'https://picsum.photos/seed/depth3/800/1000',
          'https://picsum.photos/seed/depth4/800/1000',
          'https://picsum.photos/seed/depth5/800/1000'
        ]}
        cardWidth={260}
        cardHeight={330}
        autoplay
        showControls
        showIndicators
      />
    </div>
  );
}

export default DepthCarouselDemo;
