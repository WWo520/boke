import BlogCard from '../BlogCard/BlogCard';
import styles from './BlogList.module.css';

export default function BlogList({ posts, emptyMessage = '暂无文章' }) {
  if (!posts || posts.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <div className={styles.emptyIcon}>📝</div>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <section className={styles.list} aria-label="文章列表">
      <div className={styles.grid}>
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
