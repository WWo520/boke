import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Eye, Clock, ArrowLeft, User, Tag, ChevronRight, Heart, Bookmark } from 'lucide-react';
import { postsApi, commentsApi, likesApi, favoritesApi } from '../api/client';
import { formatDate, formatViews, estimateReadingTime } from '../utils/helpers';
import ShareButtons from '../components/ShareButtons/ShareButtons';
import CommentSection from '../components/CommentSection/CommentSection';
import Sidebar from '../components/Sidebar/Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import styles from './PostDetail.module.css';

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

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('blog_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    postsApi.getBySlug(slug)
      .then((res) => {
        setPost(res.data);
      })
      .catch(() => {
        setPost(null);
      })
      .finally(() => setLoading(false));

    commentsApi.list(slug)
      .then((res) => setComments(res.data))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (user) {
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
      <div className="page-layout">
        <main style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
          加载中...
        </main>
        <Sidebar />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-layout">
        <main className={styles.notFound}>
          <h1>文章未找到</h1>
          <p>您要查看的文章可能已被删除或不存在。</p>
          <Link to="/" className={styles.backHome}>
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
    <div className="page-layout">
      <main>
        <article className={styles.article}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="面包屑导航">
            <Link to="/" className={styles.breadcrumbLink}>首页</Link>
            <ChevronRight size={14} />
            <Link to={`/category/${post.category.slug}`} className={styles.breadcrumbLink}>
              {post.category.name}
            </Link>
            <ChevronRight size={14} />
            <span className={styles.breadcrumbCurrent}>{post.title}</span>
          </nav>

          {/* Cover Image */}
          <div className={styles.coverWrapper}>
            <img
              src={post.coverImage}
              alt={post.title}
              className={styles.coverImage}
            />
            <span className={styles.categoryBadge} style={{ backgroundColor: getCategoryColor(post.category.slug) }}>
              {post.category.name}
            </span>
          </div>

          {/* Article Header */}
          <header className={styles.header}>
            <h1 className={styles.title}>{post.title}</h1>

            <div className={styles.meta}>
              <div className={styles.authorInfo}>
                <Link to={`/u/${post.author.name}`}>
                  <img src={post.author.avatar} alt={post.author.name} className={styles.authorAvatar} />
                </Link>
                <div>
                  <Link to={`/u/${post.author.name}`} className={styles.authorName}>
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

          {/* Article Content */}
          <div className={styles.content}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h2: ({ children }) => <h2 className={styles.contentH2}>{children}</h2>,
                h3: ({ children }) => <h3 className={styles.contentH3}>{children}</h3>,
                p: ({ children }) => <p className={styles.contentP}>{children}</p>,
                ul: ({ children }) => <ul className={styles.contentList}>{children}</ul>,
                ol: ({ children }) => <ol className={styles.contentList}>{children}</ol>,
                li: ({ children }) => <li className={styles.contentLi}>{children}</li>,
                blockquote: ({ children }) => <blockquote className={styles.contentQuote}>{children}</blockquote>,
                code: ({ className, children }) => {
                  const match = className?.match(/language-(\w+)/);
                  return (
                    <code className={`${styles.contentCode} ${className || ''}`}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <pre className={styles.contentPre}>{children}</pre>,
                table: ({ children }) => <table className={styles.contentTable}>{children}</table>,
                th: ({ children }) => <th className={styles.contentTh}>{children}</th>,
                td: ({ children }) => <td className={styles.contentTd}>{children}</td>,
                a: ({ href, children }) => (
                  <a href={href} className={styles.contentLink} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className={styles.contentStrong}>{children}</strong>,
                em: ({ children }) => <em className={styles.contentEm}>{children}</em>,
                hr: () => <hr className={styles.contentHr} />,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          <div className={styles.tags}>
            <Tag size={16} />
            {post.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>

          {/* Actions */}
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

          {/* Share */}
          <div className={styles.shareSection}>
            <ShareButtons title={post.title} slug={post.slug} />
          </div>

          {/* Navigation */}
          <nav className={styles.postNav} aria-label="文章导航">
            {post.prevPost ? (
              <Link to={`/post/${post.prevPost.slug}`} className={styles.postNavLink}>
                <ArrowLeft size={16} />
                <div>
                  <span className={styles.postNavLabel}>上一篇</span>
                  <span className={styles.postNavTitle}>{post.prevPost.title}</span>
                </div>
              </Link>
            ) : <div />}
            {post.nextPost ? (
              <Link to={`/post/${post.nextPost.slug}`} className={`${styles.postNavLink} ${styles.postNavNext}`}>
                <div>
                  <span className={styles.postNavLabel}>下一篇</span>
                  <span className={styles.postNavTitle}>{post.nextPost.title}</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            ) : <div />}
          </nav>

          {/* Comments */}
          <div className={styles.commentsSection}>
            <CommentSection slug={slug} comments={comments} />
          </div>
        </article>
      </main>
      <Sidebar />
    </div>
  );
}
