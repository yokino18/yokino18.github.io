import type { APIContext } from 'astro';
import { getAllPosts } from '../lib/stats';
import { formatDate, stripMarkdown } from '../lib/utils';

export async function GET(context: APIContext) {
  const posts = await getAllPosts();
  const items = posts.map((post) => ({
    slug: post.id,
    title: post.data.title,
    description: post.data.description || '',
    body: stripMarkdown((post as unknown as { body?: string }).body || '').slice(0, 3000),
    tags: post.data.tags,
    category: post.data.category,
    pubDate: formatDate(post.data.pubDate),
  }));
  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
