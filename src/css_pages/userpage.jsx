import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Mail, FileText, Eye, MessageCircle, Calendar, ChevronRight, Award, TrendingUp, Users } from 'lucide-react';
import { usersApi, followApi } from '../api/client';
import FollowButton from '../components/FollowButton/FollowButton';
import styles from './UserPage.module.css';

export default function UserPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFollowed, setIsFollowed] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      usersApi.getByUsername(username),
      usersApi.getPosts(username, { page: 1, pageSize: 6 }),
    ])
      .then(([userRes, postsRes]) => {
        setUser(userRes.data);
        setPosts(postsRes.data);
        setTotalPages(postsRes.pagination?.totalPages || 1);
      })
      .catch(() => {
        navigate('/404');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, navigate]);

  useEffect(() => {
    checkFollowStatus();
  }, [user]);

  const checkFollowStatus = async () => {
    if (!user) return;
    const token = localStorage.getItem('blog_token');
    if (!token) return;
    try {
      const res = await followApi.check(user.id);
      setIsFollowed(res.data.following);
    } catch {
      setIsFollowed(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [user, page, activeTab]);

  async function fetchPosts() {
    setPostsLoading(true);
    try {
      const res = await usersApi.getPosts(username, { page, pageSize: 6 });
      if (page === 1) {
        setPosts(res.data);
      } else {
        setPosts((prev) => [...prev, ...res.data]);
      }
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }

  function handleLoadMore() {
    if (page < totalPages && !postsLoading) {
      setPage((prev) => prev + 1);
    }
  }

  const isCurrentUser = () => {
    const stored = localStorage.getItem('blog_user');
    if (!stored) return false;
    const currentUser = JSON.parse(stored);
    return currentUser.name === username;
  };

  const getLevelTitle = (level) => {
    const titles = ['萌新', '小白', '学徒', '中级', '高级', '专家', '大师', '宗师', '传奇', '神话'];
    return titles[Math.min(level - 1, titles.length - 1)];
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.avatarWrap}>
            <img src={user.avatar} alt={user.name} className={styles.avatar} />
            <span className={styles.levelBadge}>Lv.{user.level}</span>
          </div>
          <h1 className={styles.name}>{user.name}</h1>
          <div className={styles.titleRow}>
            <span className={styles.title}>{getLevelTitle(user.level)}</span>
            {user.company && <span className={styles.company}>{user.company}</span>}
            {user.location && <span className={styles.location}>{user.location}</span>}
          </div>
          {user.bio && <p className={styles.bio}>{user.bio}</p>}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.postCount || 0}</span>
              <span className={styles.statLabel}>文章</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.followersCount || 0}</span>
              <span className={styles.statLabel}>粉丝</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.followingCount || 0}</span>
              <span className={styles.statLabel}>关注</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.totalViews?.toLocaleString() || 0}</span>
              <span className={styles.statLabel}>阅读</span>
            </div>
          </div>
          <div className={styles.pointsRow}>
            <div className={styles.pointsBadge}>
              <TrendingUp size={14} />
              <span>{user.points || 0} 积分</span>
            </div>
            {!isCurrentUser() && (
              <FollowButton
                userId={user.id}
                isFollowed={isFollowed}
                onFollowChange={(following) => {
                  setIsFollowed(following);
                  setUser(prev => ({
                    ...prev,
                    followersCount: following
                      ? (prev.followersCount || 0) + 1
                      : Math.max(0, (prev.followersCount || 0) - 1)
                  }));
                }}
              />
            )}
            {isCurrentUser() && (
              <Link to={`/u/${username}/profile`} className={styles.editBtn}>
                <User size={16} />
                <span>管理我的资料</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.main}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab('posts')}
              className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
            >
              <FileText size={16} />
              <span>文章</span>
              <span className={styles.tabCount}>{user.postCount || 0}</span>
            </button>
          </div>

          {activeTab === 'posts' && (
            <>
              {postsLoading && posts.length === 0 ? (
                <div className={styles.postsLoading}>
                  <div className={styles.spinner} />
                  <span>加载中...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className={styles.empty}>
                  <FileText size={48} className={styles.emptyIcon} />
                  <p>暂无文章</p>
                </div>
              ) : (
                <div className={styles.postsGrid}>
                  {posts.map((post) => (
                    <article key={post.id} className={styles.postCard}>
                      {post.coverImage && (
                        <Link to={`/post/${post.slug}`} className={styles.postCoverWrap}>
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className={styles.postCover}
                            loading="lazy"
                          />
                        </Link>
                      )}
                      <div className={styles.postContent}>
                        <div className={styles.postMeta}>
                          {post.categoryName && (
                            <Link to={`/category/${post.categorySlug}`} className={styles.postCategory}>
                              {post.categoryName}
                            </Link>
                          )}
                          <span className={styles.postDate}>
                            <Calendar size={12} />
                            {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <h3 className={styles.postTitle}>
                          <Link to={`/post/${post.slug}`}>{post.title}</Link>
                        </h3>
                        {post.summary && <p className={styles.postSummary}>{post.summary}</p>}
                        <div className={styles.postFooter}>
                          <span className={styles.postViews}>
                            <Eye size={12} />
                            {post.views?.toLocaleString() || 0}
                          </span>
                          {post.commentCount != null && (
                            <span className={styles.postComments}>
                              <MessageCircle size={12} />
                              {post.commentCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!postsLoading && page < totalPages && (
                <button className={styles.loadMoreBtn} onClick={handleLoadMore}>
                  <span>加载更多</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </>
          )}
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>
              <Award size={16} />
              等级信息
            </h3>
            <div className={styles.levelCard}>
              <div className={styles.levelHeader}>
                <span className={styles.levelNumber}>Lv.{user.level}</span>
                <span className={styles.levelName}>{getLevelTitle(user.level)}</span>
              </div>
              <div className={styles.pointsProgress}>
                <div className={styles.pointsBar}>
                  <div
                    className={styles.pointsFill}
                    style={{ width: `${Math.min((user.points || 0) / (user.level * 100) * 100, 100)}%` }}
                  />
                </div>
                <span className={styles.pointsText}>{user.points || 0} / {user.level * 100} 积分</span>
              </div>
            </div>
          </section>

          <section className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>
              <Users size={16} />
              社交统计
            </h3>
            <div className={styles.socialStats}>
              <div className={styles.socialStat}>
                <span className={styles.socialValue}>{user.followersCount || 0}</span>
                <span className={styles.socialLabel}>粉丝</span>
              </div>
              <div className={styles.socialStat}>
                <span className={styles.socialValue}>{user.followingCount || 0}</span>
                <span className={styles.socialLabel}>关注</span>
              </div>
            </div>
          </section>

          {user.company || user.location || user.website || user.email ? (
            <section className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>联系信息</h3>
              {user.company && (
                <div className={styles.contactLink}>
                  <span className={styles.contactIcon}>🏢</span>
                  <span>{user.company}</span>
                </div>
              )}
              {user.location && (
                <div className={styles.contactLink}>
                  <span className={styles.contactIcon}>📍</span>
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className={styles.contactLink}>
                  <span className={styles.contactIcon}>🔗</span>
                  <a href={user.website} target="_blank" rel="noopener noreferrer">{user.website}</a>
                </div>
              )}
              {user.email && (
                <div className={styles.contactLink}>
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}