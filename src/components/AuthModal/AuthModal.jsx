'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Github } from 'lucide-react';
import { auth as authApi } from '../../api/client';
import { useToast } from '../Toast/Toast';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthModal.module.css';

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const { login: authLogin } = useAuth();
  const addToast = useToast();
  const router = useRouter();

  // Focus first input + focus trap
  useEffect(() => {
    if (isOpen) {
      setError('');
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, tab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'register' && password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'login') {
        const res = await authApi.login(email, password);
        authLogin(res.data.user, res.data.token);
        addToast('登录成功，欢迎回来！');
        onClose();
        if (res.data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push(`/u/${res.data.user.name}`);
        }
      } else {
        if (!name.trim()) {
          setError('请输入昵称');
          setSubmitting(false);
          return;
        }
        await authApi.register(name.trim(), email, password);
        addToast('注册成功，请登录');
        setTab('login');
        setName('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message || '操作失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }, [tab, name, email, password, confirmPassword, onClose, addToast, router]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label={tab === 'login' ? '登录' : '注册'}>
      <div className={styles.modal} ref={modalRef}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
          <X size={18} />
        </button>

        <div className={styles.header}>
          <h2>{tab === 'login' ? '欢迎回来' : '创建账号'}</h2>
          <p>{tab === 'login' ? '登录后即可发表评论和收藏文章' : '注册后即可参与讨论'}</p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => setTab('login')}
            role="tab"
            aria-selected={tab === 'login'}
          >
            登录
          </button>
          <button
            className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
            onClick={() => setTab('register')}
            role="tab"
            aria-selected={tab === 'register'}
          >
            注册
          </button>
        </div>

        {/* Error */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className={styles.field}>
              <label htmlFor="auth-name">昵称</label>
              <input
                id="auth-name"
                type="text"
                placeholder="你的昵称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor="auth-email">邮箱</label>
            <input
              ref={tab === 'login' ? firstInputRef : null}
              id="auth-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="auth-password">密码</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {tab === 'register' && (
            <div className={styles.field}>
              <label htmlFor="auth-confirm">确认密码</label>
              <input
                id="auth-confirm"
                ref={firstInputRef}
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          )}
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? '请稍候...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className={styles.divider}>或者</div>

        <div className={styles.socialBtns}>
          <button type="button" className={styles.socialBtn} onClick={onClose}>
            <Mail size={18} />
            使用 Google 账号{tab === 'login' ? '登录' : '注册'}
          </button>
          <button type="button" className={styles.socialBtn} onClick={onClose}>
            <Github size={18} />
            使用 GitHub 账号{tab === 'login' ? '登录' : '注册'}
          </button>
        </div>

        <div className={styles.footer}>
          {tab === 'login' ? (
            <>还没有账号？<a href="#register" onClick={(e) => { e.preventDefault(); setTab('register'); }}>立即注册</a></>
          ) : (
            <>已有账号？<a href="#login" onClick={(e) => { e.preventDefault(); setTab('login'); }}>去登录</a></>
          )}
        </div>
      </div>
    </div>
  );
}
