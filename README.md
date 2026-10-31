# 星遐蝶梦（Firefly Blog）

基于 **Astro 7 + Tailwind CSS 4** 的个人博客静态站点，仿照 blog.casto.top 的功能与风格构建。

## 快速开始

```bash
# 安装依赖
pnpm install   # 或 npm install

# 本地开发（默认 http://localhost:4321）
pnpm dev

# 生产构建
pnpm build

# 本地预览构建产物
pnpm preview
```

> 本机若未安装 Node：可下载 [Node.js LTS 便携版](https://nodejs.org/dist/latest-v22.x/) 解压后把 `node.exe` 所在目录加入 PATH。

## 目录结构

```
src/
├── components/       # 组件（导航、卡片、侧栏小部件、客户端面板）
│   ├── client/       # 搜索面板、设置面板、音乐播放器、评论区
│   └── widgets/      # 个人简介、分类、标签、归档、动态、统计、日历、目录
├── content/
│   ├── posts/        # 文章（Markdown + frontmatter）
│   └── pages/        # 独立页面内容（如 about）
├── data/             # JSON 数据：动态、友链、相册、追番、番组、播放列表
├── layouts/          # 全局布局（导航、横幅、页脚、主题初始化）
├── lib/              # 站点配置与工具函数
├── pages/            # 路由页面
├── scripts/          # 全局客户端脚本（主题/壁纸/搜索/播放器/编辑器……）
└── styles/           # 全局样式与设计令牌（oklch + --hue 色板）
public/               # 静态资源（壁纸、占位图、头像）
```

## 写文章

在 `src/content/posts/` 新建 `.md` 文件：

```markdown
---
title: '文章标题'
description: '文章摘要'
pubDate: 2026-08-03
category: 日常
tags: [教程, Astro]
cover: /gallery/cover-firefly.svg
draft: false
---

正文……
```

也可以在 `/write/` 页面在线写作（演示密码 `casto2026`，见 `src/lib/site.ts`）。

## 修改站点信息

编辑 `src/lib/site.ts`：站名、简介、公告、GitHub、密码、主题色相等。
编辑 `src/data/` 下的 JSON：动态、友链、相册、追番、播放列表。

## 部署

静态产物在 `dist/`，可直接部署到 Vercel / Netlify / Cloudflare Pages / GitHub Pages。
绑定域名后记得同步修改 `astro.config.mjs` 的 `site` 与 `src/lib/site.ts` 的 `url`。

## 说明

- 演示版评论、写作登录、相册密码均为前端实现（localStorage / 前端校验），仅用于演示；
  生产环境建议接入 Waline/Twikoo 评论，发布走 Git + CI。
- 站点配色基于 CSS 变量 `--hue`（oklch），可在设置面板里实时换色相。

## 文档与运维

- 部署指南（Vercel / Netlify / Cloudflare Pages + 自定义域名）：[docs/deployment.md](docs/deployment.md)
- SEO 与搜索引擎收录：[/docs/seo.md](docs/seo.md)
- 评论备份与迁移（Waline / Twikoo）：[docs/comment-backup.md](docs/comment-backup.md)

常用脚本：

```bash
node scripts/optimize-images.mjs        # 压缩 public 大图并生成 src/assets 处理源
node scripts/backup-comments.mjs --help # 评论备份（详见 docs/comment-backup.md）
```