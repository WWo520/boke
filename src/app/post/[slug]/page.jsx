import PostDetailClient from './client';

async function fetchPost(slug) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  try {
    const res = await fetch(`${baseUrl}/api/posts/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const post = await fetchPost(slug);
    if (!post) return { title: '文章未找到' };
    return {
      title: post.title,
      description: post.summary || `阅读 ${post.title} - 墨客博客`,
      openGraph: {
        title: post.title,
        description: post.summary || '',
        type: 'article',
        publishedTime: post.publishedAt,
        tags: post.tags,
        images: post.coverImage ? [{ url: post.coverImage }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.summary || '',
        images: post.coverImage ? [post.coverImage] : [],
      },
      alternates: { canonical: `/post/${slug}` },
    };
  } catch {
    return { title: '文章未找到' };
  }
}

export default async function PostDetailPage({ params }) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  return <PostDetailClient initialPost={post} slug={slug} />;
}
