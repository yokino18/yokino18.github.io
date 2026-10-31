# AGENTS.md — 项目开发约定（涟漪之篇博客）

本仓库是一个 Astro 7 + Tailwind CSS 4 静态博客。任何改动都必须遵守以下规则：

## 硬性约束

1. **保持静态架构**：不引入数据库和复杂后端。评论、写作登录、相册密码等均为前端演示实现（localStorage / 前端校验）；真实生产接入 Waline/Twikoo 等第三方服务，发布走 Git + CI。
2. **偏好设置持久化**：所有用户偏好（主题、色相、壁纸模式/轮播、卡片透明度、特效、文章布局、侧栏组件开关、播放器迷你模式等）必须写入 `localStorage`，刷新页面不能丢失；页面加载时立即应用，避免闪烁。
3. **颜色禁止写死**：颜色一律走 CSS 变量 + `oklch()`，并基于 `--hue` 推导（见 `src/styles/global.css` 的 `:root`）。禁止在组件/样式里出现 `#hex`、`rgb()/rgba()`、`white/black` 等字面色值；如需阴影/遮罩/代码块等中性色，使用 `--shadow-*`、`--scrim*`、`--code-bg/--code-fg` 等既有令牌。
4. **移动端必须可用**：导航折叠为抽屉、侧栏在窄屏隐藏、卡片单列。新增页面沿用 `grid-cols-1` + `hidden md:block / xl:block` 的响应式模式，不要破坏。
5. **按需水合**：搜索、播放器、设置面板、灯箱等交互组件的初始化必须延迟到用户触发（点击/进入视口/空闲）后再执行，不得在首屏全局脚本里急切绑定或拉取数据。全局脚本 `src/scripts/client.ts` 只保留轻量初始化；重型功能拆独立模块。
6. **构建验证**：每次代码改动后用 `pnpm build` 验证零报错（本机无 pnpm 时用 `npm run build` 等价验证）。不要留下构建报错就交付。
7. **内容与配置分离**：文章在 `src/content/posts/`（Markdown + frontmatter），友链/相册/动态/追番/番组/播放列表在 `src/data/*.json`，站点信息在 `src/lib/site.ts`。改内容只动数据文件，不改组件代码。

## 结构速览

- `src/lib/site.ts`：站点信息、导航、壁纸/头像（`astro:assets` 导入）、统计与评论配置
- `src/styles/global.css`：设计令牌（`--hue` + oklch）与全局样式
- `src/scripts/client.ts`：全局脚本（按需水合搜索/设置/灯箱）
- `src/scripts/music.ts`：音乐播放器（延迟加载模块）
- `src/assets/`：壁纸/头像处理源（构建期由 `astro:assets` 转 webp）
- `public/`：静态资源（favicon、占位图、`og-cover.jpg`、`robots.txt`）

## 常用命令

```bash
pnpm dev       # 本地开发
pnpm build     # 生产构建（验证用，产物在 dist/）
node scripts/optimize-images.mjs   # 压缩素材（首次或新增素材后）
node scripts/backup-comments.mjs   # 评论备份（见 docs/comment-backup.md）
```

文档：`docs/deployment.md`（部署）、`docs/seo.md`（SEO）、`docs/comment-backup.md`（评论备份）。