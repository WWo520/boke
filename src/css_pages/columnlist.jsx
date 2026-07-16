import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { columnsApi } from '../api/client';
import styles from './ColumnList.module.css';

export default function ColumnList() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    loadColumns();
  }, [page]);

  const loadColumns = async () => {
    setLoading(true);
    try {
      const res = await columnsApi.list({ page, pageSize: 12 });
      setColumns(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Columns error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.columnListPage}>
      <div className={styles.header}>
        <h1>专栏</h1>
        <p>系统化的知识体系，由资深创作者精心打造</p>
      </div>

      <div className={styles.columnGrid}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : columns.length === 0 ? (
          <div className={styles.empty}>暂无专栏</div>
        ) : (
          columns.map(column => (
            <div
              key={column.id}
              className={styles.columnCard}
              onClick={() => navigate(`/column/${column.slug}`)}
            >
              {column.coverImage && (
                <img src={column.coverImage} alt={column.title} className={styles.columnCover} />
              )}
              <div className={styles.columnInfo}>
                <h3 className={styles.columnTitle}>{column.title}</h3>
                <p className={styles.columnDescription}>{column.description}</p>
                <div className={styles.columnAuthor}>
                  <img src={column.author?.avatar} alt={column.author?.name} className={styles.authorAvatar} />
                  <span className={styles.authorName}>{column.author?.name}</span>
                </div>
                <div className={styles.columnStats}>
                  <span>{column.postCount || 0} 篇文章</span>
                  <span>{column.subscriberCount || 0} 订阅</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.total > 12 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={styles.pageBtn}
          >
            上一页
          </button>
          <span className={styles.pageInfo}>第 {page} / {pagination.totalPages} 页</span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className={styles.pageBtn}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}