---
title: 'Firefly 本地管理器'
description: '基于简单 HTML 文件专门为 Firefly 博客模板设计的内容管理器，支持在线写作与实时预览。'
date: 2026-05-12
category: 工具
tags: [工具, 教程]
cover: ../../assets/covers/cover-tool.jpg
---

## 这是什么

一个专门为 Firefly 博客模板设计的 **本地内容管理器**：用最简单的 HTML 文件实现，配合 Git 工作流，让你可以在线写文章、实时预览，再通过 CI 自动发布。

## 功能列表

1. 在线写文章：Markdown 编辑器 + 实时预览
2. 草稿管理：自动保存到浏览器本地，不怕误关
3. 内容结构生成：自动补全 frontmatter
4. 一键发布：保存为内容文件后推送到 Git 仓库，触发重新构建

## 使用方式

在浏览器打开 `/write/` 页面，输入密码登录（演示密码见站点配置）。

```js
// 伪代码：发布流程
async function publish(draft) {
  await writeFile(`src/content/posts/${draft.slug}.md`, draft.body);
  await gitCommit(`post: ${draft.title}`);
  await push(); // CI 自动 build & deploy
}
```

## 注意事项

> 静态站点没有真正的后端，密码登录只是前端层面的访问控制。
> 真正的发布权限掌握在 Git 仓库与部署平台手里，请妥善保管你的仓库密钥。
