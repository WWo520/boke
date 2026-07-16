import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, MessageSquare, FolderOpen,
  Trash2, Plus, Edit2, X, CheckCircle, AlertCircle, Loader2,
  ArrowLeft, BarChart2, Eye, Calendar, ChevronRight, Search,
  RefreshCw,
} from 'lucide-react';
import { adminApi, categoriesApi } from '../api/client';
import { useToast } from '../components/Toast/Toast';
import styles from './Admin.module.css';

export default function Admin() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsStatus, setPostsStatus] = useState('');
  const [deletingPostId, setDeletingPostId] = useState(null);

  const [comments, setComments] = useState([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', color: '#2563eb', icon: 'BookOpen' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('blog_user') || 'null');
    if (!user || user.role !== 'admin') {
      addToast('需要管理员权限', 'error');
      navigate('/', { replace: true });
      return;
    }
  }, [navigate, addToast]);

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'posts') fetchPosts();
    if (activeTab === 'comments') fetchComments();
    if (activeTab === 'categories') fetchCategories();
  }, [activeTab]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await adminApi.stats();
      setStats(res.data);
    } catch (err) {
      addToast(err.message || '获取统计数据失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPosts() {
    setLoading(true);
    try {
      const params = { page: postsPage, pageSize: 10 };
      if (postsStatus) params.status = postsStatus;
      const res = await adminApi.posts(params);
      setPosts(res.data);
      setPostsTotal(res.pagination.total);
    } catch (err) {
      addToast(err.message || '获取文章列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await adminApi.comments({ page: commentsPage, pageSize: 10 });
      setComments(res.data);
      setCommentsTotal(res.pagination.total);
    } catch (err) {
      addToast(err.message || '获取评论列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await categoriesApi.list();
      setCategories(res.data);
    } catch (err) {
      addToast(err.message || '获取分类列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(id) {
    if (!window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;
    setDeletingPostId(id);
    try {
      await adminApi.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      setPostsTotal(prev => prev - 1);
      addToast('文章删除成功');
    } catch (err) {
      addToast(err.message || '删除失败', 'error');
    } finally {
      setDeletingPostId(null);
    }
  }

  async function handleDeleteComment(id) {
    if (!window.confirm('确定要删除这条评论吗？此操作不可撤销。')) return;
    setDeletingCommentId(id);
    try {
      await adminApi.deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
      setCommentsTotal(prev => prev - 1);
      addToast('评论删除成功');
    } catch (err) {
      addToast(err.message || '删除失败', 'error');
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleSaveCategory(e) {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.slug) {
      addToast('请填写名称和别名', 'error');
      return;
    }
    setLoading(true);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, categoryForm);
        addToast('分类更新成功');
      } else {
        await adminApi.createCategory(categoryForm);
        addToast('分类创建成功');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '', description: '', color: '#2563eb', icon: 'BookOpen' });
      fetchCategories();
    } catch (err) {
      addToast(err.message || '操作失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleEditCategory(category) {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#2563eb',
      icon: category.icon || 'BookOpen',
    });
    setShowCategoryModal(true);
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm('确定要删除这个分类吗？请先确保该分类下没有文章。')) return;
    try {
      await adminApi.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      addToast('分类删除成功');
    } catch (err) {
      addToast(err.message || '删除失败', 'error');
    }
  }

  const tabs = [
    { id: 'stats', label: '统计概览', icon: BarChart2 },
    { id: 'posts', label: '文章管理', icon: FileText },
    { id: 'comments', label: '评论管理', icon: MessageSquare },
    { id: 'categories', label: '分类管理', icon: FolderOpen },
  ];

  const categoryIcons = ['BookOpen', 'Code', 'Palette', 'Heart', 'Lightbulb', 'Coffee', 'Briefcase', 'GraduationCap'];

  return (
    <div className={styles.page}>
      <div className={styles.heroBar}>
        <div className={styles.heroContent}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
            <span>返回首页</span>
          </button>
          <div>
            <h1 className={styles.pageTitle}>
              <LayoutDashboard size={28} />
              <span>管理员面板</span>
            </h1>
            <p className={styles.pageSubtitle}>管理博客内容和用户数据</p>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <nav className={styles.tabNav}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'posts') { setPostsPage(1); }
                  if (tab.id === 'comments') { setCommentsPage(1); }
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.content}>
          {activeTab === 'stats' && (
            <div className={styles.statsGrid}>
              {loading ? (
                <div className={styles.loading}>
                  <Loader2 size={28} className={styles.spinning} />
                  <span>加载中...</span>
                </div>
              ) : stats ? (
                <>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
                      <FileText size={24} style={{ color: '#2563eb' }} />
                    </div>
                    <div className={styles.statInfo}>
                      <p className={styles.statValue}>{stats.posts}</p>
                      <p className={styles.statLabel}>总文章</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                      <Eye size={24} style={{ color: '#10b981' }} />
                    </div>
                    <div className={styles.statInfo}>
                      <p className={styles.statValue}>{stats.totalViews.toLocaleString()}</p>
                      <p className={styles.statLabel}>总阅读量</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                      <MessageSquare size={24} style={{ color: '#f59e0b' }} />
                    </div>
                    <div className={styles.statInfo}>
                      <p className={styles.statValue}>{stats.comments}</p>
                      <p className={styles.statLabel}>总评论</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(124, 58, 237, 0.1)' }}>
                      <Users size={24} style={{ color: '#7c3aed' }} />
                    </div>
                    <div className={styles.statInfo}>
                      <p className={styles.statValue}>{stats.users}</p>
                      <p className={styles.statLabel}>注册用户</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                      <CheckCircle size={24} style={{ color: '#22c55e' }} />
                    </div>
                    <div className={styles.statInfo}>
                      <p className={styles.statValue}>{stats.published}</p>
                      <p className={styles.statLabel}>已发布</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                      <AlertCircle size={24} style={{ color: '#ef4444' }} />
                    </div>
                    <div className={styles.statInfo}>
                      <p className={styles.statValue}>{stats.drafts}</p>
                      <p className={styles.statLabel}>草稿</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className={styles.manageSection}>
              <div className={styles.manageHeader}>
                <h2 className={styles.manageTitle}>文章列表</h2>
                <div className={styles.manageFilters}>
                  <select
                    className={styles.filterSelect}
                    value={postsStatus}
                    onChange={(e) => { setPostsStatus(e.target.value); setPostsPage(1); }}
                  >
                    <option value="">全部状态</option>
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className={styles.loading}>
                  <Loader2 size={28} className={styles.spinning} />
                  <span>加载中...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className={styles.empty}>
                  <FileText size={48} className={styles.emptyIcon} />
                  <p>暂无文章</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>标题</th>
                        <th>作者</th>
                        <th>分类</th>
                        <th>状态</th>
                        <th>阅读</th>
                        <th>评论</th>
                        <th>发布时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => (
                        <tr key={post.id}>
                          <td>
                            <a href={`/post/${post.slug}`} target="_blank" className={styles.tableLink}>
                              {post.title}
                            </a>
                          </td>
                          <td>{post.author?.name || '未知'}</td>
                          <td>{post.category}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${post.status === 'draft' ? styles.statusDraft : styles.statusPublished}`}>
                              {post.status === 'draft' ? '草稿' : '已发布'}
                            </span>
                          </td>
                          <td>{post.views}</td>
                          <td>{post.commentCount || 0}</td>
                          <td>{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</td>
                          <td>
                            <button
                              className={styles.tableAction}
                              onClick={() => handleDeletePost(post.id)}
                              disabled={deletingPostId === post.id}
                            >
                              {deletingPostId === post.id ? (
                                <Loader2 size={14} className={styles.spinning} />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {postsTotal > 10 && (
                <div className={styles.pagination}>
                  {postsPage > 1 && (
                    <button className={styles.pageBtn} onClick={() => setPostsPage(postsPage - 1)}>
                      <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  )}
                  <span className={styles.pageInfo}>第 {postsPage} 页</span>
                  {postsPage * 10 < postsTotal && (
                    <button className={styles.pageBtn} onClick={() => setPostsPage(postsPage + 1)}>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className={styles.manageSection}>
              <div className={styles.manageHeader}>
                <h2 className={styles.manageTitle}>评论列表</h2>
              </div>

              {loading ? (
                <div className={styles.loading}>
                  <Loader2 size={28} className={styles.spinning} />
                  <span>加载中...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className={styles.empty}>
                  <MessageSquare size={48} className={styles.emptyIcon} />
                  <p>暂无评论</p>
                </div>
              ) : (
                <div className={styles.commentList}>
                  {comments.map((comment) => (
                    <div key={comment.id} className={styles.commentItem}>
                      <div className={styles.commentAvatar}>
                        <img src={comment.avatar} alt={comment.author} className={styles.avatarImg} />
                      </div>
                      <div className={styles.commentContent}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentAuthor}>{comment.author}</span>
                          <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleString('zh-CN')}</span>
                          <span className={styles.commentLikes}>{comment.likes} 赞</span>
                        </div>
                        <p className={styles.commentText}>{comment.content}</p>
                        <a href={`/post/${comment.postSlug}`} target="_blank" className={styles.commentPost}>
                          查看文章：{comment.postTitle}
                        </a>
                      </div>
                      <button
                        className={styles.commentDelete}
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                      >
                        {deletingCommentId === comment.id ? (
                          <Loader2 size={14} className={styles.spinning} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {commentsTotal > 10 && (
                <div className={styles.pagination}>
                  {commentsPage > 1 && (
                    <button className={styles.pageBtn} onClick={() => setCommentsPage(commentsPage - 1)}>
                      <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  )}
                  <span className={styles.pageInfo}>第 {commentsPage} 页</span>
                  {commentsPage * 10 < commentsTotal && (
                    <button className={styles.pageBtn} onClick={() => setCommentsPage(commentsPage + 1)}>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className={styles.manageSection}>
              <div className={styles.manageHeader}>
                <h2 className={styles.manageTitle}>分类管理</h2>
                <button className={styles.addBtn} onClick={() => setShowCategoryModal(true)}>
                  <Plus size={16} />
                  <span>添加分类</span>
                </button>
              </div>

              {loading ? (
                <div className={styles.loading}>
                  <Loader2 size={28} className={styles.spinning} />
                  <span>加载中...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className={styles.empty}>
                  <FolderOpen size={48} className={styles.emptyIcon} />
                  <p>暂无分类</p>
                </div>
              ) : (
                <div className={styles.categoryGrid}>
                  {categories.map((cat) => (
                    <div key={cat.id} className={styles.categoryCard}>
                      <div className={styles.categoryHeader}>
                        <div className={styles.categoryColor} style={{ backgroundColor: cat.color }} />
                        <span className={styles.categoryName}>{cat.name}</span>
                      </div>
                      <p className={styles.categoryDesc}>{cat.description || '暂无描述'}</p>
                      <div className={styles.categoryMeta}>
                        <span className={styles.categoryCount}>{cat.count} 篇文章</span>
                        <span className={styles.categorySlug}>{cat.slug}</span>
                      </div>
                      <div className={styles.categoryActions}>
                        <button className={styles.categoryEdit} onClick={() => handleEditCategory(cat)}>
                          <Edit2 size={14} />
                          <span>编辑</span>
                        </button>
                        <button className={styles.categoryDelete} onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 size={14} />
                          <span>删除</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCategoryModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingCategory ? '编辑分类' : '添加分类'}</h3>
              <button className={styles.modalClose} onClick={() => setShowCategoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleSaveCategory}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>名称 *</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="分类名称"
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>别名 *</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase() })}
                  placeholder="url-slug"
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>描述</label>
                <textarea
                  className={styles.modalTextarea}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="分类描述"
                  rows={2}
                />
              </div>
              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>颜色</label>
                  <input
                    type="color"
                    className={styles.modalColor}
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  />
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>图标</label>
                  <select
                    className={styles.modalSelect}
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  >
                    {categoryIcons.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.modalCancel} onClick={() => setShowCategoryModal(false)}>
                  取消
                </button>
                <button type="submit" className={styles.modalSubmit} disabled={loading}>
                  {loading ? (
                    <Loader2 size={16} className={styles.spinning} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  <span>{editingCategory ? '保存修改' : '创建分类'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}