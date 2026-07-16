'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ArrowLeft, Mail, Eye, EyeOff, CheckCircle, AlertCircle, FileText, Edit2, Trash2, Calendar, View, ChevronRight, Plus, Save, X, Upload, Loader2, Star, Send } from 'lucide-react';
import { auth as authApi, postsApi, profileApi, favoritesApi, uploadImage } from '../../../../api/client';
import { useToast } from '../../../../components/Toast/Toast';
import styles from '../../../../css_pages/Profile.module.css';

export default function Profile() {
  const router = useRouter();
  const { username } = useParams();
  const addToast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', avatar: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  /* ── Password form state ── */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  /* ── Posts management state ── */
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  /* ── Favorites state ── */
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [unfavoritingId, setUnfavoritingId] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('blog_user');
    if (!stored) {
      router.push('/', { replace: true });
      return;
    }
    const parsedUser = JSON.parse(stored);
    setUser(parsedUser);
    setEditForm({ name: parsedUser.name, bio: parsedUser.bio || '', avatar: parsedUser.avatar });
    setLoading(false);
  }, [router]);

  async function handleSaveProfile() {
    if (!editForm.name.trim()) {
      addToast('用户名不能为空', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await profileApi.update({ name: editForm.name.trim(), bio: editForm.bio.trim(), avatar: editForm.avatar });
      const updatedUser = { ...user, ...res.data };
      setUser(updatedUser);
      sessionStorage.setItem('blog_user', JSON.stringify(updatedUser));
      setEditMode(false);
      addToast('个人信息更新成功');
    } catch (err) {
      addToast(err.message || '更新失败，请稍后重试', 'error');
    } finally {
      setSaving(false);
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('请选择图片文件', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const imageUrl = await uploadImage(file);
      setEditForm((prev) => ({ ...prev, avatar: imageUrl }));
      addToast('头像上传成功');
    } catch (err) {
      addToast(err.message || '头像上传失败，请稍后重试', 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchUserPosts();
      fetchFavorites();
    }
  }, [loading, user, filterStatus]);

  async function fetchUserPosts() {
    setPostsLoading(true);
    try {
      const params = { page: 1, pageSize: 20 };
      if (filterStatus) params.status = filterStatus;
      const res = await postsApi.getUserPosts(params);
      setPosts(res.data);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }

  async function handleDeletePost(id) {
    if (!window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;
    setDeletingId(id);
    try {
      await postsApi.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      addToast('文章删除成功');
    } catch (err) {
      addToast(err.message || '删除失败，请稍后重试', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const [publishingId, setPublishingId] = useState(null);

  async function handlePublishPost(id) {
    setPublishingId(id);
    try {
      await postsApi.publish(id);
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'published' } : p)));
      addToast('文章发布成功');
    } catch (err) {
      addToast(err.message || '发布失败，请确保填写了所有必填字段', 'error');
    } finally {
      setPublishingId(null);
    }
  }

  async function fetchFavorites() {
    setFavoritesLoading(true);
    try {
      const res = await favoritesApi.list({ page: 1, pageSize: 20 });
      setFavorites(res.data);
    } catch {
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  }

  async function handleUnfavorite(postId) {
    setUnfavoritingId(postId);
    try {
      const post = favorites.find((f) => f.id === postId);
      if (post) {
        await favoritesApi.toggle(post.slug);
        setFavorites((prev) => prev.filter((f) => f.id !== postId));
        addToast('已取消收藏');
      }
    } catch (err) {
      addToast(err.message || '取消收藏失败，请稍后重试', 'error');
    } finally {
      setUnfavoritingId(null);
    }
  }

  function validatePassword() {
    const errs = {};
    if (!currentPassword) errs.currentPassword = '请输入当前密码';
    if (!newPassword) errs.newPassword = '请输入新密码';
    else if (newPassword.length < 6) errs.newPassword = '新密码至少 6 位';
    if (newPassword !== confirmPassword) errs.confirmPassword = '两次密码不一致';
    if (currentPassword && newPassword && currentPassword === newPassword) {
      errs.newPassword = '新密码不能与当前密码相同';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validatePassword()) return;

    setSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      addToast('密码修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (err) {
      if (err.code === 'INVALID_PASSWORD') {
        setErrors({ currentPassword: '当前密码错误' });
      } else {
        addToast(err.message || '密码修改失败', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

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
      {/* Hero */}
      <div className={styles.heroBar}>
        <div className={styles.heroContent}>
          <button className={styles.backBtn} onClick={() => router.back()} aria-label="返回">
            <ArrowLeft size={18} />
            <span>返回</span>
          </button>
          <h1 className={styles.pageTitle}>
            <User size={28} />
            <span>个人中心</span>
          </h1>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.grid}>
          {/* ─── Info Card ─── */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <User size={20} />
              <h2 className={styles.cardTitle}>个人信息</h2>
              {!editMode ? (
                <button className={styles.editBtn} onClick={() => setEditMode(true)} aria-label="编辑个人信息">
                  <Edit2 size={16} />
                  <span>编辑</span>
                </button>
              ) : (
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={() => setEditMode(false)} aria-label="取消编辑">
                    <X size={16} />
                    <span>取消</span>
                  </button>
                  <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={saving} aria-label="保存修改">
                    {saving ? (
                      <>
                        <Loader2 size={16} className={styles.spinning} />
                        <span>保存中</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>保存</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {editMode ? (
              <div className={styles.editBody}>
                <div className={styles.avatarEditWrap}>
                  <img src={editForm.avatar} alt={editForm.name} className={styles.avatar} />
                  <button
                    className={`${styles.avatarUploadBtn}${uploadingAvatar ? ` ${styles.avatarUploadBtnLoading}` : ''}`}
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 size={16} className={styles.spinning} />
                    ) : (
                      <Upload size={16} />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className={styles.avatarInput}
                  />
                </div>

                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>用户名</span>
                    <input
                      type="text"
                      className={styles.infoInput}
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      maxLength={50}
                    />
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>邮箱账号</span>
                    <span className={styles.infoValue}>
                      <Mail size={15} />
                      {user.email}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>个人简介</span>
                    <textarea
                      className={styles.infoTextarea}
                      value={editForm.bio}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="介绍一下你自己..."
                      rows={3}
                      maxLength={500}
                    />
                    <span className={styles.charCount}>{editForm.bio.length}/500</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.infoBody}>
                <div className={styles.avatarWrap}>
                  <img src={user.avatar} alt={user.name} className={styles.avatar} />
                </div>

                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>用户名</span>
                    <span className={styles.infoValue}>
                      <User size={15} />
                      {user.name}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>邮箱账号</span>
                    <span className={styles.infoValue}>
                      <Mail size={15} />
                      {user.email}
                    </span>
                  </div>
                  {user.bio && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>个人简介</span>
                      <p className={styles.infoBio}>{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ─── Password Card ─── */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Lock size={20} />
              <h2 className={styles.cardTitle}>修改密码</h2>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {/* Current password */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="currentPassword">
                  当前密码 <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="currentPassword"
                    className={`${styles.input} ${errors.currentPassword ? styles.inputError : ''}`}
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="请输入当前密码"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setErrors((p) => ({ ...p, currentPassword: '' })); }}
                    autoComplete="current-password"
                  />
                  <button type="button" className={styles.togglePw} onClick={() => setShowCurrent(!showCurrent)} tabIndex={-1}>
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <span className={styles.errorMsg}>
                    <AlertCircle size={13} /> {errors.currentPassword}
                  </span>
                )}
              </div>

              {/* New password */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="newPassword">
                  新密码 <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="newPassword"
                    className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
                    type={showNew ? 'text' : 'password'}
                    placeholder="请输入新密码（至少 6 位）"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: '' })); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.togglePw} onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <span className={styles.errorMsg}>
                    <AlertCircle size={13} /> {errors.newPassword}
                  </span>
                )}
              </div>

              {/* Confirm password */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="confirmPassword">
                  确认新密码 <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="confirmPassword"
                    className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="请再次输入新密码"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.togglePw} onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className={styles.errorMsg}>
                    <AlertCircle size={13} /> {errors.confirmPassword}
                  </span>
                )}
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? (
                  <>
                    <div className={styles.btnSpinner} />
                    修改中…
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    确认修改
                  </>
                )}
              </button>
            </form>
          </section>

          {/* ─── Posts Management Card ─── */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <FileText size={20} />
              <h2 className={styles.cardTitle}>我的文章</h2>
              <div className={styles.cardHeaderRight}>
                <select
                  className={styles.statusFilter}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                </select>
                <Link href={`/u/${username}/write`} className={styles.newPostBtn}>
                  <Plus size={16} />
                  <span>写文章</span>
                </Link>
              </div>
            </div>

            {postsLoading ? (
              <div className={styles.postsLoading}>
                <div className={styles.spinner} />
                <span>加载中...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className={styles.postsEmpty}>
                <FileText size={32} className={styles.emptyIcon} />
                <p>还没有发布文章</p>
                <Link href={`/u/${username}/write`} className={styles.emptyAction}>
                  <Plus size={16} />
                  发布第一篇文章
                </Link>
              </div>
            ) : (
              <div className={styles.postsList}>
                {posts.map((post) => (
                  <div key={post.id} className={styles.postItem}>
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className={styles.postCover}
                        loading="lazy"
                      />
                    )}
                    <div className={styles.postInfo}>
                      <Link href={`/post/${post.slug}`} className={styles.postTitle} target="_blank">
                        {post.title}
                      </Link>
                      <p className={styles.postSummary}>{post.summary}</p>
                      <div className={styles.postMeta}>
                        <span className={styles.postCat}>
                          {post.category?.name}
                        </span>
                        {post.status === 'draft' && (
                          <span className={styles.postDraft}>草稿</span>
                        )}
                        <span><Calendar size={12} /> {new Date(post.publishedAt).toLocaleDateString('zh-CN')}</span>
                        <span><View size={12} /> {post.views}</span>
                        {post.commentCount != null && <span>{post.commentCount} 评论</span>}
                      </div>
                    </div>
                    <div className={styles.postActions}>
                      <Link href={`/u/${username}/write/${post.id}`} className={styles.actionBtn} aria-label="编辑">
                        <Edit2 size={16} />
                      </Link>
                      {post.status === 'draft' && (
                        <button
                          className={styles.actionBtnPublish}
                          onClick={() => handlePublishPost(post.id)}
                          disabled={publishingId === post.id}
                          aria-label="发布"
                        >
                          {publishingId === post.id ? (
                            <div className={styles.smallSpinner} />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      )}
                      <button
                        className={styles.actionBtnDelete}
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletingId === post.id}
                        aria-label="删除"
                      >
                        {deletingId === post.id ? (
                          <div className={styles.smallSpinner} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─── Favorites Card ─── */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Star size={20} />
              <h2 className={styles.cardTitle}>我的收藏</h2>
            </div>

            {favoritesLoading ? (
              <div className={styles.postsLoading}>
                <div className={styles.spinner} />
                <span>加载中...</span>
              </div>
            ) : favorites.length === 0 ? (
              <div className={styles.postsEmpty}>
                <Star size={32} className={styles.emptyIcon} />
                <p>还没有收藏任何文章</p>
              </div>
            ) : (
              <div className={styles.postsList}>
                {favorites.map((post) => (
                  <div key={post.id} className={styles.postItem}>
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className={styles.postCover}
                        loading="lazy"
                      />
                    )}
                    <div className={styles.postInfo}>
                      <Link href={`/post/${post.slug}`} className={styles.postTitle} target="_blank">
                        {post.title}
                      </Link>
                      <p className={styles.postSummary}>{post.summary}</p>
                      <div className={styles.postMeta}>
                        <span className={styles.postCat}>
                          {post.category?.name}
                        </span>
                        <span><Calendar size={12} /> {new Date(post.publishedAt).toLocaleDateString('zh-CN')}</span>
                        <span><View size={12} /> {post.views}</span>
                        {post.commentCount != null && <span>{post.commentCount} 评论</span>}
                      </div>
                    </div>
                    <div className={styles.postActions}>
                      <button
                        className={styles.actionBtnDelete}
                        onClick={() => handleUnfavorite(post.id)}
                        disabled={unfavoritingId === post.id}
                        aria-label="取消收藏"
                      >
                        {unfavoritingId === post.id ? (
                          <div className={styles.smallSpinner} />
                        ) : (
                          <Star size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
