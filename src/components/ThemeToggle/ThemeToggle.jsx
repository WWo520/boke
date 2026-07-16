'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('blog_theme');
    const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('blog_theme', isDark ? 'dark' : 'light');
  }, [isDark, mounted]);

  if (!mounted) {
    return (
      <button className={styles.toggle} aria-label="切换主题" title="切换主题">
        <Sun size={18} className={styles.icon} />
      </button>
    );
  }

  return (
    <button
      className={styles.toggle}
      onClick={() => setIsDark(!isDark)}
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      {isDark ? (
        <Sun size={18} className={styles.icon} />
      ) : (
        <Moon size={18} className={styles.icon} />
      )}
    </button>
  );
}