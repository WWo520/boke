'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, MessageSquare, FolderOpen,
  Trash2, Plus, Edit2, X, CheckCircle, AlertCircle, Loader2,
  ArrowLeft, BarChart2, Eye, ChevronRight, ChevronLeft,
  Crown, UserCheck, UserX, BookOpen, Palette,
  Heart, Lightbulb, Coffee, Briefcase, GraduationCap, Code,
  ArrowUpRight, ArrowDownRight, Clock, Menu,
  Shield, PenLine, Sparkles, ExternalLink, Bell,
  CalendarDays, TrendingUp, Zap, Activity, Hash, Home,
  Search, PanelLeftClose, PanelLeftOpen, Star, Award, Flame,
  Send, Layers, ChevronDown,
} from 'lucide-react';
import { adminApi, categoriesApi, postsApi, commentsApi as commentsClient } from '@/api/client';
import { useToast } from '@/components/Toast/Toast';
import { useAuth } from '@/context/AuthContext';

/* ═══════════ Animated Counter ═══════════ */
function useCounter(end: number, dur = 900) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (end === 0) { setN(0); return; }
    started.current = false;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          setN(Math.round(end * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, dur]);
  return { ref, n };
}

/* ═══════════ Compact Stat Card ═══════════ */
function StatCardMini({ value, label, icon: Icon, color, bg, delay = 0 }: any) {
  const { ref, n } = useCounter(typeof value === 'number' ? value : parseInt(value) || 0, 800);
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`bg-white rounded-2xl border border-gray-100/80 p-4 transition-all duration-500 hover:shadow-md hover:-translate-y-0.5 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={17} className={color} />
        </div>
        <div className="min-w-0">
          <p ref={ref} className="text-xl font-extrabold text-gray-900 leading-none">{typeof value === 'number' ? n.toLocaleString() : value}</p>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Stat Card ═══════════ */
function StatCard({ value, label, icon: Icon, colors, trend, delay = 0, sub }: any) {
  const { ref, n } = useCounter(typeof value === 'number' ? value : parseInt(value) || 0);
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`admin-card relative overflow-hidden rounded-2xl p-5 cursor-default transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} hover:shadow-2xl hover:-translate-y-1 group`}
      style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/[0.07]" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/[0.04]" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
            <Icon size={20} className="text-white drop-shadow-sm" />
          </div>
          {trend != null && (
            <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${trend >= 0 ? 'bg-white/20 text-white' : 'bg-black/10 text-white/80'}`}>
              {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(trend)}%
            </span>
          )}
        </div>
        <span ref={ref} className="block text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
          {typeof value === 'string' ? value : n.toLocaleString()}
        </span>
        <span className="block text-[13px] text-white/60 mt-1 font-medium">{label}</span>
        {sub && <span className="block text-[11px] text-white/40 mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

/* ═══════════ Confirm Button ═══════════ */
function ConfirmBtn({ onConfirm, icon: Icon, title, disabled }: any) {
  const [open, setOpen] = useState(false);
  if (open) return (
    <div className="flex items-center gap-1 p-0.5 bg-white rounded-lg shadow-lg border border-gray-100 admin-modal-in">
      <button onClick={() => { onConfirm(); setOpen(false); }} className="px-2.5 py-1 text-[11px] font-bold rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors">确认</button>
      <button onClick={() => setOpen(false)} className="px-2.5 py-1 text-[11px] font-bold rounded-md text-gray-500 hover:bg-gray-100 transition-colors">取消</button>
    </div>
  );
  return (
    <button onClick={() => setOpen(true)} disabled={disabled} className="p-2 rounded-xl transition-all disabled:opacity-40 text-gray-300 hover:text-red-500 hover:bg-red-50" title={title}>
      <Icon size={15} />
    </button>
  );
}

/* ═══════════ Skeleton ═══════════ */
function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
              <div className="h-3 bg-gray-50 rounded-lg w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════ Empty State ═══════════ */
function EmptyState({ icon: Icon, title, desc, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-20 admin-fade-in">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner">
          <Icon size={40} className="text-gray-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
          <Sparkles size={14} className="text-blue-300" />
        </div>
      </div>
      <p className="text-gray-700 font-bold text-lg">{title}</p>
      {desc && <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">{desc}</p>}
      {action && (
        <button onClick={action.onClick} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-200/50 transition-all active:scale-[0.97]">
          <Plus size={16} />{action.label}
        </button>
      )}
    </div>
  );
}

/* ═══════════ Section Header ═══════════ */
function SectionHeader({ icon: Icon, title, count, action }: any) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Icon size={17} className="text-blue-500" /></div>
        <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
        {count != null && count > 0 && <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-full">{count}</span>}
      </div>
      {action}
    </div>
  );
}

/* ═══════════ Relative Time ═══════════ */
function relTime(dateStr: string) {
  const d = new Date(dateStr); const now = new Date(); const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000); const hrs = Math.floor(diff / 3600000); const days = Math.floor(diff / 86400000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  if (hrs < 24) return `${hrs}小时前`;
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

/* ═══════════════════════════════════════════════ */
/* ═══════════════ MAIN COMPONENT ════════════════ */
/* ═══════════════════════════════════════════════ */
export default function AdminPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isAdmin, isAuthLoading } = useAuth();
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [sbOpen, setSbOpen] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(false);
  const [now, setNow] = useState(new Date());
  const [searchQ, setSearchQ] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsStatus, setPostsStatus] = useState('');
  const [delPostId, setDelPostId] = useState<number | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);

  const [comments, setComments] = useState<any[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [delCommentId, setDelCommentId] = useState<number | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', color: '#2563eb', icon: 'BookOpen' });

  const [users, setUsers] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) { toast('请先登录', 'error'); router.push('/login'); return; }
    if (!isAdmin) { toast('需要管理员权限', 'error'); router.push('/'); return; }
  }, [user, isAdmin, isAuthLoading, router, toast]);

  useEffect(() => {
    const fns: any = { stats: fetchStats, posts: fetchPosts, comments: fetchComments, categories: fetchCategories, users: fetchUsers };
    fns[tab]?.();
  }, [tab, postsPage, postsStatus, commentsPage, usersPage]);

  async function fetchStats() {
    setLoading(true);
    try {
      const r = await adminApi.stats() as any; setStats(r.data);
      const [rp, rc] = await Promise.all([
        adminApi.posts({ page: 1, pageSize: 5 }) as any,
        adminApi.comments({ page: 1, pageSize: 5 }) as any,
      ]);
      setRecentPosts(rp.data || []);
      setRecentComments(rc.data || []);
    } catch (e: any) { toast(e.message || '获取统计失败', 'error'); }
    finally { setLoading(false); }
  }
  async function fetchPosts() {
    setLoading(true);
    try {
      const p: any = { page: postsPage, pageSize: 10 };
      if (postsStatus) p.status = postsStatus;
      if (searchQ) p.search = searchQ;
      const r = await adminApi.posts(p) as any;
      setPosts(r.data); setPostsTotal(r.pagination?.total || 0);
    } catch (e: any) { toast(e.message || '获取文章失败', 'error'); }
    finally { setLoading(false); }
  }
  async function fetchComments() {
    setLoading(true);
    try { const r = await adminApi.comments({ page: commentsPage, pageSize: 10 }) as any; setComments(r.data); setCommentsTotal(r.pagination?.total || 0); }
    catch (e: any) { toast(e.message || '获取评论失败', 'error'); }
    finally { setLoading(false); }
  }
  async function fetchCategories() {
    setLoading(true);
    try { const r = await categoriesApi.list() as any; setCategories(r.data); }
    catch (e: any) { toast(e.message || '获取分类失败', 'error'); }
    finally { setLoading(false); }
  }
  async function fetchUsers() {
    setLoading(true);
    try { const r = await adminApi.users({ page: usersPage, pageSize: 10 }) as any; setUsers(r.data); setUsersTotal(r.pagination?.total || 0); }
    catch (e: any) { toast(e.message || '获取用户失败', 'error'); }
    finally { setLoading(false); }
  }

  async function delPost(id: number) { setDelPostId(id); try { await adminApi.deletePost(id); setPosts(p => p.filter(x => x.id !== id)); setPostsTotal(p => p - 1); toast('文章已删除'); } catch (e: any) { toast(e.message || '删除失败', 'error'); } finally { setDelPostId(null); } }
  async function delComment(id: number) { setDelCommentId(id); try { await adminApi.deleteComment(id); setComments(p => p.filter(x => x.id !== id)); setCommentsTotal(p => p - 1); toast('评论已删除'); } catch (e: any) { toast(e.message || '删除失败', 'error'); } finally { setDelCommentId(null); } }
  async function delUser(id: number) { try { await adminApi.deleteUser(id); setUsers(p => p.filter(x => x.id !== id)); setUsersTotal(p => p - 1); toast('用户已删除'); } catch (e: any) { toast(e.message || '删除失败', 'error'); } }
  async function toggleAdmin(id: number, role: string) { const nr = role === 'admin' ? 'user' : 'admin'; try { await adminApi.updateUser(id, { role: nr }); setUsers(p => p.map(u => u.id === id ? { ...u, role: nr } : u)); toast(nr === 'admin' ? '已升级为管理员' : '已降级为普通用户'); } catch (e: any) { toast(e.message || '操作失败', 'error'); } }

  async function saveCat(e: React.FormEvent) {
    e.preventDefault();
    if (!catForm.name || !catForm.slug) { toast('请填写名称和别名', 'error'); return; }
    setLoading(true);
    try {
      if (editCat) { await adminApi.updateCategory(editCat.id, catForm); toast('分类已更新'); }
      else { await adminApi.createCategory(catForm); toast('分类已创建'); }
      setCatModal(false); setEditCat(null); setCatForm({ name: '', slug: '', description: '', color: '#2563eb', icon: 'BookOpen' }); fetchCategories();
    } catch (e: any) { toast(e.message || '操作失败', 'error'); }
    finally { setLoading(false); }
  }

  const tabs = [
    { id: 'stats', label: '数据概览', icon: BarChart2, badge: null },
    { id: 'posts', label: '文章管理', icon: FileText, badge: postsTotal || null },
    { id: 'comments', label: '评论管理', icon: MessageSquare, badge: commentsTotal || null },
    { id: 'users', label: '用户管理', icon: Users, badge: usersTotal || null },
    { id: 'categories', label: '分类管理', icon: FolderOpen, badge: categories.length || null },
  ];
  const iconMap: any = { BookOpen, Code, Palette, Heart, Lightbulb, Coffee, Briefcase, GraduationCap };
  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 6) return { text: '夜深了', emoji: '🌙' };
    if (h < 12) return { text: '早上好', emoji: '☀️' };
    if (h < 14) return { text: '中午好', emoji: '🌤️' };
    if (h < 18) return { text: '下午好', emoji: '⛅' };
    return { text: '晚上好', emoji: '🌆' };
  }, [now]);

  const filteredPosts = useMemo(() => {
    if (!searchQ) return posts;
    const q = searchQ.toLowerCase();
    return posts.filter(p => p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.author?.name?.toLowerCase().includes(q));
  }, [posts, searchQ]);

  /* ── Pagination ── */
  const Pager = ({ page, total, setPage }: any) => {
    if (total <= 10) return null;
    const tp = Math.ceil(total / 10);
    const pg: number[] = [];
    if (tp <= 7) for (let i = 1; i <= tp; i++) pg.push(i);
    else if (page <= 4) for (let i = 1; i <= 7; i++) pg.push(i);
    else if (page >= tp - 3) for (let i = tp - 6; i <= tp; i++) pg.push(i);
    else for (let i = page - 3; i <= page + 3; i++) pg.push(i);
    return (
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100/80">
        <span className="text-xs text-gray-400 font-medium">第 {page} / {tp} 页 · 共 {total} 条</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-25 disabled:cursor-not-allowed transition-all"><ChevronLeft size={14} /></button>
          {pg.map(n => (
            <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 text-xs rounded-lg transition-all font-semibold ${n === page ? 'bg-blue-600 text-white shadow-md shadow-blue-300/40 scale-105' : 'text-gray-500 hover:bg-gray-100'}`}>{n}</button>
          ))}
          <button onClick={() => setPage(page + 1)} disabled={page >= tp} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-25 disabled:cursor-not-allowed transition-all"><ChevronRight size={14} /></button>
        </div>
      </div>
    );
  };

  /* ── Loading Screen ── */
  if (isAuthLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16"><div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse" /><div className="absolute inset-0 flex items-center justify-center"><LayoutDashboard size={26} className="text-white" /></div></div>
        <p className="text-sm font-semibold text-gray-500">加载管理面板...</p>
      </div>
    </div>
  );

  return (
    <div className="admin-light min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 flex">
      {/* ════════ SIDEBAR ════════ */}
      {sbOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden admin-fade-in" onClick={() => setSbOpen(false)} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white/95 backdrop-blur-xl border-r border-gray-100/80 flex flex-col transition-all duration-300 ease-out lg:translate-x-0 ${sbOpen ? 'translate-x-0' : '-translate-x-full'} ${sbCollapsed ? 'w-[72px]' : 'w-[270px]'}`}>
        {/* Brand */}
        <div className={`px-4 py-4 flex items-center gap-3 border-b border-gray-100/60 transition-all ${sbCollapsed ? 'justify-center' : ''}`}>
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          {!sbCollapsed && (
            <div className="min-w-0">
              <h1 className="text-[15px] font-extrabold text-gray-900 tracking-tight truncate">管理面板</h1>
              <p className="text-[11px] text-gray-400 font-medium">墨客博客后台</p>
            </div>
          )}
          <button onClick={() => setSbCollapsed(!sbCollapsed)} className="hidden lg:flex ml-auto p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-lg transition-all">
            {sbCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {!sbCollapsed && <p className="px-3 mb-2 text-[10px] font-bold text-gray-300 uppercase tracking-[0.15em]">主菜单</p>}
          {tabs.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} title={sbCollapsed ? t.label : undefined}
                onClick={() => { setTab(t.id); setSbOpen(false);
                  if (t.id === 'posts') { setPostsPage(1); setPostsStatus(''); setSearchQ(''); }
                  if (t.id === 'comments') setCommentsPage(1);
                  if (t.id === 'users') setUsersPage(1);
                }}
                className={`relative w-full flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 group
                  ${sbCollapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-[11px]'}
                  ${active ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/80'}`}>
                {active && !sbCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />}
                <Icon size={18} className={active ? 'text-white/90' : 'text-gray-400 group-hover:text-gray-500'} />
                {!sbCollapsed && (
                  <>
                    <span className="flex-1 text-left">{t.label}</span>
                    {t.badge != null && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{t.badge > 99 ? '99+' : t.badge}</span>}
                  </>
                )}
                {sbCollapsed && t.badge != null && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">{t.badge > 9 ? '9+' : t.badge}</span>
                )}
              </button>
            );
          })}
          {!sbCollapsed && (
            <div className="!mt-5 border-t border-gray-100/60 pt-4">
              <p className="px-3 mb-2 text-[10px] font-bold text-gray-300 uppercase tracking-[0.15em]">快捷入口</p>
              <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-3.5 py-[11px] rounded-xl text-[13px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50/80 transition-all">
                <Home size={18} className="text-gray-400" /><span>访问前台</span>
              </button>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className={`px-3 py-3 border-t border-gray-100/60 bg-gray-50/30 ${sbCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${sbCollapsed ? '' : 'px-1'}`}>
            <img src={user?.avatar || ''} alt="" className="w-9 h-9 rounded-xl ring-2 ring-white shadow-sm object-cover flex-shrink-0" />
            {!sbCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1"><Shield size={10} className="text-blue-400" />管理员</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ════════ MAIN ════════ */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-2xl border-b border-gray-100/60 px-4 sm:px-6 lg:px-8 h-[60px] flex items-center">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setSbOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"><Menu size={20} /></button>
            <div className="min-w-0">
              <h2 className="text-[17px] font-extrabold text-gray-900 truncate">{greeting.emoji} {greeting.text}，{user?.name}</h2>
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                <CalendarDays size={11} />{now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search in posts */}
            {tab === 'posts' && (
              <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200/60 rounded-xl px-3 py-1.5 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm transition-all">
                <Search size={14} className="text-gray-400" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="搜索文章..." className="bg-transparent border-0 outline-none text-xs text-gray-700 w-36 placeholder:text-gray-400" />
                {searchQ && <button onClick={() => setSearchQ('')} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>}
              </div>
            )}
            {tab === 'posts' && (
              <div className="hidden sm:flex items-center bg-gray-100/80 rounded-xl p-1 gap-0.5">
                {[{ v: '', l: '全部' }, { v: 'published', l: '已发布' }, { v: 'draft', l: '草稿' }].map(s => (
                  <button key={s.v} onClick={() => { setPostsStatus(s.v); setPostsPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${postsStatus === s.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s.l}</button>
                ))}
              </div>
            )}
            {tab === 'posts' && <select value={postsStatus} onChange={e => { setPostsStatus(e.target.value); setPostsPage(1); }} className="sm:hidden px-3 py-2 bg-gray-100 border-0 rounded-xl text-xs font-semibold text-gray-600"><option value="">全部</option><option value="published">已发布</option><option value="draft">草稿</option></select>}
            {tab === 'categories' && (
              <button onClick={() => { setEditCat(null); setCatForm({ name: '', slug: '', description: '', color: '#2563eb', icon: 'BookOpen' }); setCatModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-300/40 transition-all active:scale-[0.97]">
                <Plus size={16} /><span className="hidden sm:inline">新建分类</span>
              </button>
            )}
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {loading && tab !== 'stats' ? <Skeleton /> : (<>
            {/* ═══ STATS TAB ═══ */}
            {tab === 'stats' && stats && (
              <div className="space-y-5 admin-fade-in">
                {/* Compact Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { value: stats.posts, label: '文章', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { value: stats.totalViews, label: '阅读量', icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { value: stats.comments, label: '评论', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { value: stats.users, label: '用户', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { value: stats.published, label: '已发布', icon: CheckCircle, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                    { value: stats.drafts, label: '草稿', icon: PenLine, color: 'text-rose-600', bg: 'bg-rose-50' },
                  ].map((item, i) => (
                    <StatCardMini key={i} value={item.value} label={item.label} icon={item.icon} color={item.color} bg={item.bg} delay={i * 60} />
                  ))}
                </div>

                {/* Insights */}
                <div className="bg-white rounded-2xl border border-gray-100/80 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { val: stats.posts > 0 ? Math.round(stats.totalViews / stats.posts).toLocaleString() : '0', label: '篇均阅读', icon: Eye, color: 'blue' },
                      { val: stats.posts > 0 ? (stats.comments / stats.posts).toFixed(1) : '0', label: '篇均评论', icon: MessageSquare, color: 'amber' },
                      { val: stats.posts > 0 ? Math.round((stats.published / stats.posts) * 100) + '%' : '0%', label: '发布率', icon: CheckCircle, color: 'emerald' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color === 'blue' ? 'bg-blue-50 text-blue-500' : item.color === 'amber' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          <item.icon size={16} />
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-gray-900 leading-none">{item.val}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Posts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100/60 flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText size={15} className="text-blue-500" /><h3 className="text-sm font-extrabold text-gray-900">最近文章</h3></div>
                      <button onClick={() => setTab('posts')} className="text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors">查看全部 →</button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {recentPosts.slice(0, 5).map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors group">
                          <div className={`w-1 h-8 rounded-full flex-shrink-0 ${p.status === 'draft' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <div className="flex-1 min-w-0">
                            <a href={`/post/${p.slug}`} target="_blank" className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-1 block">{p.title}</a>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400"><Eye size={10} />{p.views} <MessageSquare size={10} />{p.commentCount || 0}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.status === 'draft' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{p.status === 'draft' ? '草稿' : '已发布'}</span>
                        </div>
                      ))}
                      {recentPosts.length === 0 && <p className="text-center text-sm text-gray-400 py-8">暂无文章</p>}
                    </div>
                  </div>

                  {/* Recent Comments */}
                  <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100/60 flex items-center justify-between">
                      <div className="flex items-center gap-2"><MessageSquare size={15} className="text-amber-500" /><h3 className="text-sm font-extrabold text-gray-900">最近评论</h3></div>
                      <button onClick={() => setTab('comments')} className="text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors">查看全部 →</button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {recentComments.slice(0, 5).map((c: any) => (
                        <div key={c.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                          <img src={c.avatar} alt={c.author} className="w-7 h-7 rounded-lg ring-1 ring-gray-100 object-cover flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-800">{c.author}</span><span className="text-[10px] text-gray-400">{relTime(c.createdAt)}</span></div>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      {recentComments.length === 0 && <p className="text-center text-sm text-gray-400 py-8">暂无评论</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ POSTS TAB ═══ */}
            {tab === 'posts' && (
              <div className="admin-fade-in">
                {filteredPosts.length === 0 && !loading ? (
                  <EmptyState icon={FileText} title={searchQ ? '未找到匹配文章' : '暂无文章'} desc={searchQ ? `未找到包含"${searchQ}"的文章` : '还没有任何文章数据'} />
                ) : (
                  <>
                    {/* Table Header */}
                    <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <div className="w-1" />
                      <div className="w-16 flex-shrink-0" />
                      <div className="flex-1">标题</div>
                      <div className="w-16 text-center">阅读</div>
                      <div className="w-16 text-center hidden md:block">评论</div>
                      <div className="w-20 text-center hidden lg:block">日期</div>
                      <div className="w-20" />
                    </div>
                    <div className="space-y-2">
                      {filteredPosts.map((post, idx) => (
                        <div key={post.id} className="group bg-white rounded-2xl border border-gray-100/80 hover:border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden admin-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                          <div className="flex items-stretch">
                            <div className={`w-1 flex-shrink-0 transition-colors ${post.status === 'draft' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                            <div className="flex-1 p-4 flex items-center gap-4 min-w-0">
                              {post.coverImage ? (
                                <img src={post.coverImage} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-gray-100 shadow-sm hidden sm:block" />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0 hidden sm:block"><FileText size={18} className="text-gray-300" /></div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${post.status === 'draft' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/50' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50'}`}>
                                    {post.status === 'draft' ? '草稿' : '已发布'}
                                  </span>
                                  {post.category && <span className="text-[11px] text-gray-400 font-medium">{post.category}</span>}
                                </div>
                                <a href={`/post/${post.slug}`} target="_blank" className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 block mb-1">{post.title}</a>
                                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                                  <span className="sm:hidden flex items-center gap-1"><Eye size={11} />{post.views}</span>
                                  <span className="hidden sm:flex items-center gap-1"><Eye size={11} />{post.views?.toLocaleString()}</span>
                                  <span className="flex items-center gap-1"><MessageSquare size={11} />{post.commentCount || 0}</span>
                                  <span className="hidden lg:flex items-center gap-1"><Clock size={11} />{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('zh-CN') : '-'}</span>
                                  <span className="hidden md:inline text-gray-300">· {post.author?.name || '未知'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <a href={`/post/${post.slug}`} target="_blank" className="p-2 rounded-xl text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all" title="查看"><ExternalLink size={15} /></a>
                                <ConfirmBtn onConfirm={() => delPost(post.id)} icon={Trash2} title="删除文章" disabled={delPostId === post.id} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <Pager page={postsPage} total={postsTotal} setPage={setPostsPage} />
              </div>
            )}

            {/* ═══ COMMENTS TAB ═══ */}
            {tab === 'comments' && (
              <div className="admin-fade-in">
                {comments.length === 0 && !loading ? <EmptyState icon={MessageSquare} title="暂无评论" desc="还没有任何评论数据" /> : (
                  <div className="space-y-2.5">
                    {comments.map((c, idx) => (
                      <div key={c.id} className="group bg-white rounded-2xl border border-gray-100/80 hover:border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden admin-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                        <div className="flex items-stretch">
                          <div className={`w-1 flex-shrink-0 ${c.likes > 0 ? 'bg-rose-400' : 'bg-blue-400'}`} />
                          <div className="flex-1 p-4">
                            <div className="flex gap-3.5">
                              <img src={c.avatar} alt={c.author} className="w-10 h-10 rounded-xl ring-2 ring-gray-50 object-cover flex-shrink-0 shadow-sm" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="font-bold text-gray-900 text-sm">{c.author}</span>
                                  <span className="text-[11px] text-gray-400 font-medium">{relTime(c.createdAt)}</span>
                                  {c.likes > 0 && <span className="text-[11px] text-rose-500 font-bold flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded-md"><Heart size={9} />{c.likes}</span>}
                                </div>
                                <div className="bg-gray-50/80 rounded-xl px-3.5 py-2.5 mb-2 border-l-2 border-blue-200">
                                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{c.content}</p>
                                </div>
                                <a href={`/post/${c.postSlug}`} target="_blank" className="inline-flex items-center gap-1.5 text-[11px] text-blue-500 hover:text-blue-700 font-bold transition-colors group/link">
                                  <span className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center group-hover/link:bg-blue-100 transition-colors"><FileText size={10} /></span>
                                  {c.postTitle}
                                </a>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start">
                                <ConfirmBtn onConfirm={() => delComment(c.id)} icon={Trash2} title="删除评论" disabled={delCommentId === c.id} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Pager page={commentsPage} total={commentsTotal} setPage={setCommentsPage} />
              </div>
            )}

            {/* ═══ USERS TAB ═══ */}
            {tab === 'users' && (
              <div className="admin-fade-in">
                {users.length === 0 && !loading ? <EmptyState icon={Users} title="暂无用户" desc="还没有任何注册用户" /> : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {users.map((u, idx) => {
                      const level = u.level || 1; const points = u.points || 0;
                      const nextLevel = level * 100; const prevLevel = (level - 1) * 100;
                      const progress = Math.min(100, Math.round(((points - prevLevel) / (nextLevel - prevLevel)) * 100));
                      return (
                        <div key={u.id} className="group bg-white rounded-2xl border border-gray-100/80 hover:border-gray-200 hover:shadow-lg transition-all duration-200 p-5 overflow-hidden relative admin-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                          {u.role === 'admin' && <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-[60px] pointer-events-none" />}
                          <div className="relative flex items-start gap-3.5">
                            <div className="relative flex-shrink-0">
                              <img src={u.avatar} alt={u.name} className="w-13 h-13 rounded-2xl ring-2 ring-gray-50 object-cover shadow-sm" style={{ width: 52, height: 52 }} />
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center text-white shadow-sm ${u.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-gray-300 to-gray-400'}`}>
                                {u.role === 'admin' ? <Crown size={9} /> : <Shield size={9} />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-extrabold text-gray-900">{u.name}</span>
                                {u.role === 'admin' && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-extrabold ring-1 ring-purple-200/50">管理员</span>}
                              </div>
                              <p className="text-[11px] text-gray-400 truncate mb-2">{u.email}</p>
                              {/* Level Bar */}
                              <div className="flex items-center gap-2 mb-2.5">
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"><Star size={9} />Lv.{level}</span>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">{points}分</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {[
                                  { icon: FileText, val: u.postCount || 0, label: '文章', bg: 'bg-blue-50/60', text: 'text-blue-600' },
                                  { icon: Eye, val: u.totalViews || 0, label: '阅读', bg: 'bg-emerald-50/60', text: 'text-emerald-600' },
                                  { icon: Users, val: u.followersCount || 0, label: '粉丝', bg: 'bg-purple-50/60', text: 'text-purple-600' },
                                  { icon: Clock, val: u.createdAt ? relTime(u.createdAt) : '-', label: '注册', bg: 'bg-gray-50', text: 'text-gray-400' },
                                ].map((s, i) => (
                                  <span key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${s.bg} ${s.text}`}>
                                    <s.icon size={11} />{s.val}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => toggleAdmin(u.id, u.role)}
                                className={`p-2 rounded-xl transition-all ${u.role === 'admin' ? 'text-orange-400 hover:bg-orange-50 hover:text-orange-500' : 'text-blue-400 hover:bg-blue-50 hover:text-blue-500'}`}
                                title={u.role === 'admin' ? '降级为普通用户' : '升级为管理员'}>
                                {u.role === 'admin' ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                              <ConfirmBtn onConfirm={() => delUser(u.id)} icon={Trash2} title="删除用户" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Pager page={usersPage} total={usersTotal} setPage={setUsersPage} />
              </div>
            )}

            {/* ═══ CATEGORIES TAB ═══ */}
            {tab === 'categories' && (
              <div className="admin-fade-in">
                {categories.length === 0 && !loading ? (
                  <EmptyState icon={FolderOpen} title="暂无分类" desc="点击上方按钮创建第一个分类" action={{ label: '新建分类', onClick: () => { setEditCat(null); setCatForm({ name: '', slug: '', description: '', color: '#2563eb', icon: 'BookOpen' }); setCatModal(true); } }} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat, idx) => {
                      const CI = iconMap[cat.icon] || BookOpen;
                      const c = cat.color || '#3b82f6';
                      const total = stats?.posts || 1;
                      const pct = Math.min(100, Math.round(((cat.count || 0) / total) * 100));
                      return (
                        <div key={cat.id} className="group bg-white rounded-2xl border border-gray-100/80 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 admin-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                          <div className="h-1.5 transition-all duration-300 group-hover:h-2" style={{ background: `linear-gradient(90deg, ${c}, ${c}66)` }} />
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform" style={{ backgroundColor: `${c}12` }}>
                                  <CI size={22} style={{ color: c }} />
                                </div>
                                <div>
                                  <h3 className="font-extrabold text-gray-900 text-[15px]">{cat.name}</h3>
                                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{cat.slug}</p>
                                </div>
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', color: cat.color || '#2563eb', icon: cat.icon || 'BookOpen' }); setCatModal(true); }}
                                  className="p-1.5 text-gray-400 rounded-lg hover:text-blue-500 hover:bg-blue-50 transition-all"><Edit2 size={13} /></button>
                                <ConfirmBtn onConfirm={async () => { try { await adminApi.deleteCategory(cat.id); setCategories(p => p.filter(x => x.id !== cat.id)); toast('删除成功'); } catch (e: any) { toast(e.message || '删除失败', 'error'); } }} icon={Trash2} title="删除" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1 mb-4">{cat.description || '暂无描述'}</p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}, ${c}aa)` }} />
                              </div>
                              <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{cat.count || 0} 篇</span>
                            </div>
                            <div className="mt-2 text-[10px] text-gray-400 text-right">占比 {pct}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>)}
        </div>
      </main>

      {/* ══════ CATEGORY MODAL ══════ */}
      {catModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm admin-fade-in" onClick={() => setCatModal(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl admin-modal-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200/50">
                  {editCat ? <Edit2 size={15} className="text-white" /> : <Plus size={15} className="text-white" />}
                </div>
                <h3 className="text-base font-extrabold text-gray-900">{editCat ? '编辑分类' : '新建分类'}</h3>
              </div>
              <button onClick={() => setCatModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"><X size={18} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={saveCat}>
              {[
                { key: 'name', label: '名称', required: true, placeholder: '分类名称' },
                { key: 'slug', label: '别名', required: true, placeholder: 'url-slug', mono: true, transform: (v: string) => v.toLowerCase().replace(/\s+/g, '-') },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-extrabold text-gray-400 mb-1.5 uppercase tracking-[0.1em]">{f.label} {f.required && <span className="text-red-400">*</span>}</label>
                  <input type="text" value={(catForm as any)[f.key]}
                    onChange={e => setCatForm({ ...catForm, [f.key]: f.transform ? f.transform(e.target.value) : e.target.value })}
                    className={`w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all outline-none ${f.mono ? 'font-mono' : ''}`}
                    placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 mb-1.5 uppercase tracking-[0.1em]">描述</label>
                <textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all outline-none resize-none" placeholder="分类描述" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-400 mb-1.5 uppercase tracking-[0.1em]">颜色</label>
                  <div className="flex items-center gap-2.5">
                    <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5" />
                    <span className="text-xs text-gray-400 font-mono">{catForm.color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-400 mb-1.5 uppercase tracking-[0.1em]">图标</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['BookOpen', 'Code', 'Palette', 'Heart', 'Lightbulb', 'Coffee', 'Briefcase', 'GraduationCap'].map(ic => {
                      const Ic = iconMap[ic] || BookOpen; const sel = catForm.icon === ic;
                      return (
                        <button key={ic} type="button" onClick={() => setCatForm({ ...catForm, icon: ic })}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${sel ? 'bg-blue-500 text-white shadow-md shadow-blue-200/50 scale-110' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                          <Ic size={15} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${catForm.color}15` }}>
                    {(() => { const I = iconMap[catForm.icon] || BookOpen; return <I size={16} style={{ color: catForm.color }} />; })()}
                  </div>
                  <span className="text-sm font-extrabold text-gray-900">{catForm.name || '分类名称'}</span>
                  <span className="text-[11px] text-gray-400 font-mono ml-auto">{catForm.slug || 'slug'}</span>
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: catForm.color }} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setCatModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">取消</button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-300/40 disabled:opacity-50 transition-all active:scale-[0.97]">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  {editCat ? '保存修改' : '创建分类'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .admin-fade-in { animation: fadeIn 0.3s ease-out; }
        .admin-modal-in { animation: modalIn 0.25s ease-out; }
        .admin-slide-up { animation: slideUp 0.4s ease-out both; }
        .admin-card { will-change: transform, opacity, box-shadow; }
      `}</style>
    </div>
  );
}
