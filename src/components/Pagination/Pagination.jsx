import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className={styles.pagination} aria-label="文章分页">
      <button
        className={`${styles.button} ${styles.prev}`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="上一页"
      >
        <ChevronLeft size={18} />
        <span>上一页</span>
      </button>

      <div className={styles.pages}>
        {pages[0] > 1 && (
          <>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(1)}
              aria-label="第 1 页"
            >
              1
            </button>
            {pages[0] > 2 && <span className={styles.ellipsis}>...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
            onClick={() => onPageChange(page)}
            aria-label={`第 ${page} 页`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(totalPages)}
              aria-label={`第 ${totalPages} 页`}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className={`${styles.button} ${styles.next}`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="下一页"
      >
        <span>下一页</span>
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
