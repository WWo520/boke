import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar/navbar';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: {
    default: '墨客博客 - 探索技术与生活',
    template: '%s | 墨客博客',
  },
  description: '分享技术、设计与生活的精彩内容。用心写作，传递有价值的知识。',
  keywords: ['技术博客', '前端开发', '生活随笔', '编程学习', '墨客博客'],
  authors: [{ name: '墨客' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '墨客博客',
    title: '墨客博客 - 探索技术与生活',
    description: '分享技术、设计与生活的精彩内容。用心写作，传递有价值的知识。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '墨客博客 - 探索技术与生活',
    description: '分享技术、设计与生活的精彩内容。用心写作，传递有价值的知识。',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
