'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight } from 'lucide-react';
import { postsApi } from '../../api/client';
import styles from './SearchModal.module.css';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fetch search results from API with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      postsApi.list({ search: query.trim(), pageSize: 20 })
        .then((res) => {
          setResults(res.data);
          setSearched(true);
        })
        .catch((err) => {
          console.error('Failed to fetch search results:', err);
          setSearched(true);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on ESC key + focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === 'Tab' && isOpen && modalRef.current) {
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Clear query on close
  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  }, [onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Highlight matching text
  const highlightMatch = (text, searchQuery) => {
    if (!searchQuery.trim()) return text;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      new RegExp(`^(${escaped})$`, 'i').test(part) ? (
        <mark key={i} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="搜索文章"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.inputWrapper}>
            <Search size={20} className={styles.inputIcon} />
            <label htmlFor="search-input" className="sr-only">搜索文章</label>
            <input
              id="search-input"
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="搜索文章标题、摘要或标签..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query && (
              <button
                className={styles.clearBtn}
                onClick={() => setQuery('')}
                aria-label="清除搜索"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="关闭搜索"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div className={styles.results}>
          {!query.trim() ? (
            <div className={styles.hint}>
              <Search size={40} className={styles.hintIcon} />
              <p className={styles.hintText}>输入关键词开始搜索</p>
            </div>
          ) : results.length > 0 ? (
            <div className={styles.resultList}>
              <p className={styles.resultCount}>
                共找到 <strong>{results.length}</strong> 篇文章
              </p>
              {results.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className={styles.resultItem}
                  onClick={handleClose}
                >
                  <div className={styles.resultContent}>
                    <h3 className={styles.resultTitle}>
                      {highlightMatch(post.title, query)}
                    </h3>
                    <p className={styles.resultSummary}>
                      {highlightMatch(post.summary, query)}
                    </p>
                    <div className={styles.resultMeta}>
                      <span
                        className={styles.resultCategory}
                        style={{
                          backgroundColor: getCategoryColor(post.category.slug),
                        }}
                      >
                        {post.category.name}
                      </span>
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.resultTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight size={18} className={styles.resultArrow} />
                </Link>
              ))}
            </div>
          ) : searched ? (
            <div className={styles.empty}>
              <Search size={40} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>未找到相关文章</p>
              <p className={styles.emptyDesc}>
                试试其他关键词，或检查拼写是否正确
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(slug) {
  const colors = {
    tech: '#2563eb',
    design: '#7c3aed',
    life: '#10b981',
    frontend: '#f59e0b',
    thoughts: '#ef4444',
  };
  return colors[slug] || '#2563eb';
}
