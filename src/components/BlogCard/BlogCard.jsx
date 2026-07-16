'use client';
import { memo } from 'react';
import Link from 'next/link';
import { Calendar, Eye, Clock, ArrowRight } from 'lucide-react';
import { formatDate, formatViews, estimateReadingTime } from '../../utils/helpers';
import styles from './BlogCard.module.css';

function BlogCard({ post }) {
  const readTime = estimateReadingTime(post.content || post.summary || '');

  return (
    <article className={styles.card}>
      <Link href={`/post/${post.slug}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <img
            src={post.coverImage}
            alt={post.title}
            className={styles.image}
            loading="lazy"
          />
          <span className={styles.category} style={{ backgroundColor: getCategoryColor(post.category.slug) }}>
            {post.category.name}
          </span>
        </div>
      </Link>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Calendar size={14} />
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </span>
          <span className={styles.metaItem}>
            <Eye size={14} />
            <span>{formatViews(post.views)} 阅读</span>
          </span>
          <span className={styles.metaItem}>
            <Clock size={14} />
            <span>{readTime} 分钟</span>
          </span>
        </div>

        <Link href={`/post/${post.slug}`} className={styles.titleLink}>
          <h2 className={styles.title}>{post.title}</h2>
        </Link>

        <p className={styles.summary}>{post.summary}</p>

        <div className={styles.tags}>
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.author}>
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className={styles.authorAvatar}
              loading="lazy"
            />
            <span className={styles.authorName}>{post.author.name}</span>
          </div>

          <Link href={`/post/${post.slug}`} className={styles.readMore}>
            <span>阅读更多</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function getCategoryColor(slug) {
  const colors = {
    tech: '#2563eb',
    design: '#7c3aed',
    life: '#10b981',
    frontend: '#f59e0b',
    thoughts: '#ef4444',
  };
  return colors[slug] || '#2563eb';
}

export default memo(BlogCard);
