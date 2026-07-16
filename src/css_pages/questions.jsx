import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, MessageCircle, Clock, Tag, ChevronRight } from 'lucide-react';
import { questionsApi } from '../api/client';
import styles from './Questions.module.css';

export default function Questions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadQuestions();
  }, [page, filter]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const status = filter === 'unsolved' ? 'unsolved' : filter === 'solved' ? 'solved' : undefined;
      const res = await questionsApi.list({ page, pageSize: 10, status });
      setQuestions(page === 1 ? res.data : [...questions, ...res.data]);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Questions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'unsolved', label: '未解决' },
    { key: 'solved', label: '已解决' },
  ];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.questionsPage}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <HelpCircle size={32} className={styles.headerIcon} />
          <div className={styles.headerText}>
            <h1>技术问答</h1>
            <p>提出问题，分享知识，共同成长</p>
          </div>
        </div>
        <button className={styles.askButton} onClick={() => navigate('/questions/ask')}>
          提问
        </button>
      </div>

      <div className={styles.filters}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.questionsList}>
        {loading && questions.length === 0 ? (
          <div className={styles.loading}>加载中...</div>
        ) : questions.length === 0 ? (
          <div className={styles.empty}>
            <HelpCircle size={48} className={styles.emptyIcon} />
            <p>暂无问题</p>
            <button className={styles.emptyBtn} onClick={() => navigate('/questions/ask')}>提出第一个问题</button>
          </div>
        ) : (
          questions.map(question => (
            <div
              key={question.id}
              className={`${styles.questionItem} ${question.status === 'solved' ? styles.solved : ''}`}
              onClick={() => navigate(`/questions/${question.id}`)}
            >
              <div className={styles.questionStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{question.answerCount || 0}</span>
                  <span className={styles.statLabel}>回答</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{question.views || 0}</span>
                  <span className={styles.statLabel}>浏览</span>
                </div>
              </div>
              <div className={styles.questionContent}>
                <h3 className={styles.questionTitle}>{question.title}</h3>
                <p className={styles.questionContentPreview}>{question.content?.substring(0, 100)}...</p>
                <div className={styles.questionMeta}>
                  {question.tags && question.tags.map(tag => (
                    <span key={tag} className={styles.tag}>
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                  <span className={styles.time}>
                    <Clock size={12} />
                    {formatDate(question.createdAt)}
                  </span>
                  <span className={styles.author}>{question.author?.name}</span>
                  {question.status === 'solved' && (
                    <span className={styles.solvedBadge}>已解决</span>
                  )}
                </div>
              </div>
              <ChevronRight size={20} className={styles.arrow} />
            </div>
          ))
        )}
      </div>

      {!loading && pagination.total > 10 && page < pagination.totalPages && (
        <button className={styles.loadMore} onClick={() => setPage(p => p + 1)}>
          加载更多
        </button>
      )}
    </div>
  );
}