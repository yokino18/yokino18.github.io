# 评论数据备份与迁移

本项目评论组件支持 Waline / Twikoo（见 `src/lib/site.ts` 的 `COMMENTS`）。评论数据都存在第三方服务端，**不在站点仓库内**，因此需要定期备份，防止误删、服务故障或换服务商时丢失。

## 一、导出方式

### Waline
- **方式 A：管理面板导出（推荐手动用）**
  登录 Waline 管理面板（`https://你的服务地址/ui/`，邮箱 + 密码），进入「评论管理」→ 列表下方/页面上有**导出**按钮，可下载 JSON 或 CSV。
- **方式 B：脚本自动化导出**
  本仓库提供 `scripts/backup-comments.mjs`，用邮箱 + 密码（或管理 token）拉取全部评论：
  ```bash
  node scripts/backup-comments.mjs \
    --service waline \
    --server https://waline.example.com \
    --email you@example.com --password '你的密码' \
    --out backups/comments.json
  # 或直接给 token：
  node scripts/backup-comments.mjs --service waline --server https://waline.example.com --token 'xxxx' --out backups/comments.json
  ```
- **方式 C：数据库级导出**
  Waline 数据存于 LeanCloud（或 CloudBase）。在 LeanCloud 控制台 → 数据存储 → 选择表（如 `Comment`）→ 导出；CloudBase 控制台同理导出集合。此方式最完整，包含评论正文、昵称、邮箱、IP、UA 等原始字段。

### Twikoo
- **方式 A：管理面板导出**
  登录 Twikoo 管理面板（需管理员密码/Token），在「数据管理」→「导出数据」下载 JSON。
- **方式 B：脚本导出**
  ```bash
  node scripts/backup-comments.mjs \
    --service twikoo \
    --server https://你的envId.api.tcloudbase.com \
    --token '管理Token' \
    --out backups/comments.json
  ```
  > 接口路径可能随官方版本变化，若调用失败请以 [Twikoo 官方文档](https://twikoo.js.org/) 为准调整 `scripts/backup-comments.mjs` 中的请求。
- **方式 C：数据库级导出**
  腾讯云开发控制台 → 数据库 → 找到 `twikoo` 集合 → 导出为 JSON，最完整可靠。

## 二、定时自动备份

仓库已内置 GitHub Actions 工作流 `.github/workflows/backup-comments.yml`：
1. 把仓库推到 GitHub。
2. 在仓库 Settings → Secrets 中添加：
   - `WALINE_SERVER`、`WALINE_TOKEN`（Waline）；或 `TWIKOO_SERVER`、`TWIKOO_TOKEN`（Twikoo）。
3. 工作流每周日 03:00（UTC）自动导出并把 `backups/` 提交回仓库，也可手动触发（Actions 页面 Run workflow）。

服务器自有 cron 同样可以：每天把脚本跑一遍，把 `backups/` 同步到对象存储或私有 Git 仓库。

## 三、迁移到新实例

1. 先完整导出（建议用方式 C 数据库级导出）。
2. 新服务端部署好后：
   - **Waline**：在管理面板使用「导入」功能导入导出的 JSON（字段需匹配官方格式），或直接把 LeanCloud/CloudBase 导出的数据导入新环境的数据表。
   - **Twikoo**：把导出 JSON 导入新 CloudBase 环境的 `twikoo` 集合（导入前建议清空测试数据）。
3. 修改 `src/lib/site.ts` 中 `COMMENTS.serverURL` 指向新服务地址，重新构建部署。
4. 迁移后抽样核对：评论数一致、匿名评论归属正确、嵌套回复层级完整。

## 四、注意事项
- 备份文件含访客昵称、邮箱、IP、UA 等**个人信息**，请限制访问（私有仓库/加密存储），并遵守当地隐私法规。
- Token/密码不要写进仓库，一律用环境变量或 CI Secrets。
- 建议同时备份评论服务端的**密钥/配置**（LeanCloud appId/appKey、Twikoo 环境变量），否则即使有数据也读不出来。