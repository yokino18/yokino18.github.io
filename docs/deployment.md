# 部署指南

本博客是 Astro 7 静态站点，构建产物在 `dist/`，可部署到任意静态托管平台。以下分别说明 **Vercel、Netlify、Cloudflare Pages** 的部署步骤与自定义域名 `blog.xxx.top` 的绑定方法（把 `xxx` 换成你的域名主体）。

## 0. 前置准备（通用）

- 本地环境：Node.js 22+，包管理器 pnpm 或 npm。
- 把仓库推送到 GitHub（三家平台都支持从 Git 仓库导入）。
- 部署前把站点域名改对（否则 sitemap / og 标签 / RSS 里的 URL 不对）：
  - `astro.config.mjs`：`site: 'https://blog.xxx.top'`
  - `src/lib/site.ts`：`SITE.domain` 与 `SITE.url` 改成正式域名
- 构建命令统一为：`pnpm build`（无 pnpm 时用 `npm run build`），输出目录 `dist`。
- 建议在平台环境变量里加 `ASTRO_TELEMETRY_DISABLED=1`，避免构建时上报遥测。
- 若使用 pnpm，建议把 `package-lock.json` 换为 `pnpm-lock.yaml`（删掉前者，跑一次 `pnpm install` 生成），平台会优先按锁文件安装。

## 1. 部署到 Vercel

1. 打开 [vercel.com](https://vercel.com) → **Add New… → Project** → 导入你的 Git 仓库。
2. Framework Preset 会自动识别 **Astro**（若没有则手动选 Astro）。
   - Build Command：`pnpm build`（或 `npm run build`）
   - Output Directory：`dist`
3. 在 Settings → General 里把 **Node.js Version** 设为 22。
4. 添加环境变量：`ASTRO_TELEMETRY_DISABLED=1`。
5. 点 **Deploy**，几分钟后得到 `https://<项目名>.vercel.app`。

**绑定 blog.xxx.top**
1. 项目 → **Settings → Domains** → 输入 `blog.xxx.top` → Add。
2. 按提示在你的域名注册商处加 DNS 记录（二选一）：
   - `CNAME`：`blog` → `cname.vercel-dns.com`
   - 或 `A` 记录：`blog` → `76.76.21.21`
3. 等待解析生效（一般几分钟），Vercel 自动签发 HTTPS 证书并强制跳转。

## 2. 部署到 Netlify

1. 打开 [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → 选择 Git 仓库。
2. 构建配置：
   - Build command：`pnpm build`（或 `npm run build`）
   - Publish directory：`dist`
3. Settings → Build & deploy → Environment 中设置 `ASTRO_TELEMETRY_DISABLED=1`，并把 Node 版本切到 22（可在 Netlify 的 `netlify.toml` 里写 `[build.environment] NODE_VERSION = "22"`）。
4. 部署完成后得到 `https://<站点名>.netlify.app`。

**绑定 blog.xxx.top**
1. 站点 → **Domain settings → Add a domain** → 输入 `blog.xxx.top`。
2. DNS 解析（任选）：
   - `CNAME`：`blog` → `<你的站点名>.netlify.app`
   - 或 `A` 记录：`blog` → `75.2.60.5`
3. 在 Domain settings → HTTPS 里开启 **Force HTTPS**，Netlify 会自动配证书。

## 3. 部署到 Cloudflare Pages

1. 打开 Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**。
2. 选仓库，框架预设选 **Astro**（自动填好构建命令）。
   - Build command：`pnpm build`
   - Build output directory：`dist`
   - 若构建 Node 版本不对，在 **Settings → Environment variables** 加 `NODE_VERSION = 22`。
3. 保存并部署，得到 `https://<项目名>.pages.dev`。

**绑定 blog.xxx.top**（域名最好也托管在 Cloudflare，最省事）
1. Pages 项目 → **Custom domains → Set up a custom domain** → 输入 `blog.xxx.top`。
2. 若域名已托管在 Cloudflare：会自动添加 CNAME 记录（`blog` → `<项目名>.pages.dev`），秒级生效。
3. 若域名在其他注册商：手动在注册商处把 DNS 改为 Cloudflare 提供的两个 NS（先把域名托管迁移到 Cloudflare），或加 `CNAME blog → <项目名>.pages.dev`。
4. SSL/TLS 建议用 **Full**，Cloudflare 自动签发证书。

## 4. 自定义域名通用要点

- 根域（`xxx.top`）和 `www.xxx.top`、`blog.xxx.top` 三者的跳转关系建议固定成一套：例如让 `www` 301 到 `blog`，避免 SEO 权重分散。
- 绑定后务必**重新构建部署一次**，让 `site`、`SITE.url`、og 标签、sitemap、RSS 里的域名全部变为新域名。
- 部署完成后验证：
  ```bash
  curl -I https://blog.xxx.top/sitemap-index.xml
  curl -I https://blog.xxx.top/rss.xml
  curl -I https://blog.xxx.top/robots.txt
  curl -I https://blog.xxx.top/og-cover.jpg
  ```
- 缓存问题：更新部署后若旧内容未刷新，可在平台「Clear cache / Purge」后重试。

## 5. 构建产物大小与压缩建议

当前构建产物（`dist/`）约 **6-7 MB**，其中主要是壁纸/头像的 webp 与压缩后的静态图。更进一步的建议：

- **图片**：本项目壁纸/头像已走 `astro:assets`（构建期裁剪 + 转 webp），文章/相册封面当前为 SVG 占位图，换成真实照片后请直接放入 `src/assets/` 或使用 `<Image>` 组件，避免原图直接进 `public/`。
- **传输压缩**：Vercel / Netlify / Cloudflare Pages 均默认对文本类资源启用 gzip/brotli，无需额外配置；若自建 Nginx，请开启 `gzip` / `brotli` 并把 `_astro/` 目录设为长缓存（`Cache-Control: public, max-age=31536000, immutable`）。
- **字体**：当前使用系统字体栈，无自托管字体，已是最优；若日后引入 woff2，建议按需子集化。
- **JS**：播放器脚本已拆分为独立懒加载 chunk；主脚本约 50KB，如继续优化可把搜索索引改为按需加载。
- 可用 `npx astro build` 后用任意目录大小工具复查；如果单张图片仍偏大，优先降低 `quality` 或缩小输出宽度。