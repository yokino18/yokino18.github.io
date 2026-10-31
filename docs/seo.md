# SEO 配置与搜索引擎收录

## 已内置的 SEO 能力

- **每篇文章自动生成社交分享标签**（在 `src/layouts/BaseLayout.astro` 统一输出）：
  - `og:title` / `og:description` / `og:url` / `og:image` / `og:type`（文章页为 `article`）
  - `twitter:card = summary_large_image` 及 `twitter:title/description/image`
  - `canonical` 规范链接、`article:published_time`、WebSite / BlogPosting 的 JSON-LD 结构化数据
- **Sitemap**：`@astrojs/sitemap` 已启用，构建后生成 `/sitemap-index.xml`（含全部页面）。
- **RSS**：`/rss.xml` 已生成（站名/简介/文章标题/摘要/日期/分类/标签）。
- **robots.txt**：`public/robots.txt` 已允许抓取并声明 sitemap 地址。

## 上线前检查清单

1. `astro.config.mjs` 的 `site` 与 `src/lib/site.ts` 的 `SITE.domain/url` 已是正式域名（当前为 `https://yokino18.github.io/`）。
2. 默认分享图 `public/og-cover.jpg` 可访问：`https://yokino18.github.io/og-cover.jpg`。
3. 构建后本地抽查：
   ```bash
   curl -I https://yokino18.github.io/sitemap-index.xml
   curl -I https://yokino18.github.io/rss.xml
   curl -I https://yokino18.github.io/robots.txt
   curl https://yokino18.github.io/robots.txt   # 应包含 Sitemap 行
   ```
4. 用社交调试器检查分享卡片是否正常（Facebook Sharing Debugger / X Card Validator / 微信 JSSDK 分享调试），重点看 `og:image` 是否为可访问的绝对地址且非 SVG。

## 提交收录步骤

### Google（搜索份额最大，优先做）
1. 打开 [Google Search Console](https://search.google.com/search-console) → 添加资源。
2. 选择「**网址前缀**」输入 `https://yokino18.github.io/`，用 HTML 文件或 meta 标签验证
   （`github.io` 的 DNS 不归你管，用不了「网域」验证；等以后绑了自有域名再改用 DNS TXT 验证）。
3. 验证通过后，在「Sitemap」提交：`https://yokino18.github.io/sitemap-index.xml`。
4. 用「网址检查」工具对首页和一两篇文章发起「请求编入索引」，加速首次收录。

### Bing（可同步 Google）
1. [Bing Webmaster Tools](https://www.bing.com/webmasters) 支持「从 Google Search Console 导入」，GSC 验证后一键导入。
2. 或在「站点地图」处直接提交 `https://yokino18.github.io/sitemap-index.xml`。

### 百度（国内站建议做）
1. 打开 [百度搜索资源平台](https://ziyuan.baidu.com/) → 添加站点 `yokino18.github.io`。
2. 验证方式选「HTML 标签」或「文件验证」，按提示把验证代码放到 `<head>` 中（可临时加在 `src/layouts/BaseLayout.astro`，验证完成后删除）。
3. 提交 sitemap：百度对 XML sitemap 兼容度一般，可用「普通收录 → sitemap」提交 `https://yokino18.github.io/sitemap-index.xml`，并多用「手动提交 URL」提交新文章。
4. 想更主动的话开通「API 推送」：在 CI（GitHub Actions）里构建后把新 URL 推送到百度收录 API（需要准入），或用「快速收录」提交。

### 其他
- 搜狗 / 360 / 神马：通常提交 sitemap 即可，流量占比小，按需处理。
- 也可在 RSS 提交平台（如 Feedburner / 即刻聚合）登记 `/rss.xml`，帮助内容扩散。

## 常见问题

- **收录慢**：新站正常，坚持更新 + 内部链接（文章互链、归档/标签页）+ 外部引荐，比反复提交更有效。
- **og:image 不显示**：必须是绝对 URL、可公开访问、尺寸建议 1200×630、不要用 SVG。
- **sitemap 报错**：先确认 `site` 配置与线上域名完全一致（含 https 与末尾斜杠）。
- **首页和文章 URL 冲突**：文章 URL 以 `/posts/文章名/` 结尾斜杠；避免同时存在不带斜杠的重复页面。
- **改域名后**：旧域名保留 301 到新域名一段时间，再在 GSC 里做「地址更改」工具。