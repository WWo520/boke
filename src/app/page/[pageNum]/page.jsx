'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Eye, MessageCircle, Tag as TagIcon, Flame, TrendingUp, ArrowUp, ArrowDown, BookOpen, PenLine, Users, ArrowRight } from 'lucide-react';
import Pagination from '../../../components/Pagination/Pagination';
import { postsApi, categoriesApi, rankingApi, tagsApi, usersApi } from '../../../api/client';
import { useAuthGate } from '@/hooks/useAuthGate';
import styles from '@/css_pages/home.module.css';

const PER_PAGE = 15;

function getCatIcon(slug) {
  const icons = {
    tech: '⚙️', design: '🎨', life: '🌿',
    frontend: '⚛️', thoughts: '💡', default: '📂',
  };
  return icons[slug] || icons.default;
}

function formatViews(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default function Home() {
  const { pageNum } = useParams();
  const router = useRouter();
  const { go } = useAuthGate();
  const currentPage = parseInt(pageNum, 10) || 1;

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [postsLoading, setPostsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [hotPosts, setHotPosts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [totalStats, setTotalStats] = useState({ posts: 0, users: 0 });
  const [featuredPosts, setFeaturedPosts] = useState([]);

  useEffect(() => {
    setPostsLoading(true);
    const params = { page: currentPage, pageSize: PER_PAGE };
    if (selectedCat) params.category = selectedCat;
    postsApi.list(params)
      .then((res) => {
        setPosts(res.data);
        setTotalPages(res.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [currentPage, selectedCat]);

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data)).catch(() => {});
    rankingApi.posts({ limit: 10 }).then((res) => setHotPosts(res.data)).catch(() => {});
    tagsApi.list().then((res) => setPopularTags(res.data.slice(0, 15))).catch(() => {});
    postsApi.list({ pageSize: 3 }).then((res) => setFeaturedPosts(res.data)).catch(() => {});
    Promise.all([
      postsApi.list({ pageSize: 1 }),
      usersApi.getByUsername('admin').catch(() => ({ data: {} })),
    ]).then(([postRes, userRes]) => {
      setTotalStats({
        posts: postRes.pagination?.total || 0,
        users: 10,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pageNum && (currentPage < 1 || currentPage > totalPages)) {
      router.replace('/');
    }
  }, [pageNum, currentPage, totalPages, router]);

  const handlePageChange = (page) => {
    router.push(page === 1 ? '/' : `/page/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRankIcon = (index) => {
    if (index === 0) return <span className={styles.rankGold}>1</span>;
    if (index === 1) return <span className={styles.rankSilver}>2</span>;
    if (index === 2) return <span className={styles.rankBronze}>3</span>;
    return <span className={styles.rankNum}>{index + 1}</span>;
  };

  return (
    <div className={styles.page}>
      {/* Hero Banner */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              探索<span className={styles.heroHighlight}>技术</span>与<span className={styles.heroHighlight}>生活</span>
            </h1>
            <p className={styles.heroDesc}>
              分享技术、设计与生活的精彩内容。用心写作，传递有价值的知识。
            </p>
            <div className={styles.heroStatsRow}>
              <div className={styles.heroStat}>
                <BookOpen size={18} />
                <span className={styles.heroStatNum}>{totalStats.posts}</span>
                <span className={styles.heroStatLabel}>篇文章</span>
              </div>
              <div className={styles.heroStat}>
                <PenLine size={18} />
                <span className={styles.heroStatNum}>{categories.length}</span>
                <span className={styles.heroStatLabel}>个分类</span>
              </div>
              <div className={styles.heroStat}>
                <Users size={18} />
                <span className={styles.heroStatNum}>{totalStats.users}</span>
                <span className={styles.heroStatLabel}>位作者</span>
              </div>
            </div>
          </div>
          {/* Featured Categories */}
          <div className={styles.heroCategories}>
            {categories.slice(0, 4).map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.heroCatCard}>
                <span className={styles.heroCatIcon}>{getCatIcon(cat.slug)}</span>
                <div className={styles.heroCatInfo}>
                  <span className={styles.heroCatName}>{cat.name}</span>
                  <span className={styles.heroCatCount}>{cat.count} 篇</span>
                </div>
                <ArrowRight size={14} className={styles.heroCatArrow} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.container}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>
              <TrendingUp size={16} />
              技术分类
            </h3>
            <ul className={styles.categoryList}>
              <li>
                <Link
                  href="/"
                  className={`${styles.categoryItem} ${!selectedCat ? styles.active : ''}`}
                  onClick={() => setSelectedCat('')}
                >
                  <span className={styles.catIcon}>🔥</span>
                  <span className={styles.catName}>全部</span>
                  <span className={styles.catCount}>{totalStats.posts}</span>
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className={`${styles.categoryItem} ${selectedCat === cat.slug ? styles.active : ''}`}
                    onClick={() => setSelectedCat(cat.slug)}
                  >
                    <span className={styles.catIcon}>{getCatIcon(cat.slug)}</span>
                    <span className={styles.catName}>{cat.name}</span>
                    <span className={styles.catCount}>{cat.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>
              <TagIcon size={16} />
              热门标签
            </h3>
            <div className={styles.tagCloud}>
              {popularTags.map((tag) => (
                <Link
                  key={tag.tag}
                  href={`/search?q=${tag.tag}&type=posts`}
                  className={styles.tagLink}
                >
                  {tag.tag}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Content */}
        <main className={styles.main}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              <Flame size={18} className={styles.flameIcon} />
              {selectedCat ? '分类文章' : '最新文章'}
            </h2>
            <div className={styles.contentTabs}>
              <Link href="/" className={`${styles.tab} ${!selectedCat ? styles.tabActive : ''}`}>最新</Link>
              <Link href="/rankings" className={styles.tab}>热榜</Link>
              <Link href="/questions" className={styles.tab}>问答</Link>
            </div>
          </div>

          {postsLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>加载中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className={styles.empty}>
              <BookOpen size={48} className={styles.emptyIcon} />
              <p>暂无文章</p>
            </div>
          ) : (
            <div className={styles.postList}>
              {posts.map((post) => (
                <article key={post.slug} className={styles.postItem}>
                  <div className={styles.postLink}>
                    {post.coverImage && (
                      <Link href={`/post/${post.slug}`}>
                        <div className={styles.postCoverWrap}>
                          <img src={post.coverImage} alt={post.title} className={styles.postCover} loading="lazy" />
                        </div>
                      </Link>
                    )}
                    <div className={styles.postContent}>
                      <Link href={`/post/${post.slug}`}>
                        <h3 className={styles.postTitle}>{post.title}</h3>
                      </Link>
                      <p className={styles.postSummary}>{post.summary}</p>
                      <div className={styles.postMeta}>
                        <span onClick={() => go(`/u/${post.author?.name}`)} className={styles.authorLink} style={{ cursor: 'pointer' }}>
                          {post.author?.name}
                        </span>
                        <span className={styles.metaDot}>·</span>
                        <span><Calendar size={12} /> {formatDate(post.publishedAt)}</span>
                        <span className={styles.metaDot}>·</span>
                        <span><Eye size={12} /> {formatViews(post.views)}</span>
                        {post.commentCount != null && (
                          <>
                            <span className={styles.metaDot}>·</span>
                            <span><MessageCircle size={12} /> {post.commentCount}</span>
                          </>
                        )}
                      </div>
                      {post.tags?.length > 0 && (
                        <div className={styles.postTags}>
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className={styles.postTag}>
                              <TagIcon size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </main>

        {/* Right Sidebar */}
        <aside className={styles.rightSidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>
              <Flame size={16} className={styles.flameIcon} />
              热榜
            </h3>
            <ul className={styles.hotList}>
              {hotPosts.map((post, index) => (
                <li key={post.id} className={styles.hotItem}>
                  <div className={styles.hotRank}>{getRankIcon(index)}</div>
                  <Link href={`/post/${post.slug}`} className={styles.hotLink}>
                    <span className={styles.hotTitle}>{post.title}</span>
                    <span className={styles.hotViews}>{formatViews(post.views)}阅读</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>
              <TagIcon size={16} />
              标签排行榜
            </h3>
            <ul className={styles.tagRankList}>
              {popularTags.slice(0, 10).map((tag, index) => (
                <li key={tag.tag} className={styles.tagRankItem}>
                  <span className={styles.tagRankNum}>{index + 1}</span>
                  <Link href={`/search?q=${tag.tag}&type=posts`} className={styles.tagRankLink}>
                    {tag.tag}
                  </Link>
                  <span className={styles.tagRankCount}>{tag.count}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>
                <BookOpen size={16} />
                推荐阅读
              </h3>
              <ul className={styles.featuredList}>
                {featuredPosts.map((post) => (
                  <li key={post.id} className={styles.featuredItem}>
                    <Link href={`/post/${post.slug}`} className={styles.featuredLink}>
                      <span className={styles.featuredTitle}>{post.title}</span>
                      <span className={styles.featuredViews}>
                        <Eye size={11} /> {formatViews(post.views)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/rankings" className={styles.viewMore}>
                查看更多 <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
