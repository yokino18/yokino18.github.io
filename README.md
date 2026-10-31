# 涟漪之篇（Firefly Blog）

基于 **Astro 7 + Tailwind CSS 4** 的个人博客静态站点，仿照 blog.casto.top 的功能与风格构建。

- 线上地址：**https://yokino18.github.io/**（GitHub Pages，推 `main` 自动构建发布）
- 仓库：https://github.com/yokino18/yokino18.github.io

## 快速开始

```bash
# 安装依赖
npm install        # 或 pnpm install

# 本地开发（默认 http://localhost:4321）
npm run dev

# 生产构建（产物在 dist/）
npm run build

# 本地预览构建产物
npm run preview
```

> 本机若未安装 Node：可下载 [Node.js LTS 便携版](https://nodejs.org/dist/latest-v22.x/) 解压后把 `node.exe` 所在目录加入 PATH。
> 想在本地模拟线上域名构建，可加环境变量：`SITE_URL=https://yokino18.github.io npm run build`。

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
├── assets/           # 构建期处理的图（头像、壁纸、covers/ 文章封面）
├── layouts/          # 全局布局（导航、横幅、页脚、主题初始化）
├── lib/              # 站点配置与工具函数
├── pages/            # 路由页面
├── scripts/          # 全局客户端脚本（主题/壁纸/搜索/播放器/编辑器……）
└── styles/           # 全局样式与设计令牌（oklch + --hue 色板）
public/               # 原样输出的静态资源（音乐、占位图、favicon、robots.txt）
.github/workflows/    # deploy.yml：推 main 自动发布到 GitHub Pages
素材归档/              # 原始美术素材（体积大，已 gitignore，不进版本库）
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
cover: ../../assets/covers/my-cover.jpg   # 相对 md 文件的路径，必须指向 src/ 里的图
draft: false
---

正文……
```

封面走 `astro:assets`：把图片放进 `src/assets/covers/`（建议 1600×800），构建时会自动生成多档 WebP，
按屏幕宽度挑一档下载。**不要**把封面放 `public/` 再用 `/gallery/xxx.jpg` 引用，那样不会被优化。

也可以在 `/write/` 页面在线写作（演示密码 `casto2026`，见 `src/lib/site.ts`）。

## 修改站点信息

编辑 `src/lib/site.ts`：站名、简介、公告、GitHub、密码、主题色相等。
编辑 `src/data/` 下的 JSON：动态、友链、相册、追番、播放列表。

## 部署

站点部署在 **GitHub Pages**，通过 GitHub Actions 自动构建发布，无需手动上传产物：

1. 仓库名必须是 `yokino18.github.io`（用户名 + `.github.io`），GitHub 才会把它当**用户站点**发布在根路径 `https://yokino18.github.io/`。
   如果换成普通仓库名，页面会落在 `/<仓库名>` 子路径，所有 `/_astro/...` 绝对路径都会 404，需要额外配置 `base`。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**（只需设置一次）。
3. 之后每次 `git push origin main` 都会触发 `.github/workflows/deploy.yml`：`npm ci` → `npm run build` → 上传 `dist` → 发布，约 40 秒完成。
4. 也可以在 repo 的 **Actions → Deploy to GitHub Pages → Run workflow** 手动触发。

### 站点域名

构建时的站点地址由环境变量 `SITE_URL` 控制（`astro.config.mjs` 读取，`src/lib/site.ts` 跟随），
默认 `https://yokino18.github.io`，`canonical` / `og:image` / `sitemap` / RSS 都会同步。

绑定自定义域名时改这几处，然后重新推送：

```bash
# 1. 新建 public/CNAME，内容为你的域名（如 blog.example.com）
# 2. .github/workflows/deploy.yml 的 env.SITE_URL 改成 https://blog.example.com
# 3. astro.config.mjs 的默认值、src/lib/site.ts 的 fallback 一并改成新域名
```

再在域名 DNS 加一条 `CNAME` 记录指向 `yokino18.github.io`（**不要开代理/CDN 代理**），
回到 Pages 设置里填 Custom domain，等校验通过后勾选 **Enforce HTTPS**。

其他托管平台（Vercel / Netlify / Cloudflare Pages）的做法见 [docs/deployment.md](docs/deployment.md)。

## 说明

- 演示版评论、写作登录、相册密码均为前端实现（localStorage / 前端校验），仅用于演示；
  生产环境建议接入 Waline/Twikoo 评论，发布走 Git + CI。
- 站点配色基于 CSS 变量 `--hue`（oklch），可在设置面板里实时换色相。

## 文档与运维

- 部署指南（**GitHub Pages（当前使用）** / Vercel / Netlify / Cloudflare Pages + 自定义域名）：[docs/deployment.md](docs/deployment.md)
- SEO 与搜索引擎收录：[/docs/seo.md](docs/seo.md)
- 评论备份与迁移（Waline / Twikoo）：[docs/comment-backup.md](docs/comment-backup.md)

## 版本控制

- 主分支 `main`，每次推送都会自动部署；建议改动前先 `git status` 确认。
- `.gitignore` 已排除 `node_modules/`、`dist/`、`.astro/`、`素材归档/`、`.preview-*.log`。
- 回滚线上版本：`git revert <commit>` 或 GitHub Actions 里重新运行某次成功的工作流。

常用脚本：

```bash
node scripts/optimize-images.mjs        # 压缩 public 大图并生成 src/assets 处理源
node scripts/backup-comments.mjs --help # 评论备份（详见 docs/comment-backup.md）
```