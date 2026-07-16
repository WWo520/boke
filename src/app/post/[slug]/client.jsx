'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Eye, Clock, ArrowLeft, User, Tag, ChevronRight, Heart, Bookmark } from 'lucide-react';
import { postsApi, commentsApi, likesApi, favoritesApi } from '../../../api/client';
import { formatDate, formatViews, estimateReadingTime } from '../../../utils/helpers';
import ShareButtons from '../../../components/ShareButtons/ShareButtons';
import CommentSection from '../../../components/CommentSection/CommentSection';
import Sidebar from '../../../components/Sidebar/Sidebar';
import dynamic from 'next/dynamic';

const MarkdownContent = dynamic(
  () => import('../../../components/MarkdownRenderer'),
  { ssr: false }
);
import styles from '@/css_pages/PostDetail.module.css';

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

export default function PostDetailClient({ initialPost, slug: propSlug }) {
  const paramsSlug = useParams();
  const slug = propSlug || paramsSlug?.slug;
  const [post, setPost] = useState(initialPost || null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(!initialPost);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('blog_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;

    if (!initialPost) {
      setLoading(true);
      postsApi.getBySlug(slug)
        .then((res) => { setPost(res.data); })
        .catch(() => { setPost(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    commentsApi.list(slug)
      .then((res) => setComments(res.data))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (user && slug) {
      likesApi.getStatus(slug).then((res) => {
        setLiked(res.data.liked);
        setLikeCount(res.data.count);
      }).catch(() => {});
      favoritesApi.getStatus(slug).then((res) => {
        setFavorited(res.data.favorited);
        setFavoriteCount(res.data.count);
      }).catch(() => {});
    }
  }, [user, slug]);

  const handleLike = () => {
    if (!user) return;
    likesApi.toggle(slug).then((res) => {
      setLiked(res.data.liked);
      setLikeCount(res.data.count);
    }).catch(() => {});
  };

  const handleFavorite = () => {
    if (!user) return;
    favoritesApi.toggle(slug).then((res) => {
      setFavorited(res.data.favorited);
      setFavoriteCount(res.data.count);
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className={`page-layout ${styles.pageLayout}`}>
        <main className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>加载中...</span>
        </main>
        <Sidebar />
      </div>
    );
  }

  if (!post) {
    return (
      <div className={`page-layout ${styles.pageLayout}`}>
        <main className={styles.notFound}>
          <h1>文章未找到</h1>
          <p>您要查看的文章可能已被删除或不存在。</p>
          <Link href="/" className={styles.backHome}>
            <ArrowLeft size={18} />
            返回首页
          </Link>
        </main>
        <Sidebar />
      </div>
    );
  }

  const readTime = estimateReadingTime(post.content);

  return (
    <div className={`page-layout ${styles.pageLayout}`}>
      <main>
        <article className={styles.article}>
          <nav className={styles.breadcrumb} aria-label="面包屑导航">
            <Link href="/" className={styles.breadcrumbLink}>首页</Link>
            <ChevronRight size={14} />
            <Link href={`/category/${post.category.slug}`} className={styles.breadcrumbLink}>
              {post.category.name}
            </Link>
            <ChevronRight size={14} />
            <span className={styles.breadcrumbCurrent}>{post.title}</span>
          </nav>

          <div className={styles.coverWrapper}>
            <img
              src={post.coverImage}
              alt={post.title}
              className={styles.coverImage}
            />
            <div className={styles.coverOverlay} />
            <span className={styles.categoryBadge} style={{ backgroundColor: getCategoryColor(post.category.slug) }}>
              {post.category.name}
            </span>
          </div>

          <header className={styles.header}>
            <h1 className={styles.title}>{post.title}</h1>

            <div className={styles.meta}>
              <div className={styles.authorInfo}>
                <Link href={`/u/${post.author.name}`}>
                  <img src={post.author.avatar} alt={post.author.name} className={styles.authorAvatar} />
                </Link>
                <div className={styles.authorInfoText}>
                  <Link href={`/u/${post.author.name}`} className={styles.authorName}>
                    {post.author.name}
                  </Link>
                  <div className={styles.metaDetails}>
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
                      <span>{readTime} 分钟阅读</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className={styles.content}>
            <MarkdownContent content={post.content} styles={styles} />
          </div>

          <div className={styles.tags}>
            <Tag size={16} />
            {post.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${liked ? styles.actionBtnActive : ''}`}
              onClick={handleLike}
              aria-label={liked ? '取消点赞' : '点赞'}
              disabled={!user}
            >
              <Heart size={18} className={liked ? styles.actionIconFilled : ''} />
              <span>{likeCount}</span>
            </button>
            <button
              className={`${styles.actionBtn} ${favorited ? styles.actionBtnActive : ''}`}
              onClick={handleFavorite}
              aria-label={favorited ? '取消收藏' : '收藏'}
              disabled={!user}
            >
              <Bookmark size={18} className={favorited ? styles.actionIconFilled : ''} />
              <span>{favoriteCount}</span>
            </button>
          </div>

          <div className={styles.shareSection}>
            <ShareButtons title={post.title} slug={post.slug} />
          </div>

          <nav className={styles.postNav} aria-label="文章导航">
            {post.prevPost ? (
              <Link href={`/post/${post.prevPost.slug}`} className={styles.postNavLink}>
                <ArrowLeft size={16} />
                <div>
                  <span className={styles.postNavLabel}>上一篇</span>
                  <span className={styles.postNavTitle}>{post.prevPost.title}</span>
                </div>
              </Link>
            ) : <div />}
            {post.nextPost ? (
              <Link href={`/post/${post.nextPost.slug}`} className={`${styles.postNavLink} ${styles.postNavNext}`}>
                <div>
                  <span className={styles.postNavLabel}>下一篇</span>
                  <span className={styles.postNavTitle}>{post.nextPost.title}</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            ) : <div />}
          </nav>

          <div className={styles.commentsSection}>
            <CommentSection slug={slug} comments={comments} />
          </div>
        </article>
      </main>
      <Sidebar />
    </div>
  );
}
