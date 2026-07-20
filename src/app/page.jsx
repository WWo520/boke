import HomeClient from './home-client';

// 首页数据实时渲染：每次访问都重新拉取，不使用构建时缓存
export const dynamic = 'force-dynamic';

async function fetchAPI(path) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [postsData, categoriesData, hotPostsData, tagsData, authorsData] = await Promise.all([
    fetchAPI('/api/posts?page=1&pageSize=15'),
    fetchAPI('/api/categories'),
    fetchAPI('/api/ranking/posts?limit=10&period=all'),
    fetchAPI('/api/tags'),
    fetchAPI('/api/ranking/authors?limit=50'),
  ]);

  const posts = postsData?.data || [];
  const totalPages = postsData?.pagination?.totalPages || 1;
  const categories = categoriesData?.data || [];
  const hotPosts = hotPostsData?.data || [];
  const tags = tagsData?.data || [];
  const totalPosts = postsData?.pagination?.total || 0;
  const totalUsers = authorsData?.data?.length || 0; // 真实作者数

  return (
    <HomeClient
      initialPosts={posts}
      initialTotalPages={totalPages}
      initialCategories={categories}
      initialHotPosts={hotPosts}
      initialTags={tags}
      totalPosts={totalPosts}
      totalUsers={totalUsers}
    />
  );
}
