'use client';

import { useState, useEffect, ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast/Toast';

function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('blog_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setMounted(true);
  }, []);

  // Prevent flash of unstyled theme
  if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>;
  return <>{children}</>;
}

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
