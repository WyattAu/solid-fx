// solid-fx SEO widget demo — original component (not a port). Free APIs: none (sample xml, no fetch).
import SitemapViz from './SitemapViz'

const SAMPLE_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://solid-fx.dev/</loc>
    <lastmod>2026-11-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://solid-fx.dev/components</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://solid-fx.dev/blog/porting-react-bits-to-solid</loc>
    <lastmod>2026-10-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://solid-fx.dev/about</loc>
    <lastmod>2026-09-02</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`

function SitemapVizDemo() {
  return (
    <div class="flex h-96 w-full items-start justify-center overflow-auto bg-gray-950 p-6">
      <div class="w-full max-w-2xl">
        <SitemapViz xml={SAMPLE_SITEMAP} />
      </div>
    </div>
  )
}

export default SitemapVizDemo
