import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { columnsApi } from '../api/client';
import styles from './ColumnDetail.module.css';

export default function ColumnDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [column, setColumn] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadColumn();
  }, [slug]);

  const loadColumn = async () => {
    setLoading(true);
    try {
      const res = await columnsApi.get(slug);
      setColumn(res.data);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Column error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (!column) {
    return <div className={styles.empty}>专栏不存在</div>;
  }

  return (
    <div className={styles.columnDetailPage}>
      <div className={styles.columnHeader}>
        {column.coverImage && (
          <div className={styles.coverWrapper}>
            <img src={column.coverImage} alt={column.title} className={styles.columnCover} />
          </div>
        )}
        <div className={styles.columnInfo}>
          <h1 className={styles.columnTitle}>{column.title}</h1>
          <p className={styles.columnDescription}>{column.description}</p>
          <div className={styles.columnAuthor}>
            <img src={column.author?.avatar} alt={column.author?.name} className={styles.authorAvatar} />
            <div className={styles.authorInfo}>
              <span className={styles.authorName}>{column.author?.name}</span>
              <span className={styles.authorBio}>{column.author?.bio || ''}</span>
            </div>
          </div>
          <div className={styles.columnStats}>
            <span>{posts.length} 篇文章</span>
            <span>{column.subscriberCount || 0} 订阅</span>
          </div>
        </div>
      </div>

      <div className={styles.postList}>
        <h2 className={styles.postListTitle}>专栏文章</h2>
        {posts.length === 0 ? (
          <div className={styles.empty}>暂无文章</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className={styles.postItem} onClick={() => navigate(`/post/${post.slug}`)}>
              <div className={styles.postContent}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postExcerpt}>{post.excerpt || post.content?.substring(0, 100)}</p>
                <div className={styles.postMeta}>
                  <span className={styles.postDate}>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  <span className={styles.postViews}>{post.views} 阅读</span>
                </div>
              </div>
              {post.coverImage && (
                <img src={post.coverImage} alt={post.title} className={styles.postCover} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}