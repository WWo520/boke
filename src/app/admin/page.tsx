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
  const ref = useRef<HTMLParagraphElement>(null);
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

/* ═══════════ Ink Stat Card ═══════════ */
function StatCardMini({ value, label, icon: Icon, accent, delay = 0 }: any) {
  const { ref, n } = useCounter(typeof value === 'number' ? value : parseInt(value) || 0, 800);
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`ink-stat relative overflow-hidden bg-[#16202e] rounded-xl border border-[#233247] p-4 transition-all duration-500 hover:border-[#3a4d68] hover:-translate-y-0.5 group ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* 顶部鎏金描边 */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: `${accent}1a` }}>
          <Icon size={17} style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <p ref={ref} className="text-[22px] font-bold text-[#f2f6fc] leading-none tracking-tight">{typeof value === 'number' ? n.toLocaleString() : value}</p>
          <p className="text-[11px] text-[#6d8098] mt-1.5 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Confirm Button ═══════════ */
function ConfirmBtn({ onConfirm, icon: Icon, title, disabled }: any) {
  const [open, setOpen] = useState(false);
  if (open) return (
    <div className="flex items-center gap-1 p-0.5 bg-white rounded-lg shadow-lg border border-gray-100 ink-modal-in">
      <button onClick={() => { onConfirm(); setOpen(false); }} className="px-2.5 py-1 text-[11px] font-bold rounded-md text-white bg-[#d9534f] hover:bg-[#c9443f] transition-colors">确认</button>
      <button onClick={() => setOpen(false)} className="px-2.5 py-1 text-[11px] font-bold rounded-md text-gray-500 hover:bg-gray-100 transition-colors">取消</button>
    </div>
  );
  return (
    <button onClick={() => setOpen(true)} disabled={disabled} className="p-2 rounded-lg transition-all disabled:opacity-40 text-gray-300 hover:text-[#d9534f] hover:bg-[#d9534f]/8" title={title}>
      <Icon size={15} />
    </button>
  );
}

/* ═══════════ Skeleton ═══════════ */
function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#e8edf4] p-5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#eef2f8] rounded-lg" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 bg-[#eef2f8] rounded w-3/4" />
              <div className="h-3 bg-[#f3f6fa] rounded w-1/2" />
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
    <div className="flex flex-col items-center justify-center py-20 ink-fade-in">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-2xl bg-[#16202e] flex items-center justify-center">
          <Icon size={40} className="text-[#3a4d68]" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shadow-md">
          <Activity size={14} className="text-white" />
        </div>
      </div>
      <p className="text-[#1a2332] font-bold text-lg ink-serif">{title}</p>
      {desc && <p className="text-[#8a94a6] text-sm mt-2 max-w-xs text-center">{desc}</p>}
      {action && (
        <button onClick={action.onClick} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-[#16202e] text-[#38bdf8] rounded-lg text-sm font-bold hover:bg-[#1d2a3d] hover:shadow-lg transition-all active:scale-[0.97] border border-[#2a3a52]">
          <Plus size={16} />{action.label}
        </button>
      )}
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
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#e8edf4]">
        <span className="text-xs text-[#8a94a6] font-medium">第 {page} / {tp} 页 · 共 {total} 条</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#dde5ef] text-[#8a94a6] hover:bg-[#f0f4f9] hover:border-[#c5d2e2] disabled:opacity-25 disabled:cursor-not-allowed transition-all"><ChevronLeft size={14} /></button>
          {pg.map(n => (
            <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 text-xs rounded-lg transition-all font-semibold ${n === page ? 'bg-[#16202e] text-[#38bdf8] shadow-md scale-105' : 'text-[#6d8098] hover:bg-[#eef2f8]'}`}>{n}</button>
          ))}
          <button onClick={() => setPage(page + 1)} disabled={page >= tp} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#dde5ef] text-[#8a94a6] hover:bg-[#f0f4f9] hover:border-[#c5d2e2] disabled:opacity-25 disabled:cursor-not-allowed transition-all"><ChevronRight size={14} /></button>
        </div>
      </div>
    );
  };

  /* ── Loading Screen ── */
  if (isAuthLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#121a28]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center"><Activity size={26} className="text-white" /></div>
        </div>
        <p className="text-sm font-semibold text-[#6d8098] ink-serif">加载管理面板...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f5f9] flex">
      {/* ════════ SIDEBAR（深墨青） ════════ */}
      {sbOpen && <div className="fixed inset-0 bg-[#0d1420]/50 backdrop-blur-sm z-40 lg:hidden ink-fade-in" onClick={() => setSbOpen(false)} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#141d2c] border-r border-[#1f2b3d] flex flex-col transition-all duration-300 ease-out lg:translate-x-0 ${sbOpen ? 'translate-x-0' : '-translate-x-full'} ${sbCollapsed ? 'w-[72px]' : 'w-[264px]'}`}>
        {/* Brand */}
        <div className={`px-4 py-4 flex items-center gap-3 border-b border-[#1f2b3d] transition-all ${sbCollapsed ? 'justify-center' : ''}`}>
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-[#38bdf8]/20">
              <Activity size={18} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ecf8e] rounded-full border-2 border-[#141d2c]" />
          </div>
          {!sbCollapsed && (
            <div className="min-w-0">
              <h1 className="text-[16px] font-bold text-[#f2f6fc] tracking-tight truncate ink-serif">PulseBeat</h1>
              <p className="text-[11px] text-[#5a6a80] font-medium">管理面板 · Feel the thoughts</p>
            </div>
          )}
          <button onClick={() => setSbCollapsed(!sbCollapsed)} className="hidden lg:flex ml-auto p-1.5 text-[#4a5f7a] hover:text-[#9db2cc] hover:bg-[#1a2738] rounded-lg transition-all">
            {sbCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {!sbCollapsed && <p className="px-3 mb-2 text-[10px] font-bold text-[#4a5f7a] uppercase tracking-[0.15em]">主菜单</p>}
          {tabs.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} title={sbCollapsed ? t.label : undefined}
                onClick={() => { setTab(t.id); setSbOpen(false);
                  if (t.id === 'posts') { setPostsPage(1); setPostsStatus(''); setSearchQ(''); }
                  if (t.id === 'comments') setCommentsPage(1);
                  if (t.id === 'users') setUsersPage(1);
                }}
                className={`relative w-full flex items-center gap-3 rounded-lg text-[13px] font-semibold transition-all duration-200 group
                  ${sbCollapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-[11px]'}
                  ${active ? 'bg-[#38bdf8]/12 text-[#38bdf8]' : 'text-[#7a8aa0] hover:text-[#c5d2e2] hover:bg-[#1a2738]'}`}>
                {active && !sbCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#38bdf8] rounded-r-full" />}
                <Icon size={18} className={active ? 'text-[#38bdf8]' : 'text-[#5a6a80] group-hover:text-[#8fa3bc]'} />
                {!sbCollapsed && (
                  <>
                    <span className="flex-1 text-left">{t.label}</span>
                    {t.badge != null && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center ${active ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'bg-[#1f2b3d] text-[#6d8098]'}`}>{t.badge > 99 ? '99+' : t.badge}</span>}
                  </>
                )}
                {sbCollapsed && t.badge != null && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#38bdf8] text-[#16202e] text-[9px] font-bold flex items-center justify-center">{t.badge > 9 ? '9+' : t.badge}</span>
                )}
              </button>
            );
          })}
          {!sbCollapsed && (
            <div className="!mt-5 border-t border-[#1f2b3d] pt-4">
              <p className="px-3 mb-2 text-[10px] font-bold text-[#4a5f7a] uppercase tracking-[0.15em]">快捷入口</p>
              <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-3.5 py-[11px] rounded-lg text-[13px] font-semibold text-[#7a8aa0] hover:text-[#c5d2e2] hover:bg-[#1a2738] transition-all">
                <Home size={18} className="text-[#5a6a80]" /><span>访问前台</span>
              </button>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className={`px-3 py-3 border-t border-[#1f2b3d] bg-[#101827] ${sbCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${sbCollapsed ? '' : 'px-1'}`}>
            <img src={user?.avatar || ''} alt="" className="w-9 h-9 rounded-lg ring-2 ring-[#2a3a52] object-cover flex-shrink-0" />
            {!sbCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#e8eef7] truncate">{user?.name}</p>
                <p className="text-[11px] text-[#38bdf8] flex items-center gap-1"><Crown size={10} />管理员</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ════════ MAIN ════════ */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-30 bg-[#f2f5f9]/85 backdrop-blur-xl border-b border-[#e3e9f1] px-4 sm:px-6 lg:px-8 h-[64px] flex items-center">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setSbOpen(true)} className="lg:hidden p-2 text-[#6d8098] hover:bg-[#e8edf4] rounded-lg transition-all"><Menu size={20} /></button>
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-[#1a2332] truncate ink-serif">{greeting.emoji} {greeting.text}，{user?.name}</h2>
              <p className="text-[11px] text-[#8a94a6] flex items-center gap-1.5 mt-0.5">
                <CalendarDays size={11} />{now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'posts' && (
              <div className="hidden md:flex items-center gap-2 bg-white border border-[#dde5ef] rounded-lg px-3 py-1.5 focus-within:border-[#38bdf8] focus-within:shadow-sm transition-all">
                <Search size={14} className="text-[#8a94a6]" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="搜索文章..." className="bg-transparent border-0 outline-none text-xs text-[#1a2332] w-36 placeholder:text-[#a5b2c4]" />
                {searchQ && <button onClick={() => setSearchQ('')} className="text-[#8a94a6] hover:text-[#4a5f7a]"><X size={12} /></button>}
              </div>
            )}
            {tab === 'posts' && (
              <div className="hidden sm:flex items-center bg-[#e8edf4] rounded-lg p-1 gap-0.5">
                {[{ v: '', l: '全部' }, { v: 'published', l: '已发布' }, { v: 'draft', l: '草稿' }].map(s => (
                  <button key={s.v} onClick={() => { setPostsStatus(s.v); setPostsPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${postsStatus === s.v ? 'bg-[#16202e] text-[#38bdf8] shadow-sm' : 'text-[#6d8098] hover:text-[#3a4d68]'}`}>{s.l}</button>
                ))}
              </div>
            )}
            {tab === 'posts' && <select value={postsStatus} onChange={e => { setPostsStatus(e.target.value); setPostsPage(1); }} className="sm:hidden px-3 py-2 bg-[#e8edf4] border-0 rounded-lg text-xs font-semibold text-[#4a5f7a]"><option value="">全部</option><option value="published">已发布</option><option value="draft">草稿</option></select>}
            {tab === 'categories' && (
              <button onClick={() => { setEditCat(null); setCatForm({ name: '', slug: '', description: '', color: '#2563eb', icon: 'BookOpen' }); setCatModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#16202e] text-[#38bdf8] rounded-lg text-sm font-bold hover:bg-[#1d2a3d] hover:shadow-lg transition-all active:scale-[0.97] border border-[#2a3a52]">
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
              <div className="space-y-5 ink-fade-in">
                {/* Ink Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { value: stats.posts, label: '文章', icon: FileText, accent: '#38bdf8' },
                    { value: stats.totalViews, label: '阅读量', icon: Eye, accent: '#3ecf8e' },
                    { value: stats.comments, label: '评论', icon: MessageSquare, accent: '#e07856' },
                    { value: stats.users, label: '用户', icon: Users, accent: '#7c8cf8' },
                    { value: stats.published, label: '已发布', icon: CheckCircle, accent: '#4aa8d8' },
                    { value: stats.drafts, label: '草稿', icon: PenLine, accent: '#d9534f' },
                  ].map((item, i) => (
                    <StatCardMini key={i} value={item.value} label={item.label} icon={item.icon} accent={item.accent} delay={i * 60} />
                  ))}
                </div>

                {/* Insights */}
                <div className="bg-white rounded-xl border border-[#e8edf4] p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { val: stats.posts > 0 ? Math.round(stats.totalViews / stats.posts).toLocaleString() : '0', label: '篇均阅读', icon: Eye, accent: '#4aa8d8' },
                      { val: stats.posts > 0 ? (stats.comments / stats.posts).toFixed(1) : '0', label: '篇均评论', icon: MessageSquare, accent: '#e07856' },
                      { val: stats.posts > 0 ? Math.round((stats.published / stats.posts) * 100) + '%' : '0%', label: '发布率', icon: CheckCircle, accent: '#3ecf8e' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.accent}1a` }}>
                          <item.icon size={16} style={{ color: item.accent }} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#1a2332] leading-none">{item.val}</p>
                          <p className="text-[11px] text-[#8a94a6] mt-0.5">{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Posts + Comments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-[#e8edf4] overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#eef2f8] flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText size={15} className="text-[#38bdf8]" /><h3 className="text-sm font-bold text-[#1a2332] ink-serif">最近文章</h3></div>
                      <button onClick={() => setTab('posts')} className="text-[11px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors">查看全部 →</button>
                    </div>
                    <div className="divide-y divide-[#f3f6fa]">
                      {recentPosts.slice(0, 5).map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafbfd] transition-colors group">
                          <div className={`w-1 h-8 rounded-full flex-shrink-0 ${p.status === 'draft' ? 'bg-[#38bdf8]' : 'bg-[#3ecf8e]'}`} />
                          <div className="flex-1 min-w-0">
                            <a href={`/post/${p.slug}`} target="_blank" className="text-sm font-semibold text-[#1a2332] hover:text-[#2563eb] transition-colors line-clamp-1 block">{p.title}</a>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8a94a6]"><Eye size={10} />{p.views} <MessageSquare size={10} />{p.commentCount || 0}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.status === 'draft' ? 'bg-[#38bdf8]/12 text-[#2563eb]' : 'bg-[#3ecf8e]/12 text-[#2ba87a]'}`}>{p.status === 'draft' ? '草稿' : '已发布'}</span>
                        </div>
                      ))}
                      {recentPosts.length === 0 && <p className="text-center text-sm text-[#8a94a6] py-8">暂无文章</p>}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8edf4] overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#eef2f8] flex items-center justify-between">
                      <div className="flex items-center gap-2"><MessageSquare size={15} className="text-[#e07856]" /><h3 className="text-sm font-bold text-[#1a2332] ink-serif">最近评论</h3></div>
                      <button onClick={() => setTab('comments')} className="text-[11px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors">查看全部 →</button>
                    </div>
                    <div className="divide-y divide-[#f3f6fa]">
                      {recentComments.slice(0, 5).map((c: any) => (
                        <div key={c.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#fafbfd] transition-colors">
                          <img src={c.avatar} alt={c.author} className="w-7 h-7 rounded-lg ring-1 ring-[#e8edf4] object-cover flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-[#1a2332]">{c.author}</span><span className="text-[10px] text-[#8a94a6]">{relTime(c.createdAt)}</span></div>
                            <p className="text-xs text-[#6d8098] line-clamp-1 mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      {recentComments.length === 0 && <p className="text-center text-sm text-[#8a94a6] py-8">暂无评论</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ POSTS TAB ═══ */}
            {tab === 'posts' && (
              <div className="ink-fade-in">
                {filteredPosts.length === 0 && !loading ? (
                  <EmptyState icon={FileText} title={searchQ ? '未找到匹配文章' : '暂无文章'} desc={searchQ ? `未找到包含"${searchQ}"的文章` : '还没有任何文章数据'} />
                ) : (
                  <div className="space-y-2">
                    {filteredPosts.map((post, idx) => (
                      <div key={post.id} className="group bg-white rounded-xl border border-[#e8edf4] hover:border-[#c5d2e2] hover:shadow-md transition-all duration-200 overflow-hidden ink-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                        <div className="flex items-stretch">
                          <div className={`w-1 flex-shrink-0 transition-colors ${post.status === 'draft' ? 'bg-[#38bdf8]' : 'bg-[#3ecf8e]'}`} />
                          <div className="flex-1 p-4 flex items-center gap-4 min-w-0">
                            {post.coverImage ? (
                              <img src={post.coverImage} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 ring-1 ring-[#e8edf4] hidden sm:block" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-[#eef2f8] flex items-center justify-center flex-shrink-0 hidden sm:block"><FileText size={18} className="text-[#c5d2e2]" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${post.status === 'draft' ? 'bg-[#38bdf8]/12 text-[#2563eb]' : 'bg-[#3ecf8e]/12 text-[#2ba87a]'}`}>
                                  {post.status === 'draft' ? '草稿' : '已发布'}
                                </span>
                                {post.category && <span className="text-[11px] text-[#8a94a6] font-medium">{post.category}</span>}
                              </div>
                              <a href={`/post/${post.slug}`} target="_blank" className="text-sm font-bold text-[#1a2332] hover:text-[#2563eb] transition-colors line-clamp-1 block mb-1">{post.title}</a>
                              <div className="flex items-center gap-3 text-[11px] text-[#8a94a6] font-medium">
                                <span className="flex items-center gap-1"><Eye size={11} />{post.views?.toLocaleString()}</span>
                                <span className="flex items-center gap-1"><MessageSquare size={11} />{post.commentCount || 0}</span>
                                <span className="hidden lg:flex items-center gap-1"><Clock size={11} />{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('zh-CN') : '-'}</span>
                                <span className="hidden md:inline text-[#c5d2e2]">· {post.author?.name || '未知'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <a href={`/post/${post.slug}`} target="_blank" className="p-2 rounded-lg text-[#c5d2e2] hover:text-[#4aa8d8] hover:bg-[#4aa8d8]/8 transition-all" title="查看"><ExternalLink size={15} /></a>
                              <ConfirmBtn onConfirm={() => delPost(post.id)} icon={Trash2} title="删除文章" disabled={delPostId === post.id} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Pager page={postsPage} total={postsTotal} setPage={setPostsPage} />
              </div>
            )}

            {/* ═══ COMMENTS TAB ═══ */}
            {tab === 'comments' && (
              <div className="ink-fade-in">
                {comments.length === 0 && !loading ? <EmptyState icon={MessageSquare} title="暂无评论" desc="还没有任何评论数据" /> : (
                  <div className="space-y-2.5">
                    {comments.map((c, idx) => (
                      <div key={c.id} className="group bg-white rounded-xl border border-[#e8edf4] hover:border-[#c5d2e2] hover:shadow-md transition-all duration-200 overflow-hidden ink-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                        <div className="flex items-stretch">
                          <div className={`w-1 flex-shrink-0 ${c.likes > 0 ? 'bg-[#e07856]' : 'bg-[#4aa8d8]'}`} />
                          <div className="flex-1 p-4">
                            <div className="flex gap-3.5">
                              <img src={c.avatar} alt={c.author} className="w-10 h-10 rounded-lg ring-2 ring-[#f3f6fa] object-cover flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="font-bold text-[#1a2332] text-sm">{c.author}</span>
                                  <span className="text-[11px] text-[#8a94a6] font-medium">{relTime(c.createdAt)}</span>
                                  {c.likes > 0 && <span className="text-[11px] text-[#e07856] font-bold flex items-center gap-0.5 bg-[#e07856]/10 px-1.5 py-0.5 rounded"><Heart size={9} />{c.likes}</span>}
                                </div>
                                <div className="bg-[#f7f9fc] rounded-lg px-3.5 py-2.5 mb-2 border-l-2 border-[#38bdf8]">
                                  <p className="text-sm text-[#4a5f7a] leading-relaxed line-clamp-2">{c.content}</p>
                                </div>
                                <a href={`/post/${c.postSlug}`} target="_blank" className="inline-flex items-center gap-1.5 text-[11px] text-[#2563eb] hover:text-[#1d4ed8] font-bold transition-colors group/link">
                                  <span className="w-5 h-5 rounded bg-[#38bdf8]/12 flex items-center justify-center group-hover/link:bg-[#38bdf8]/20 transition-colors"><FileText size={10} /></span>
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
              <div className="ink-fade-in">
                {users.length === 0 && !loading ? <EmptyState icon={Users} title="暂无用户" desc="还没有任何注册用户" /> : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {users.map((u, idx) => {
                      const level = u.level || 1; const points = u.points || 0;
                      const nextLevel = level * 100; const prevLevel = (level - 1) * 100;
                      const progress = Math.min(100, Math.round(((points - prevLevel) / (nextLevel - prevLevel)) * 100));
                      return (
                        <div key={u.id} className="group bg-white rounded-xl border border-[#e8edf4] hover:border-[#c5d2e2] hover:shadow-md transition-all duration-200 p-5 overflow-hidden relative ink-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                          {u.role === 'admin' && <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#38bdf8]/12 to-transparent rounded-bl-[50px] pointer-events-none" />}
                          <div className="relative flex items-start gap-3.5">
                            <div className="relative flex-shrink-0">
                              <img src={u.avatar} alt={u.name} className="rounded-xl ring-2 ring-[#f3f6fa] object-cover" style={{ width: 52, height: 52 }} />
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center text-white shadow-sm ${u.role === 'admin' ? 'bg-gradient-to-br from-[#3b82f6] to-[#06b6d4]' : 'bg-gradient-to-br from-[#9db2cc] to-[#7a8aa0]'}`}>
                                {u.role === 'admin' ? <Crown size={9} className="text-[#16202e]" /> : <Shield size={9} />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-bold text-[#1a2332]">{u.name}</span>
                                {u.role === 'admin' && <span className="px-2 py-0.5 rounded bg-[#38bdf8]/12 text-[#2563eb] text-[10px] font-bold">管理员</span>}
                              </div>
                              <p className="text-[11px] text-[#8a94a6] truncate mb-2">{u.email}</p>
                              <div className="flex items-center gap-2 mb-2.5">
                                <span className="text-[10px] font-bold text-[#2563eb] bg-[#38bdf8]/12 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Star size={9} />Lv.{level}</span>
                                <div className="flex-1 h-1.5 bg-[#eef2f8] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#e07856] transition-all duration-700" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-[10px] text-[#8a94a6] font-medium">{points}分</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {[
                                  { icon: FileText, val: u.postCount || 0, label: '文章', bg: '#4aa8d8' },
                                  { icon: Eye, val: u.totalViews || 0, label: '阅读', bg: '#3ecf8e' },
                                  { icon: Users, val: u.followersCount || 0, label: '粉丝', bg: '#7c8cf8' },
                                  { icon: Clock, val: u.createdAt ? relTime(u.createdAt) : '-', label: '注册', bg: '#9db2cc' },
                                ].map((s, i) => (
                                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold" style={{ backgroundColor: `${s.bg}14`, color: s.bg }}>
                                    <s.icon size={11} />{s.val}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => toggleAdmin(u.id, u.role)}
                                className={`p-2 rounded-lg transition-all ${u.role === 'admin' ? 'text-[#e07856] hover:bg-[#e07856]/10' : 'text-[#4aa8d8] hover:bg-[#4aa8d8]/10'}`}
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
              <div className="ink-fade-in">
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
                        <div key={cat.id} className="group bg-white rounded-xl border border-[#e8edf4] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ink-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                          <div className="h-1.5 transition-all duration-300 group-hover:h-2" style={{ background: `linear-gradient(90deg, ${c}, ${c}66)` }} />
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform" style={{ backgroundColor: `${c}12` }}>
                                  <CI size={22} style={{ color: c }} />
                                </div>
                                <div>
                                  <h3 className="font-bold text-[#1a2332] text-[15px] ink-serif">{cat.name}</h3>
                                  <p className="text-[11px] text-[#8a94a6] font-mono mt-0.5">{cat.slug}</p>
                                </div>
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', color: cat.color || '#2563eb', icon: cat.icon || 'BookOpen' }); setCatModal(true); }}
                                  className="p-1.5 text-[#8a94a6] rounded-lg hover:text-[#4aa8d8] hover:bg-[#4aa8d8]/10 transition-all"><Edit2 size={13} /></button>
                                <ConfirmBtn onConfirm={async () => { try { await adminApi.deleteCategory(cat.id); setCategories(p => p.filter(x => x.id !== cat.id)); toast('删除成功'); } catch (e: any) { toast(e.message || '删除失败', 'error'); } }} icon={Trash2} title="删除" />
                              </div>
                            </div>
                            <p className="text-xs text-[#6d8098] line-clamp-1 mb-4">{cat.description || '暂无描述'}</p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-[#eef2f8] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}, ${c}aa)` }} />
                              </div>
                              <span className="text-[11px] font-bold text-[#6d8098] whitespace-nowrap">{cat.count || 0} 篇</span>
                            </div>
                            <div className="mt-2 text-[10px] text-[#8a94a6] text-right">占比 {pct}%</div>
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
          <div className="absolute inset-0 bg-[#0d1420]/40 backdrop-blur-sm ink-fade-in" onClick={() => setCatModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl ink-modal-in border border-[#e8edf4]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eef2f8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shadow-md">
                  {editCat ? <Edit2 size={15} className="text-[#16202e]" /> : <Plus size={15} className="text-[#16202e]" />}
                </div>
                <h3 className="text-base font-bold text-[#1a2332] ink-serif">{editCat ? '编辑分类' : '新建分类'}</h3>
              </div>
              <button onClick={() => setCatModal(false)} className="p-2 text-[#8a94a6] hover:text-[#4a5f7a] hover:bg-[#f0f4f9] rounded-lg transition-all"><X size={18} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={saveCat}>
              {[
                { key: 'name', label: '名称', required: true, placeholder: '分类名称' },
                { key: 'slug', label: '别名', required: true, placeholder: 'url-slug', mono: true, transform: (v: string) => v.toLowerCase().replace(/\s+/g, '-') },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-bold text-[#8a94a6] mb-1.5 uppercase tracking-[0.1em]">{f.label} {f.required && <span className="text-[#d9534f]">*</span>}</label>
                  <input type="text" value={(catForm as any)[f.key]}
                    onChange={e => setCatForm({ ...catForm, [f.key]: f.transform ? f.transform(e.target.value) : e.target.value })}
                    className={`w-full px-4 py-2.5 bg-[#f7f9fc] border border-[#dde5ef] rounded-lg text-sm focus:ring-2 focus:ring-[#38bdf8]/25 focus:border-[#38bdf8] focus:bg-white transition-all outline-none ${f.mono ? 'font-mono' : ''}`}
                    placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-bold text-[#8a94a6] mb-1.5 uppercase tracking-[0.1em]">描述</label>
                <textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#f7f9fc] border border-[#dde5ef] rounded-lg text-sm focus:ring-2 focus:ring-[#38bdf8]/25 focus:border-[#38bdf8] focus:bg-white transition-all outline-none resize-none" placeholder="分类描述" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#8a94a6] mb-1.5 uppercase tracking-[0.1em]">颜色</label>
                  <div className="flex items-center gap-2.5">
                    <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="w-10 h-10 rounded-lg border border-[#dde5ef] cursor-pointer p-0.5" />
                    <span className="text-xs text-[#8a94a6] font-mono">{catForm.color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8a94a6] mb-1.5 uppercase tracking-[0.1em]">图标</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['BookOpen', 'Code', 'Palette', 'Heart', 'Lightbulb', 'Coffee', 'Briefcase', 'GraduationCap'].map(ic => {
                      const Ic = iconMap[ic] || BookOpen; const sel = catForm.icon === ic;
                      return (
                        <button key={ic} type="button" onClick={() => setCatForm({ ...catForm, icon: ic })}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${sel ? 'bg-[#16202e] text-[#38bdf8] shadow-md scale-110' : 'bg-[#f0f4f9] text-[#8a94a6] hover:bg-[#e8edf4]'}`}>
                          <Ic size={15} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-3.5 bg-[#f7f9fc] rounded-lg border border-[#eef2f8]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${catForm.color}15` }}>
                    {(() => { const I = iconMap[catForm.icon] || BookOpen; return <I size={16} style={{ color: catForm.color }} />; })()}
                  </div>
                  <span className="text-sm font-bold text-[#1a2332] ink-serif">{catForm.name || '分类名称'}</span>
                  <span className="text-[11px] text-[#8a94a6] font-mono ml-auto">{catForm.slug || 'slug'}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catForm.color }} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setCatModal(false)} className="px-5 py-2.5 bg-[#eef2f8] text-[#4a5f7a] rounded-lg text-sm font-bold hover:bg-[#e3e9f1] transition-all">取消</button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#16202e] text-[#38bdf8] rounded-lg text-sm font-bold hover:bg-[#1d2a3d] hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.97] border border-[#2a3a52]">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  {editCat ? '保存修改' : '创建分类'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .ink-serif { font-family: 'Inter', system-ui, -apple-system, sans-serif; letter-spacing: -0.02em; }
        @keyframes inkFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes inkModalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes inkSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ink-fade-in { animation: inkFadeIn 0.3s ease-out; }
        .ink-modal-in { animation: inkModalIn 0.25s ease-out; }
        .ink-slide-up { animation: inkSlideUp 0.4s ease-out both; }
        .ink-stat { will-change: transform, opacity; }
      `}</style>
    </div>
  );
}
