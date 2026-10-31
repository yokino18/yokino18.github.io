---
title: 'Firefly 一款清新美观的 Astro 博客主题模板'
description: 'Firefly 是一款基于 Astro 框架和 Fuwari 模板开发的清新美观且现代化的个人博客主题模板，专为技术爱好者和内容创作者设计。'
date: 2026-05-08
category: 文章示例
tags: [教程, Astro]
cover: ../../assets/covers/cover-firefly.jpg
---

## 主题简介

Firefly 是一款基于 **Astro** 框架与 **Fuwari** 模板开发的清新美观的个人博客主题模板，专为技术爱好者和内容创作者设计。它融合了现代 Web 技术栈，提供了丰富的功能模块和高度可定制的界面，让你能够轻松打造专业且美观的个人博客网站。

## 核心特性

- **静态站点**：构建后只有纯 HTML/CSS/JS，部署在任何静态托管上都很快
- **主题换肤**：基于 `--hue` 色相变量的 oklch 色板，一个滑块切换整个站点的配色
- **壁纸模式**：横幅壁纸、全屏壁纸、全屏透明、纯色背景自由切换
- **丰富组件**：音乐播放器、动态时间线、加密相册、站内搜索、在线写作……

## 快速开始

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 构建产物
pnpm build
```

### 在线预览

构建完成后运行 `pnpm preview` 即可在本地查看效果：

![Firefly 博客横幅预览](/wallpapers/banner.webp)

> 首页横幅 65vh、内页横幅 35vh，图片会自动裁剪填充。

## 目录结构

```
src/
├── components/   # 组件（导航、卡片、侧栏小部件……）
├── content/      # Markdown 内容（文章、页面）
├── data/         # JSON 数据（动态、友链、相册、追番……）
├── layouts/      # 布局
├── lib/          # 工具函数与站点配置
├── pages/        # 路由页面
└── styles/       # 全局样式与设计令牌
```

## 一点说明

> 这是一个示例文章，用来演示 Markdown 渲染效果：标题、列表、代码块、引用、表格等。

| 功能 | 说明 |
| --- | --- |
| 深色/浅色 | 支持跟随系统 |
| 站内搜索 | 纯前端全文检索 |
| RSS | `/rss.xml` 订阅 |

如果你想基于本主题二次开发，可以参考 [Astro 官方文档](https://docs.astro.build/)。
