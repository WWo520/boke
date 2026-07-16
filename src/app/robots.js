const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moke-blog.com';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/u/*/write', '/u/*/profile'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
