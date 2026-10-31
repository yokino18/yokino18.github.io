import type { ImageMetadata } from 'astro';
import avatarImg from '../assets/avatar-xixi.png';
import wallpaperHome from '../assets/wallpaper-home-xixi.png';
import wallpaperInner from '../assets/wallpaper-inner-xixi.jpg';

export const SITE = {
  title: '涟漪之篇',
  shortName: '涟漪之篇',
  description: '欢迎来到我写的网站',
  author: '古月',
  domain: 'blog.casto.top',
  url: 'https://blog.casto.top/',
  license: 'CC BY-NC-SA 4.0',
  blogVersion: 'v0.1.0',
  hue: 350,
  defaultTheme: 'system',
  bannerHomeTitle: '涟漪之篇',
  bannerTitle: '涟漪之篇',
  subtitle: '往昔的涟漪',
  notice: '欢迎来到涟漪之篇！站点还在慢慢装修，文章和相册会陆续更新～',
  launchDate: '2026-07-01',
  github: 'https://github.com/yokino18',
  qqGroup: 'xxxxx',
  // 注意：静态站点的前端密码仅用于演示；真实发布请走 Git + CI
  writePassword: 'casto2026',
};

export const NAV = [
  { name: '主页', href: '/' },
  { name: '文章', href: '/posts/' },
  { name: '归档', href: '/archive/' },
  { name: '分类', href: '/categories/' },
  { name: '标签', href: '/tags/' },
  { name: '动态', href: '/dynamic/' },
  { name: '友链', href: '/friends/' },
  { name: '留言', href: '/guestbook/' },
  { name: '相册', href: '/gallery/' },
  { name: '追番', href: '/anime/' },
  { name: '关于我', href: '/about/' },
  { name: '链接', href: '/links/' },
];

// 壁纸/头像走 astro:assets（构建期按需裁剪、转 webp/avif）
export const WALLPAPERS = {
  home: wallpaperHome,
  inner: wallpaperInner,
};

export const AVATAR: ImageMetadata = avatarImg;

export const PROFILE = {
  name: '古月',
  avatar: avatarImg,
  bio: '记录代码与日常，偶尔追番',
};


// 社交分享图与 SEO 默认值
const siteOrigin = SITE.url.replace(/\/$/, '');
export const OG = {
  image: `${siteOrigin}/og-cover.jpg`,
  twitterCard: 'summary_large_image',
};

// 站点统计：只上报页面浏览与来源，不采集敏感信息
// 可用值: 'none' | '51la' | 'umami' | 'baidu'
export const ANALYTICS = {
  provider: 'none' as 'none' | '51la' | 'umami' | 'baidu',
  la51: { id: 'xxx', ck: 'xxx' }, // 51.la 站点 ID / Cookie 标识
  umami: { src: 'https://umami.example.com/script.js', websiteId: 'xxx' },
  baidu: { id: 'xxx' }, // hm.js?id=xxx
};

export const COMMENTS = {
  provider: 'waline' as const, // 可选 'waline' | 'local'
  // Waline 服务地址；留空时回退为本地演示评论
  serverURL: '',
};