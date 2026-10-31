import { getCollection } from 'astro:content';
import moments from '../data/moments.json';
import { stripMarkdown, formatDate } from './utils';
import { SITE } from './site';

export type PostEntry = Awaited<ReturnType<typeof getCollection<'posts'>>>[number];

export async function getAllPosts(): Promise<PostEntry[]> {
  const posts = await getCollection('posts');
  return posts
    .filter((p) => !p.data.draft)
    .map((p) => ({ ...p, data: { ...p.data, pubDate: p.data.date ?? p.data.pubDate ?? new Date(0) } }))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function getTaxonomies(posts: PostEntry[]) {
  const categories = new Map<string, number>();
  const tags = new Map<string, number>();
  for (const p of posts) {
    categories.set(p.data.category, (categories.get(p.data.category) || 0) + 1);
    for (const t of p.data.tags) tags.set(t, (tags.get(t) || 0) + 1);
  }
  return {
    categories: [...categories.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    tags: [...tags.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

export function getArchive(posts: PostEntry[]) {
  const months = new Map<string, number>();
  for (const p of posts) {
    const key = formatDate(p.data.pubDate).slice(0, 7);
    months.set(key, (months.get(key) || 0) + 1);
  }
  return {
    months: [...months.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.label.localeCompare(a.label)),
    total: posts.length,
  };
}

export function getStats(posts: PostEntry[]) {
  const words = posts.reduce((sum, p) => {
    const body = (p as unknown as { body?: string }).body || '';
    return sum + stripMarkdown(body).length;
  }, 0);
  const launch = new Date(SITE.launchDate);
  const uptimeDays = Math.max(0, Math.floor((Date.now() - launch.getTime()) / 86400000));
  const last = posts.length ? posts[0].data.pubDate : new Date();
  const lastActivityDays = Math.max(0, Math.floor((Date.now() - last.getTime()) / 86400000));
  return {
    articles: posts.length,
    moments: moments.length,
    words,
    uptimeDays,
    lastActivityDays,
  };
}

export function getPostDates(posts: PostEntry[]): string[] {
  return posts.map((p) => formatDate(p.data.pubDate));
}
