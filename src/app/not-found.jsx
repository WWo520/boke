'use client';
import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from '@/css_pages/NotFound.module.css';

export default function NotFound() {
  return (
    <div className="page-layout">
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.errorCode}>404</div>
          <h1 className={styles.title}>页面未找到</h1>
          <p className={styles.description}>
            抱歉，您访问的页面不存在或已被移除。
            <br />
            请检查网址是否正确，或返回首页浏览其他内容。
          </p>
          <div className={styles.actions}>
            <Link href="/" className={styles.primaryBtn}>
              <Home size={18} />
              返回首页
            </Link>
            <button
              className={styles.secondaryBtn}
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={18} />
              返回上页
            </button>
          </div>
        </div>
      </main>
      <Sidebar />
    </div>
  );
}
