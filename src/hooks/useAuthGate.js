'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast/Toast';

/**
 * 登录拦截 hook
 * - 已登录：直接跳转目标 URL
 * - 未登录：跳到 /login?redirect=当前路径，登录成功后返回
 *
 * 用法：
 *   const { go } = useAuthGate();
 *   <div onClick={() => go('/u/someuser')}>...</div>
 */
export function useAuthGate() {
  const router = useRouter();
  const { user } = useAuth();
  const addToast = useToast();

  const go = useCallback(
    (target) => {
      if (user) {
        router.push(target);
      } else {
        // 未登录：跳到登录页，登录后返回当前 URL
        const redirect = encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : target);
        addToast('请先登录');
        router.push(`/login?redirect=${redirect}`);
      }
    },
    [user, router, addToast],
  );

  /**
   * 需要登录才能执行的操作（点赞/收藏/评论等）。
   * 已登录返回 true；未登录提示并跳转登录页，返回 false。
   * 用法：if (!requireAuth()) return;
   */
  const requireAuth = useCallback(() => {
    if (user) return true;
    const redirect = encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
    addToast('请先登录');
    router.push(`/login?redirect=${redirect}`);
    return false;
  }, [user, router, addToast]);

  return { user, go, requireAuth, isLoggedIn: !!user };
}
