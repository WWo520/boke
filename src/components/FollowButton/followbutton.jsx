'use client';
import { useState, useEffect } from 'react';
import { followApi } from '../../api/client';
import { useToast } from '../Toast/Toast';
import styles from './FollowButton.module.css';

export default function FollowButton({ userId, isFollowed: initialFollowed, onFollowChange }) {
  const [isFollowed, setIsFollowed] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    setIsFollowed(initialFollowed);
  }, [initialFollowed]);

  const handleToggle = async () => {
    const token = sessionStorage.getItem('blog_token');
    if (!token) {
      addToast('请先登录');
      return;
    }

    setLoading(true);
    try {
      const res = await followApi.toggle(userId);
      setIsFollowed(res.data.following);
      onFollowChange?.(res.data.following);
      addToast(res.data.following ? '关注成功' : '已取消关注');
    } catch (err) {
      console.error('Follow error:', err);
      addToast(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${styles.followButton} ${isFollowed ? styles.following : ''}`}
    >
      {loading ? (
        <span className={styles.loading}>加载中...</span>
      ) : isFollowed ? (
        <>
          <span className={styles.icon}>✓</span>
          <span>已关注</span>
        </>
      ) : (
        <>
          <span className={styles.icon}>+</span>
          <span>关注</span>
        </>
      )}
    </button>
  );
}