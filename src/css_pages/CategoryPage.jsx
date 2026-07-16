import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Tag, Calendar,
  TrendingUp, Clock, ArrowUpDown,
  BookOpen, Activity,
} from 'lucide-react';
import BlogList from '../components/BlogList/BlogList';
import Sidebar from '../components/Sidebar/Sidebar';
import Pagination from '../components/Pagination/Pagination';
import { postsApi, categoriesApi } from '../api/client';
import { formatViews } from '../utils/helpers';
import styles from './CategoryPage.module.css';

const PER_PAGE = 6;

const SORT_OPTIONS = [
  { value: 'newest', label: '最新发布', icon: Clock },
  { value: 'views', label: '最多阅读', icon: TrendingUp },
  { value: 'oldest', label: '最早发布', icon: Calendar },
];

function getCategoryColor(slug) {
  const colors = {
    tech: '#2563eb', design: '#7c3aed', life: '#10b981',
    frontend: '#f59e0b', thoughts: '#ef4444',
  };
  return colors[slug] || '#2563eb';
}

function getCategoryIcon(slug) {
  const icons = {
    tech: '⚙️', design: '🎨', life: '🌿',
    frontend: '⚛️', thoughts: '💡',
  };
  return icons[slug] || '📂';
}

export default function CategoryPage() {
  const { slug, pageNum } = useParams();
  const navigate = useNavigate();
  const currentPage = parseInt(pageNum, 10) || 1;

  const [category, setCategory] = useState(null);
  const [tags, setTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sort, setSort] = useState('newest');
  const [activeTag, setActiveTag] = useState('');

  // Reset filters when category changes
  useEffect(() => {
    setSort('newest');
    setActiveTag('');
  }, [slug]);

  // Reset filters when category changes
  useEffect(() => {
    setLoading(true);
    Promise.all([
      categoriesApi.list(),
      postsApi.list({ category: slug, page: currentPage, pageSize: PER_PAGE, sort, tag: activeTag || undefined }),
    ])
      .then(([catRes, postRes]) => {
        const found = catRes.data.find((c) => c.slug === slug);
        setCategory(found || null);
        setPosts(postRes.data);
        setTotalPages(postRes.pagination.totalPages);
        setTotalPosts(postRes.pagination.total);
      })
      .catch(() => setCategory(null))
      .finally(() => setLoading(false));
  }, [slug, currentPage, sort, activeTag]);

  // Redirect invalid page
  useEffect(() => {
    if (category && pageNum && (currentPage < 1 || currentPage > totalPages)) {
      navigate(`/category/${slug}`, { replace: true });
    }
  }, [category, slug, pageNum, currentPage, totalPages, navigate]);

  function handlePageChange(page) {
    if (page === 1) navigate(`/category/${slug}`);
    else navigate(`/category/${slug}/page/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSortChange(newSort) {
    setSort(newSort);
    if (currentPage !== 1) navigate(`/category/${slug}`);
  }

  function handleTagClick(tag) {
    setActiveTag((prev) => (prev === tag ? '' : tag));
    if (currentPage !== 1) navigate(`/category/${slug}`);
  }

  const color = getCategoryColor(slug);
  const icon = getCategoryIcon(slug);

  // Tags that appear in this category (based on actual posts data)
  const categoryTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach((p) => (p.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [posts]);

  // Total views across all posts in this page
  const totalViews = useMemo(() => posts.reduce((sum, p) => sum + (p.views || 0), 0), [posts]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="page-layout">
        <main className={styles.notFound}>
          <span className={styles.notFoundIcon}>🔍</span>
          <h1>分类未找到</h1>
          <p>您访问的分类不存在或已被删除。</p>
          <Link to="/" className={styles.backHome}>
            <ArrowLeft size={18} />
            返回首页
          </Link>
        </main>
        <Sidebar />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ─── Hero ─── */}
      <section className={styles.hero} style={{ '--hero-gradient': `linear-gradient(135deg, ${color}ee 0%, ${color}88 100%)` }}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIcon}>{icon}</div>
            <div>
              <h1 className={styles.heroTitle}>{category.name}</h1>
              <p className={styles.heroDesc}>
                共 {category.count || totalPosts} 篇精选内容，等您探索
              </p>
            </div>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <BookOpen size={16} />
              <span>{category.count || totalPosts}<em>文章</em></span>
            </div>
            <div className={styles.heroStat}>
              <Activity size={16} />
              <span>{formatViews(totalViews || 0)}<em>阅读</em></span>
            </div>
            <div className={styles.heroStat}>
              <Tag size={16} />
              <span>{categoryTags.length}<em>标签</em></span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <div className="page-layout">
          <main>
            {/* ─── Breadcrumb ─── */}
            <nav className={styles.breadcrumb} aria-label="面包屑导航">
              <Link to="/" className={styles.breadcrumbLink}>首页</Link>
              <ChevronRight size={12} />
              <span className={styles.breadcrumbCurrent} style={{ color }}>{category.name}</span>
            </nav>

            {/* ─── Toolbar: Sort + Active Tag ─── */}
            <div className={styles.toolbar}>
              <div className={styles.sortGroup}>
                <ArrowUpDown size={14} className={styles.sortIcon} />
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.sortBtn} ${sort === opt.value ? styles.sortActive : ''}`}
                    onClick={() => handleSortChange(opt.value)}
                    aria-label={`按${opt.label}排序`}
                  >
                    <opt.icon size={13} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Tag Filter ─── */}
            {categoryTags.length > 0 && (
              <div className={styles.tagBar}>
                <Tag size={13} className={styles.tagBarIcon} />
                {categoryTags.map((t) => (
                  <button
                    key={t}
                    className={`${styles.tagBtn} ${activeTag === t ? styles.tagActive : ''}`}
                    onClick={() => handleTagClick(t)}
                  >
                    {t}
                  </button>
                ))}
                {activeTag && (
                  <button className={styles.tagClear} onClick={() => handleTagClick(activeTag)}>
                    清除筛选
                  </button>
                )}
              </div>
            )}

            {/* ─── Results info ─── */}
            <div className={styles.resultsInfo}>
              {activeTag ? (
                <span>标签 "<strong>{activeTag}</strong>" 下的 {totalPosts} 篇文章</span>
              ) : (
                <span>共 {totalPosts} 篇文章</span>
              )}
            </div>

            {/* ─── Post List ─── */}
            <BlogList posts={posts} emptyMessage="该分类下暂无文章" />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </main>
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
