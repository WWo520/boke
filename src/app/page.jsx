import HomeClient from './home-client';

async function fetchAPI(path) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [postsData, categoriesData, hotPostsData, tagsData, authorData] = await Promise.all([
    fetchAPI('/api/posts?page=1&pageSize=15'),
    fetchAPI('/api/categories'),
    fetchAPI('/api/ranking/posts?limit=10&period=all'),
    fetchAPI('/api/tags'),
    fetchAPI('/api/author'),
  ]);

  const posts = postsData?.data || [];
  const totalPages = postsData?.pagination?.totalPages || 1;
  const categories = categoriesData?.data || [];
  const hotPosts = hotPostsData?.data || [];
  const tags = tagsData?.data || [];
  const totalPosts = postsData?.pagination?.total || 0;
  const totalUsers = authorData?.data?.stats?.posts != null ? 1 : 0; // single-author blog

  return (
    <HomeClient
      initialPosts={posts}
      initialTotalPages={totalPages}
      initialCategories={categories}
      initialHotPosts={hotPosts}
      initialTags={tags}
      totalPosts={totalPosts}
    />
  );
}
