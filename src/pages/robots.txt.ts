import type { APIRoute } from 'astro';

// robots.txt 由站点配置动态生成：换域名时无需再手改，Sitemap 地址自动跟随 SITE_URL
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site ?? 'https://yokino18.github.io/');
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemap.href}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
