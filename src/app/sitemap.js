const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moke-blog.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export default async function sitemap() {
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/rankings`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/questions`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/columns`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  try {
    const [postRes, catRes] = await Promise.all([
      fetch(`${API_URL}/api/posts?pageSize=1000`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/api/categories`, { next: { revalidate: 300 } }),
    ]);

    const postJson = await postRes.json();
    const catJson = await catRes.json();
    const posts = postJson.data || [];
    const categories = catJson.data || [];

    const postRoutes = posts.map((post) => ({
      url: `${BASE_URL}/post/${post.slug}`,
      lastModified: new Date(post.publishedAt || post.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    const categoryRoutes = categories.map((cat) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...postRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
