'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Activity, LogOut, PenLine, Shield, HelpCircle } from 'lucide-react';
import { useToast } from '../Toast/Toast';
import AuthModal from '../AuthModal/AuthModal';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import SearchModal from '../SearchModal/searchmodal';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPostEditor = pathname.startsWith('/u/') && pathname.includes('/write');
  const isLoggedIn = !!user;
  const addToast = useToast();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const showNavbar = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setNavbarVisible(true);
    }, 100);
  }, []);

  const hideNavbar = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setNavbarVisible(false);
    }, 800);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setNavbarVisible(true);
      }
    };
    const handleMouseMove = (e) => {
      if (e.clientY < 60) {
        showNavbar();
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showNavbar]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSearchClick = useCallback(() => {
    setSearchOpen(true);
    setMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setMenuOpen(false);
    router.push('/');
    addToast('已退出登录');
  }, [logout, addToast, router]);

  return (
    <>
      <div
        className={styles.hoverZone}
        onMouseEnter={showNavbar}
        onMouseLeave={hideNavbar}
      />
      <nav
        className={`${styles.navbar} ${navbarVisible || isMobile ? styles.visible : ''} ${isMobile ? styles.mobile : ''}`}
        role="navigation"
        aria-label="主导航"
        onMouseEnter={showNavbar}
        onMouseLeave={hideNavbar}
      >
        <div className={styles.container}>
          <Link href="/" className={styles.logo} aria-label="回到首页">
            <Activity size={24} className={styles.logoIcon} />
            <span className={styles.logoText}>PulseBeat</span>
          </Link>

          <div className={styles.desktopNav}>
            <Link href="/" className={styles.navLink}>
              首页
            </Link>
            <Link href="/rankings" className={styles.navLink}>
              排行榜
            </Link>
            <Link href="/questions" className={styles.navLink}>
              问答
            </Link>

            <button
              className={styles.iconButton}
              onClick={handleSearchClick}
              aria-label="打开搜索"
            >
              <Search size={20} />
            </button>

            <ThemeToggle />

            {user ? (
              <div className={styles.userMenu}>
                <Link href={`/u/${user.name}/write`} className={`${styles.iconButton} ${isPostEditor ? styles.iconButtonActive : ''}`} aria-label="发布文章">
                  <PenLine size={20} />
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className={styles.iconButton} aria-label="管理后台">
                    <Shield size={20} />
                  </Link>
                )}
                <Link href={`/u/${user.name}`} className={styles.userName}>
                  <img src={user.avatar} alt={user.name} className={styles.userAvatar} />
                  <span>{user.name}</span>
                </Link>
                <button className={styles.logoutButton} onClick={handleLogout} aria-label="退出登录">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link href="/login" className={styles.authButton} aria-label="登录">
                <User size={18} />
                <span>登录</span>
              </Link>
            )}
          </div>

          <div className={styles.mobileControls}>
            <Link href="/" className={styles.mobileNavBtn} onClick={() => setMenuOpen(false)}>
              首页
            </Link>
            <Link href="/rankings" className={styles.mobileNavBtn} onClick={() => setMenuOpen(false)}>
              排行榜
            </Link>
            <Link href="/questions" className={styles.mobileNavBtn} onClick={() => setMenuOpen(false)}>
              <HelpCircle size={16} />
              <span>问答</span>
            </Link>
            <button
              className={styles.mobileIconBtn}
              onClick={handleSearchClick}
              aria-label="打开搜索"
            >
              <Search size={18} />
            </button>
            {user && (
              <Link href={`/u/${user.name}/write`} className={`${styles.mobileIconBtn} ${isPostEditor ? styles.mobileIconBtnActive : ''}`} aria-label="发布文章">
                <PenLine size={18} />
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className={styles.mobileIconBtn} aria-label="管理后台">
                <Shield size={18} />
              </Link>
            )}
            {user ? (
              <div className={styles.mobileUserWrap}>
                <Link href={`/u/${user.name}`} className={styles.mobileAvatarLink}>
                  <img src={user.avatar} alt={user.name} className={styles.mobileAvatar} />
                </Link>
                <button className={styles.mobileLogoutIcon} onClick={handleLogout} aria-label="退出登录">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link href="/login" className={styles.mobileIconBtn} aria-label="登录">
                <User size={18} />
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className={`${styles.mobileUserPanel} ${menuOpen ? styles.mobileUserPanelOpen : ''}`} aria-hidden={!menuOpen}>
        <div className={styles.mobileNavContent}>
          {user ? (
            <div className={styles.mobileUserInfo}>
              <img src={user.avatar} alt={user.name} className={styles.mobileUserAvatar} />
              <span className={styles.mobileUserName}>{user.name}</span>
              <button className={styles.mobileLogoutBtn} onClick={() => { setMenuOpen(false); handleLogout(); }}>
                <LogOut size={16} /> 退出登录
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.mobileAuthButton} onClick={() => setMenuOpen(false)}>
              <User size={18} />
              <span>登录 / 注册</span>
            </Link>
          )}
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
