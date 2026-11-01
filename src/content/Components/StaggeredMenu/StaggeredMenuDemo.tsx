import StaggeredMenu from './StaggeredMenu';

function StaggeredMenuDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-xl bg-neutral-950">
      <StaggeredMenu
        isFixed={false}
        position="right"
        colors={['#B497CF', '#5227FF']}
        items={[
          { label: 'Home', ariaLabel: 'Go to home', link: '#' },
          { label: 'Projects', ariaLabel: 'View projects', link: '#' },
          { label: 'Contact', ariaLabel: 'Contact us', link: '#' }
        ]}
        socialItems={[
          { label: 'GitHub', link: 'https://github.com' },
          { label: 'X', link: 'https://x.com' }
        ]}
        logoUrl="https://picsum.photos/seed/staggered-menu-logo/110/24"
      />
    </div>
  );
}

export default StaggeredMenuDemo;
