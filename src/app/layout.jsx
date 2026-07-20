import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar/navbar';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: {
    default: 'PulseBeat - Feel the thoughts',
    template: '%s | PulseBeat',
  },
  description: 'Feel the thoughts. 记录技术、设计与生活的每一次脉动。',
  keywords: ['技术博客', '前端开发', '生活随笔', '编程学习', 'PulseBeat'],
  authors: [{ name: 'PulseBeat' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'PulseBeat',
    title: 'PulseBeat - Feel the thoughts',
    description: 'Feel the thoughts. 记录技术、设计与生活的每一次脉动。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseBeat - Feel the thoughts',
    description: 'Feel the thoughts. 记录技术、设计与生活的每一次脉动。',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
