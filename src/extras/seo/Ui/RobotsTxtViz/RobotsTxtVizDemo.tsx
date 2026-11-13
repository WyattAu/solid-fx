// solid-fx SEO widget demo — original component (not a port). Free APIs: none (sample text, no fetch).
import RobotsTxtViz from './RobotsTxtViz'

const SAMPLE_ROBOTS = `# robots.txt for solid-fx.dev
User-agent: *
Disallow: /admin
Disallow: /preview/
Crawl-delay: 1

User-agent: Googlebot
User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /*.pdf$

Sitemap: https://solid-fx.dev/sitemap.xml
Sitemap: https://solid-fx.dev/blog-sitemap.xml`

function RobotsTxtVizDemo() {
  return (
    <div class="flex h-96 w-full items-start justify-center overflow-auto bg-gray-950 p-6">
      <div class="w-full max-w-2xl">
        <RobotsTxtViz text={SAMPLE_ROBOTS} />
      </div>
    </div>
  )
}

export default RobotsTxtVizDemo
