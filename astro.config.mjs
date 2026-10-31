import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// 站点域名可用环境变量 SITE_URL 覆盖（试运行/预览用），默认正式域名
const SITE_URL = process.env.SITE_URL || 'https://yokino18.github.io';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
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
