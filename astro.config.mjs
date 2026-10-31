import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.casto.top',
  output: 'static',
  integrations: [sitemap()],
  // 悬停/聚焦时预取站内链接，切换页面几乎瞬时
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  // 卡片的图片按容器尺寸解码，省流量
  image: {
    responsiveStyles: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
      transformers: [],
    },
  },
});
