import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authorApi, postsApi, commentsApi, tagsApi } from '../../api/client';
import { formatDate, formatViews } from '../../utils/helpers';
import styles from './Sidebar.module.css';

function AuthorCard() {
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    authorApi.get().then((res) => setAuthor(res.data)).catch(() => {});
  }, []);

  if (!author) {
    return (
      <div className={styles.card}>
        <div className={styles.authorHeader}>
          <div className={styles.authorAvatar} style={{ background: 'var(--color-bg-tertiary)', width: 72, height: 72, borderRadius: '50%' }} />
          <div style={{ height: 20, width: '60%', background: 'var(--color-bg-tertiary)', borderRadius: 4, margin: '8px auto' }} />
          <div style={{ height: 14, width: '80%', background: 'var(--color-bg-tertiary)', borderRadius: 4, margin: '4px auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.authorHeader}>
        <img src={author.avatar} alt={author.name} className={styles.authorAvatar} />
        <h3 className={styles.authorName}>{author.name}</h3>
        <p className={styles.authorBio}>{author.bio}</p>
      </div>
      <div className={styles.authorStats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{author.stats.posts}</span>
          <span className={styles.statLabel}>文章</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{author.stats.followers}</span>
          <span className={styles.statLabel}>关注者</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{author.stats.readingTime}</span>
          <span className={styles.statLabel}>阅读</span>
        </div>
      </div>
    </div>
  );
}

function PopularPosts() {
  const [list, setList] = useState([]);

  useEffect(() => {
    postsApi.popular(5).then((res) => setList(res.data)).catch(() => {});
  }, []);

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>热门文章</h3>
      <div className={styles.popularList}>
        {list.map((post, index) => (
          <Link key={post.slug} href={`/post/${post.slug}`} className={styles.popularItem}>
            <span className={styles.rank}>{index + 1}</span>
            <div className={styles.popularContent}>
              <h4 className={styles.popularTitle}>{post.title}</h4>
              <span className={styles.popularMeta}>
                {formatViews(post.views)} 阅读
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentComments() {
  const [list, setList] = useState([]);

  useEffect(() => {
    commentsApi.recent(4).then((res) => setList(res.data)).catch(() => {});
  }, []);

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>最新评论</h3>
      <div className={styles.commentList}>
        {list.map((comment) => (
          <Link key={comment.id} href={`/post/${comment.postSlug}`} className={styles.commentItem}>
            <img
              src={comment.avatar}
              alt={comment.author}
              className={styles.commentAvatar}
              loading="lazy"
            />
            <div className={styles.commentContent}>
              <span className={styles.commentAuthor}>{comment.author}</span>
              <p className={styles.commentText}>{comment.content}</p>
              <div className={styles.commentMeta}>
                <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
                <span className={styles.commentPost}>on {comment.postTitle}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TagCloud() {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    tagsApi.list().then((res) => setTags(res.data)).catch(() => {});
  }, []);

  const maxCount = tags.length > 0 ? Math.max(...tags.map((t) => t.count)) : 1;

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>标签云</h3>
      <div className={styles.tagCloud}>
        {tags.map((tag) => {
          const weight = tag.count / maxCount;
          const size = 0.8 + weight * 0.5;
          return (
            <Link
              key={tag.tag}
              href={`/?tag=${tag.tag}`}
              className={styles.tagItem}
              style={{ fontSize: `${size}rem` }}
            >
              {tag.tag}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className={styles.sidebar} aria-label="侧边栏">
      <div className={styles.sticky}>
        <AuthorCard />
        <PopularPosts />
        <RecentComments />
        <TagCloud />
      </div>
    </aside>
  );
}
