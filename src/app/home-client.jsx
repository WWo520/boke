'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Eye, MessageCircle, Tag as TagIcon, Flame, TrendingUp, BookOpen, PenLine, Users, ArrowRight } from 'lucide-react';
import { categoriesApi, rankingApi, tagsApi, postsApi } from '../api/client';
import { useAuthGate } from '@/hooks/useAuthGate';
import styles from '@/css_pages/home.module.css';

const PER_PAGE = 15;

const catIconMap = {
  tech: '⚙️', design: '🎨', life: '🌿',
  frontend: '⚛️', thoughts: '💡',
};

function getCatIcon(slug) { return catIconMap[slug] || '📂'; }
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
const getRankIcon = (index) => {
  if (index === 0) return <span className={styles.rankGold}>1</span>;
  if (index === 1) return <span className={styles.rankSilver}>2</span>;
  if (index === 2) return <span className={styles.rankBronze}>3</span>;
  return <span className={styles.rankNum}>{index + 1}</span>;
};

export default function HomeClient({ initialPosts, initialTotalPages, initialCategories, initialHotPosts, initialTags, totalPosts, totalUsers }) {
  const router = useRouter();
  const { go } = useAuthGate();
  const [posts, setPosts] = useState(initialPosts);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [postsLoading, setPostsLoading] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [hotPosts, setHotPosts] = useState(initialHotPosts);
  const [popularTags, setPopularTags] = useState(initialTags.slice(0, 15));
  const [selectedCat, setSelectedCat] = useState('');
  const [totalStats, setTotalStats] = useState({ posts: totalPosts, users: totalUsers });

  const currentPage = 1;

  // User count is server-rendered, no extra fetch needed

  useEffect(() => {
    if (!selectedCat) return; // Initial data already loaded
    setPostsLoading(true);
    postsApi.list({ page: 1, pageSize: PER_PAGE, category: selectedCat })
      .then((res) => { setPosts(res.data); setTotalPages(res.pagination.totalPages); })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [selectedCat]);

  const handlePageChange = (page) => {
    router.push(page === 1 ? '/' : `/page/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Feel the <span className={styles.heroHighlight}>thoughts</span>.
            </h1>
            <p className={styles.heroDesc}>记录技术、设计与生活的每一次脉动。</p>
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
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}><TrendingUp size={16} />技术分类</h3>
            <ul className={styles.categoryList}>
              <li>
                <Link href="/" className={`${styles.categoryItem} ${!selectedCat ? styles.active : ''}`}
                  onClick={() => setSelectedCat('')}>
                  <span className={styles.catIcon}>🔥</span>
                  <span className={styles.catName}>全部</span>
                  <span className={styles.catCount}>{totalStats.posts}</span>
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`}
                    className={`${styles.categoryItem} ${selectedCat === cat.slug ? styles.active : ''}`}
                    onClick={() => setSelectedCat(cat.slug)}>
                    <span className={styles.catIcon}>{getCatIcon(cat.slug)}</span>
                    <span className={styles.catName}>{cat.name}</span>
                    <span className={styles.catCount}>{cat.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}><TagIcon size={16} />热门标签</h3>
            <div className={styles.tagCloud}>
              {popularTags.map((tag) => (
                <Link key={tag.tag} href={`/search?q=${tag.tag}&type=posts`} className={styles.tagLink}>{tag.tag}</Link>
              ))}
            </div>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}><Flame size={18} className={styles.flameIcon} />{selectedCat ? '分类文章' : '最新文章'}</h2>
            <div className={styles.contentTabs}>
              <Link href="/" className={`${styles.tab} ${!selectedCat ? styles.tabActive : ''}`}>最新</Link>
              <Link href="/rankings" className={styles.tab}>热榜</Link>
              <Link href="/questions" className={styles.tab}>问答</Link>
            </div>
          </div>

          {postsLoading ? (
            <div className={styles.loading}><div className={styles.spinner} /><p>加载中...</p></div>
          ) : posts.length === 0 ? (
            <div className={styles.empty}><BookOpen size={48} className={styles.emptyIcon} /><p>暂无文章</p></div>
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
                      <Link href={`/post/${post.slug}`}><h3 className={styles.postTitle}>{post.title}</h3></Link>
                      <p className={styles.postSummary}>{post.summary}</p>
                      <div className={styles.postMeta}>
                        <span onClick={() => go(`/u/${post.author?.name}`)} className={styles.authorLink} style={{ cursor: 'pointer' }}>{post.author?.name}</span>
                        <span className={styles.metaDot}>·</span>
                        <span><Calendar size={12} /> {formatDate(post.publishedAt)}</span>
                        <span className={styles.metaDot}>·</span>
                        <span><Eye size={12} /> {formatViews(post.views)}</span>
                        {post.commentCount != null && (<><span className={styles.metaDot}>·</span><span><MessageCircle size={12} /> {post.commentCount}</span></>)}
                      </div>
                      {post.tags?.length > 0 && (
                        <div className={styles.postTags}>
                          {post.tags.slice(0, 3).map((tag) => (<span key={tag} className={styles.postTag}><TagIcon size={10} />{tag}</span>))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className={styles.rightSidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}><Flame size={16} className={styles.flameIcon} />热榜</h3>
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
            <h3 className={styles.sidebarTitle}><TagIcon size={16} />标签排行榜</h3>
            <ul className={styles.tagRankList}>
              {popularTags.slice(0, 10).map((tag, index) => (
                <li key={tag.tag} className={styles.tagRankItem}>
                  <span className={styles.tagRankNum}>{index + 1}</span>
                  <Link href={`/search?q=${tag.tag}&type=posts`} className={styles.tagRankLink}>{tag.tag}</Link>
                  <span className={styles.tagRankCount}>{tag.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
