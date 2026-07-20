'use client';
import { Suspense, useState, useRef, useEffect, forwardRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, Mail, Lock, UserRound, Loader2 } from 'lucide-react';
import { auth as authApi } from '@/api/client';
import { useToast } from '@/components/Toast/Toast';
import { useAuth } from '@/context/AuthContext';

/**
 * 独立登录页（PulseBeat 品牌 · 浅色主题）
 * - 支持 ?redirect=/some/path 参数，登录成功后自动跳回原页面
 * - 登录 / 注册 分段控件切换
 * - 用 Suspense 包裹 useSearchParams，满足 Next.js 静态预渲染要求
 */

const inputStyle = {
  width: '100%',
  padding: '12px 14px 12px 42px',
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: 10,
  color: '#0f172a',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  boxSizing: 'border-box',
};

const Field = forwardRef(function Field({ id, label, icon: Icon, ...props }, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon
          size={16}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
        />
        <input
          id={id}
          ref={ref}
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.background = '#fff';
            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.background = '#f8fafc';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />
      </div>
    </div>
  );
});

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const addToast = useToast();
  const { login: authLogin } = useAuth();

  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    setError('');
    setTimeout(() => firstInputRef.current?.focus(), 120);
  }, [tab]);

  const handleSubmit = async (e) => {
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
        router.push(decodeURIComponent(redirect));
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
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #cffafe 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰脉冲环 */}
      <div style={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', border: '1.5px solid rgba(59,130,246,0.08)', top: '-10%', right: '-8%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', border: '1.5px solid rgba(6,182,212,0.1)', bottom: '-6%', left: '-5%', pointerEvents: 'none' }} />

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          padding: '36px 30px 28px',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(15,23,42,0.06)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
      >
        {/* 品牌头部 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 14px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Activity size={26} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {tab === 'login' ? '欢迎回来' : '创建账号'}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
            {redirect && redirect !== '/'
              ? `登录后继续访问 ${decodeURIComponent(redirect)}`
              : 'PulseBeat · Feel the thoughts'}
          </p>
        </div>

        {/* 分段控件 */}
        <div role="tablist" style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '9px 0',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#0f172a' : '#64748b',
                boxShadow: tab === t.key ? '0 1px 3px rgba(15,23,42,0.12)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tab === 'register' && (
            <Field
              id="auth-name"
              label="昵称"
              icon={UserRound}
              type="text"
              placeholder="你的昵称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          )}
          <Field
            id="auth-email"
            label="邮箱"
            icon={Mail}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            ref={tab === 'login' ? firstInputRef : null}
          />
          <Field
            id="auth-password"
            label="密码"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />
          {tab === 'register' && (
            <Field
              id="auth-confirm"
              label="确认密码"
              icon={Lock}
              type="password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              ref={firstInputRef}
            />
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '13px',
              border: 'none',
              background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 10,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: 4,
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {submitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {submitting ? '请稍候...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }}>
          {tab === 'login' ? (
            <>
              还没有账号？
              <a
                href="#register"
                onClick={(e) => { e.preventDefault(); setTab('register'); }}
                style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none', marginLeft: 4 }}
              >
                立即注册
              </a>
            </>
          ) : (
            <>
              已有账号？
              <a
                href="#login"
                onClick={(e) => { e.preventDefault(); setTab('login'); }}
                style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none', marginLeft: 4 }}
              >
                去登录
              </a>
            </>
          )}
        </div>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              color: '#64748b',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
          >
            <ArrowLeft size={14} />
            返回首页
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#64748b' }}>加载中...</span>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
