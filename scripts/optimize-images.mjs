// 图片优化（首次初始化用）：把根目录原始大图压缩进 public/，并复制处理源到 src/assets/
// 运行一次后，日常构建由 astro:assets 直接处理 src/assets 中的图片，无需重复执行。
// 原始大图：根目录的 昔昔..png / 昔昔1..png / 昔昔2..jpg
import sharp from 'sharp';
import { mkdirSync, copyFileSync, existsSync, rmSync, statSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => path.join(root, 'public', p);
const src = (p) => path.join(root, 'src', p);
const origin = (p) => path.join(root, p);

const jobs = [
  {
    name: '头像（原始昔昔..png -> public/昔昔.png 512px）',
    in: origin('昔昔..png'), out: pub('昔昔.png'),
    ops: (s) => s.resize(512, 512, { fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }),
  },
  {
    name: '首页壁纸（昔昔1..png -> 1920px）',
    in: origin('昔昔1..png'), out: pub('wallpapers/昔昔1.png'),
    ops: (s) => s.resize({ width: 1920, withoutEnlargement: true }).png({ compressionLevel: 9 }),
  },
  {
    name: '内页壁纸（昔昔2..jpg -> 1920px）',
    in: origin('昔昔2..jpg'), out: pub('wallpapers/昔昔2.jpg'),
    ops: (s) => s.resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }),
  },
  {
    name: 'og 封面（1200x630）',
    in: origin('昔昔2..jpg'), out: pub('og-cover.jpg'),
    ops: (s) => s.resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 80 }),
  },
];

async function replaceFile(out, buf, attempts = 4) {
  const tmp = out + '.new';
  const bak = out + '.bak';
  for (let i = 1; i <= attempts; i++) {
    try {
      writeFileSync(tmp, buf);
      if (existsSync(out)) {
        rmSync(bak, { force: true });
        renameSync(out, bak);
      }
      renameSync(tmp, out);
      rmSync(bak, { force: true });
      return;
    } catch (e) {
      if (i === attempts) throw e;
      console.log(`  (第 ${i} 次失败，稍后重试: ${e.code})`);
      await new Promise((r) => setTimeout(r, 400 * i));
    }
  }
}

for (const job of jobs) {
  if (!existsSync(job.in)) { console.log(`跳过（原始文件不存在）: ${job.in}`); continue; }
  const before = existsSync(job.out) ? statSync(job.out).size : 0;
  const buf = await job.ops(sharp(job.in)).toBuffer();
  await replaceFile(job.out, buf);
  const after = statSync(job.out).size;
  console.log(`${job.name}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}

// 同步处理源到 src/assets（astro:assets 构建时再二次压缩/转 webp）
mkdirSync(src('assets'), { recursive: true });
copyFileSync(pub('昔昔.png'), src('assets/avatar-xixi.png'));
copyFileSync(pub('wallpapers/昔昔1.png'), src('assets/wallpaper-home-xixi.png'));
copyFileSync(pub('wallpapers/昔昔2.jpg'), src('assets/wallpaper-inner-xixi.jpg'));
console.log('已同步处理源到 src/assets/');

// 清理未引用的旧占位资源（git 可恢复）
const unused = [
  pub('favicon/avatar.webp'),
  pub('wallpapers/banner-home.webp'),
  pub('wallpapers/banner-home.svg'),
  pub('wallpapers/banner.svg'),
];
for (const f of unused) {
  if (existsSync(f)) { rmSync(f); console.log('已删除未引用文件:', f); }
}