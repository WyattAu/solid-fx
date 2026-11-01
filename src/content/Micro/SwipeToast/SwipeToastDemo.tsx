import SwipeToast from './SwipeToast';

function SwipeToastDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-gray-950 p-8 text-white">
      <SwipeToast
        inline
        title="Deployment complete"
        description="solid-bits@1.4.0 is live on production."
        actionLabel="View"
        duration={12000}
      />
    </div>
  );
}

export default SwipeToastDemo;
