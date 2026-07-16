import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { searchApi } from '../api/client';
import BlogCard from '../components/BlogCard/BlogCard';
import Pagination from '../components/Pagination/Pagination';
import styles from './Search.module.css';

export default function Search() {
  const { query } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [results, setResults] = useState({ posts: [], users: [], tags: [] });
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (q, page = 1) => {
    if (!q || q.trim().length < 2) return;
    setLoading(true);
    try {
      if (activeTab === 'posts') {
        const res = await searchApi.posts(q, { page, pageSize: 10 });
        setResults(prev => ({ ...prev, posts: res.data }));
        setPagination(res.pagination);
      } else if (activeTab === 'users') {
        const res = await searchApi.users(q, { page, pageSize: 10 });
        setResults(prev => ({ ...prev, users: res.data }));
        setPagination(res.pagination);
      } else if (activeTab === 'tags') {
        const res = await searchApi.tags(q);
        setResults(prev => ({ ...prev, tags: res.data }));
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/${searchQuery.trim()}`);
    }
  };

  const handlePageChange = (page) => {
    performSearch(searchQuery, page);
  };

  const tabs = [
    { key: 'posts', label: '文章', count: pagination.total },
    { key: 'users', label: '用户', count: results.users.length },
    { key: 'tags', label: '标签', count: results.tags.length },
  ];

  return (
    <div className={styles.searchPage}>
      <div className={styles.searchHeader}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章、用户、标签..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>搜索</button>
        </form>
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              performSearch(searchQuery, 1);
            }}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
          >
            {tab.label}
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : !searchQuery ? (
          <div className={styles.empty}>请输入搜索关键词</div>
        ) : activeTab === 'posts' ? (
          results.posts.length > 0 ? (
            <>
              <div className={styles.postList}>
                {results.posts.map(post => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
              {pagination.total > pagination.pageSize && (
                <Pagination
                  current={pagination.page}
                  total={pagination.totalPages}
                  onChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className={styles.empty}>没有找到相关文章</div>
          )
        ) : activeTab === 'users' ? (
          results.users.length > 0 ? (
            <div className={styles.userList}>
              {results.users.map(user => (
                <div key={user.id} className={styles.userCard} onClick={() => navigate(`/u/${user.name}`)}>
                  <img src={user.avatar} alt={user.name} className={styles.userAvatar} />
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {user.name}
                      <span className={styles.userLevel}>Lv.{user.level}</span>
                    </div>
                    <p className={styles.userBio}>{user.bio || '暂无简介'}</p>
                    <div className={styles.userStats}>
                      <span>{user.postCount || 0} 文章</span>
                      <span>{user.followersCount || 0} 粉丝</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>没有找到相关用户</div>
          )
        ) : (
          results.tags.length > 0 ? (
            <div className={styles.tagList}>
              {results.tags.map(tag => (
                <span key={tag.tag} className={styles.tag}>
                  {tag.tag}
                  <span className={styles.tagCount}>{tag.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>没有找到相关标签</div>
          )
        )}
      </div>
    </div>
  );
}