// 评论数据备份脚本（Waline / Twikoo）
// 用途：定期导出评论数据为 JSON，配合 GitHub Actions 或服务器 cron 自动备份。
//
// 用法：
//   node scripts/backup-comments.mjs --service waline --server https://waline.example.com --email you@example.com --password 'xxx' --out backups/comments.json
//   node scripts/backup-comments.mjs --service waline --server https://waline.example.com --token 'xxxx' --out backups/comments.json
//   node scripts/backup-comments.mjs --service twikoo --server https://xxx.api.tcloudbase.com --token 'xxxx' --out backups/comments.json
//
// 说明：
// - Waline：先用邮箱+密码登录换取 token，再带 token 分页拉取全部评论（管理端可见全部）。
// - Twikoo：调用其管理端导出接口，token 在管理面板生成；接口路径以官方文档为准。
// - 备份文件可能包含访客昵称/邮箱/IP 等个人信息，请妥善保管并遵守隐私与合规要求。

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function flag(name, fallback = '') {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const service = (flag('service') || process.env.BACKUP_SERVICE || 'waline').toLowerCase();
const server = (flag('server') || process.env.COMMENT_SERVER || '').replace(/\/$/, '');
const email = flag('email') || process.env.COMMENT_EMAIL || '';
const password = flag('password') || process.env.COMMENT_PASSWORD || '';
const token = flag('token') || process.env.COMMENT_TOKEN || '';
const out = flag('out') || 'backups/comments.json';

if (!server) {
  console.error('缺少 --server（评论服务地址）');
  process.exit(1);
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${url}`);
  return res.json();
}

async function exportWaline() {
  let authToken = token;
  if (!authToken) {
    if (!email || !password) throw new Error('Waline 需要 --token 或 --email + --password');
    const login = await request(`${server}/api/user/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authToken = login?.token;
    if (!authToken) throw new Error('Waline 登录失败：未返回 token');
  }
  const comments = [];
  let page = 1;
  const pageSize = 100;
  for (;;) {
    const data = await request(
      `${server}/api/comment?token=${encodeURIComponent(authToken)}&page=${page}&pageSize=${pageSize}`
    );
    const items = Array.isArray(data) ? data : data?.data || [];
    comments.push(...items);
    if (items.length < pageSize) break;
    page += 1;
  }
  return comments;
}

async function exportTwikoo() {
  if (!token) throw new Error('Twikoo 需要 --token（管理面板生成）');
  // 管理端导出接口；若官方版本有变化，请以 Twikoo 文档为准调整路径与请求体
  const data = await request(`${server}/api/export`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  const items = Array.isArray(data) ? data : data?.data || [];
  return items;
}

const started = new Date();
console.log(`开始导出 ${service} 评论…`);
const items = service === 'twikoo' ? await exportTwikoo() : await exportWaline();
mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const payload = {
  service,
  server,
  exportedAt: started.toISOString(),
  count: items.length,
  comments: items,
};
writeFileSync(path.resolve(out), JSON.stringify(payload, null, 2), 'utf8');
console.log(`完成：共 ${items.length} 条评论，已保存到 ${out}`);