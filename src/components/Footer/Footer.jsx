'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Github, Twitter, Linkedin, Heart, Activity } from 'lucide-react';
import { categoriesApi } from '../../api/client';
import styles from './Footer.module.css';

export default function Footer() {
  const [categories, setCategories] = useState([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <Activity size={22} />
              <span>PulseBeat</span>
            </Link>
            <p className={styles.description}>
              Feel the thoughts. 记录技术、设计与生活的每一次脉动。
            </p>
            <div className={styles.socialLinks}>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="mailto:702639128@qq.com" className={styles.socialLink} aria-label="发送邮件">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>分类</h3>
            <ul className={styles.linkList}>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className={styles.link}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>快速链接</h3>
            <ul className={styles.linkList}>
              <li><Link href="/" className={styles.link}>首页</Link></li>
              <li><Link href="/about" className={styles.link}>关于我们</Link></li>
              <li><a href="#privacy" className={styles.link}>隐私政策</a></li>
              <li><a href="#terms" className={styles.link}>服务条款</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>联系我们</h3>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <Mail size={16} />
                <span>702639128@qq.com</span>
              </li>
              <li className={styles.contactItem}>
                <Heart size={16} />
                <span>期待你的来信</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {currentYear} PulseBeat. All rights reserved.
          </p>
          <p className={styles.tagline}>
            Built with <Heart size={14} className={styles.heartIcon} /> by PulseBeat
          </p>
        </div>
      </div>
    </footer>
  );
}
