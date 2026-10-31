# 部署指南

本博客是 Astro 7 静态站点，构建产物在 `dist/`。当前正式发布方式是 **GitHub Pages + GitHub Actions**
（线上地址 <https://yokino18.github.io/>），第 1、2 节讲这套流程；Vercel / Netlify / Cloudflare Pages
作为备选方案列在第 3–5 节。

## 0. 前置准备（通用）

- 本地环境：Node.js 22+，包管理器用 npm（仓库里是 `package-lock.json`，CI 也走 `npm ci`）。
- **站点域名只在一个地方配置**：环境变量 `SITE_URL`。
  - `astro.config.mjs` 读 `process.env.SITE_URL`，默认 `https://yokino18.github.io`
  - `src/lib/site.ts` 的 `url` / `domain` 从 `import.meta.env.SITE` 推导，不再手写
  - `canonical`、`og:image`、`sitemap-index.xml`、RSS 里的链接都会跟着变
- 构建命令：`npm run build`，输出目录 `dist/`。
- 建议加 `ASTRO_TELEMETRY_DISABLED=1`，避免构建时上报遥测。
- 部署前自检：

  ```bash
  SITE_URL=https://你的域名 npm run build
  grep -o 'rel="canonical" href="[^"]*"' dist/index.html
  ```

## 1. 部署到 GitHub Pages（当前方案）

1. **仓库名必须是 `<用户名>.github.io`**（本项目是 `yokino18.github.io`）。
   GitHub 只把这个名字的仓库当**用户站点**，发布在根路径 `https://<用户名>.github.io/`。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**（只需设置一次）。
3. 之后 `git push origin main` 即触发 `.github/workflows/deploy.yml`：
   `actions/checkout` → `setup-node@22` → `npm ci` → `npm run build` → `upload-pages-artifact` → `deploy-pages`。
4. 手动触发：**Actions → Deploy to GitHub Pages → Run workflow**。
5. 验证：

   ```bash
   curl -I https://yokino18.github.io/
   curl -I https://yokino18.github.io/sitemap-index.xml
   curl -I https://yokino18.github.io/rss.xml
   ```

> ⚠️ 如果仓库名不是 `<用户名>.github.io`（项目站点），页面会发布在 `/<仓库名>` 子路径下，
> 此时必须给 `astro.config.mjs` 加 `base: '/<仓库名>'`，并且把所有写死的 `/music/...`、`/gallery/...`、
> `/favicon/...` 改成带 `base` 的路径——成本很高，不推荐。要自定义仓库名就配自定义域名（见下一节）。

## 2. 绑定自定义域名（GitHub Pages）

前提：能修改该域名的 DNS（Cloudflare、阿里云、腾讯云均可）。

1. **DNS**：加一条记录

   | 类型 | 主机记录 | 值 | 代理 |
   |---|---|---|---|
   | CNAME | 子域（如 `blog`） | `yokino18.github.io` | **关闭（Cloudflare 灰云）** |

   > 橙色云（代理）会让 GitHub 的域名校验和证书签发失败，务必 DNS only。根域用 A 记录指向
   > `185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`。

2. **代码**（四处一起改，否则 canonical/OG 会指向旧域名）：

   ```bash
   # 1) 新建 public/CNAME，内容为域名本身
   echo "blog.example.com" > public/CNAME
   # 2) .github/workflows/deploy.yml 的 env.SITE_URL
   # 3) astro.config.mjs 里 SITE_URL 的默认值
   # 4) src/lib/site.ts 里 fallback 域名
   ```

3. **GitHub**：Settings → Pages → Custom domain 填域名 → Save → 等 DNS 校验通过（几分钟）
   → 勾 **Enforce HTTPS**（证书签发通常 1–30 分钟）。

注意：GitHub Pages 一个仓库只能绑一个自定义域名；绑定后 `yokino18.github.io` 会 301 跳到该域名。
换域名/换 NS 时旧记录先别删，确认新站可用再清理。

## 3. 部署到 Vercel

1. 打开 [vercel.com](https://vercel.com) → **Add New… → Project** → 导入 Git 仓库。
2. Framework Preset 自动识别 **Astro**（没有就手动选）。
   - Build Command：`npm run build`
   - Output Directory：`dist`
3. Settings → General 把 **Node.js Version** 设为 22。
4. 环境变量加 `ASTRO_TELEMETRY_DISABLED=1`（要绑域名再加 `SITE_URL`）。
5. 点 **Deploy**，得到 `https://<项目名>.vercel.app`。

**绑定自定义域名**：Settings → Domains → 输入域名 → 按提示加 DNS：
`CNAME 子域 → cname.vercel-dns.com`（或 `A 子域 → 76.76.21.21`），证书自动签发。

## 4. 部署到 Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**。
2. Build command `npm run build`，Publish directory `dist`。
3. 环境变量 `ASTRO_TELEMETRY_DISABLED=1`；Node 版本在 `netlify.toml` 里写
   `[build.environment] NODE_VERSION = "22"`。
4. **域名**：Domain settings → Add a domain → `CNAME 子域 → <站点名>.netlify.app`，
   然后在 HTTPS 里开 **Force HTTPS**。

## 5. 部署到 Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**。
2. 框架预设选 **Astro**；Build command `npm run build`，输出 `dist`；
   Node 版本不对时加环境变量 `NODE_VERSION = 22`。
3. 得到 `https://<项目名>.pages.dev`。
4. **域名**（域名已托管在 Cloudflare 时最省事）：Custom domains → Set up a custom domain，
   会自动加 `CNAME 子域 → <项目名>.pages.dev`；SSL/TLS 模式选 **Full**。

## 6. 自定义域名通用要点

- 根域、`www`、子域之间的跳转关系固定成一套（例如 `www` 301 到子域），避免权重分散。
- 绑定后**重新构建部署一次**，让 `site`、`SITE.url`、og 标签、sitemap、RSS 全部换成新域名。
- 缓存：更新后旧内容没刷新，先在平台侧 Purge / 等 CDN TTL 过期再排查。
- 验证清单：

  ```bash
  curl -I https://你的域名/
  curl -I https://你的域名/sitemap-index.xml
  curl -I https://你的域名/rss.xml
  curl -I https://你的域名/robots.txt
  ```

## 7. 构建产物大小与压缩建议

当前 `dist/` 约 **23 MB**，构成：

| 部分 | 大小 |
|---|---|
| `public/music` 三首 `.ogg` | ≈ 19 MB |
| 壁纸 / 头像（`astro:assets` 转的 webp） | ≈ 1.5 MB |
| 文章封面多档 WebP | ≈ 0.6 MB |
| HTML + CSS + JS | ≈ 0.5 MB |

建议：

- **音乐**是体积大头。想减小可以：降低码率（128k → 96k）、改用 `.m4a`/`.opus`、或把音频放到对象存储/CDN，
  `src/data/playlist.json` 里直接写外链即可。
- **图片**：壁纸、头像、文章封面都已走 `astro:assets`（构建期裁剪 + 多档 WebP + srcset），
  新图放 `src/assets/`，不要在 `public/` 里堆原图。
- **文本压缩**：GitHub Pages / Vercel / Netlify / Cloudflare Pages 都默认 gzip/brotli，无需配置；
  自建 Nginx 请开 `gzip` 并给 `_astro/` 设长缓存。
- **字体**：当前用系统字体栈，无自托管字体，已是最优。
