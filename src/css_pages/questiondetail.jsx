import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Tag, ThumbsUp, CheckCircle, Send, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { questionsApi, auth } from '../api/client';
import FollowButton from '../components/FollowButton/FollowButton';
import styles from './QuestionDetail.module.css';

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [user, setUser] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    auth.me().then(u => setUser(u)).catch(() => {});
    loadQuestion();
  }, [id]);

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const res = await questionsApi.get(id);
      setQuestion(res.data);
      setAnswers(res.data.answers || []);
    } catch (err) {
      console.error('Question error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!answerContent.trim()) return;
    setSubmitting(true);
    try {
      await questionsApi.answer(id, answerContent);
      setAnswerContent('');
      loadQuestion();
    } catch (err) {
      console.error('Answer error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeAnswer = async (answerId) => {
    try {
      await questionsApi.likeAnswer(answerId);
      loadQuestion();
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await questionsApi.acceptAnswer(answerId);
      loadQuestion();
    } catch (err) {
      console.error('Accept error:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvatar = (name) => {
    if (!name) return null;
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (!question) {
    return <div className={styles.notFound}>问题不存在</div>;
  }

  return (
    <div className={styles.questionDetail}>
      <button className={styles.backBtn} onClick={() => navigate('/questions')}>
        <ArrowLeft size={18} />
        <span>返回问答</span>
      </button>
      <div className={styles.questionHeader}>
        <div className={styles.statusBadge}>
          {question.status === 'solved' ? (
            <span className={styles.solved}>已解决</span>
          ) : (
            <span className={styles.unsolved}>未解决</span>
          )}
        </div>
        <h1 className={styles.title}>{question.title}</h1>
        <div className={styles.meta}>
          <div className={styles.authorInfo}>
            <div className={styles.avatar}>{getAvatar(question.author?.name)}</div>
            <span className={styles.authorName}>{question.author?.name}</span>
            {question.author?.id && user?.id !== question.author?.id && (
              <FollowButton userId={question.author.id} />
            )}
          </div>
          <span className={styles.time}>
            <Clock size={14} />
            {formatDate(question.createdAt)}
          </span>
          <span className={styles.views}>浏览 {question.views || 0}</span>
        </div>
      </div>

      <div className={styles.tags}>
        {question.tags && question.tags.map(tag => (
          <span key={tag} className={styles.tag}>
            <Tag size={12} />
            {tag}
          </span>
        ))}
      </div>

      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {question.content}
        </ReactMarkdown>
      </div>

      <div className={styles.answersSection}>
        <h2 className={styles.answersTitle}>
          {answers.length} 个回答
          {question.status === 'unsolved' && user?.id === question.author?.id && (
            <span className={styles.tip}>选择一个回答作为最佳答案</span>
          )}
        </h2>

        {answers.length === 0 ? (
          <div className={styles.noAnswers}>
            <p>暂无回答，快来分享你的见解吧！</p>
          </div>
        ) : (
          <div className={styles.answersList}>
            {answers.map((answer, index) => (
              <div
                key={answer.id}
                className={`${styles.answerItem} ${answer.accepted ? styles.accepted : ''}`}
              >
                {answer.accepted && (
                  <div className={styles.acceptedBadge}>
                    <CheckCircle size={20} />
                    最佳答案
                  </div>
                )}
                <div className={styles.answerStats}>
                  <button
                    className={`${styles.likeButton} ${answer.liked ? styles.liked : ''}`}
                    onClick={() => handleLikeAnswer(answer.id)}
                  >
                    <ThumbsUp size={16} />
                    <span>{answer.likes || 0}</span>
                  </button>
                </div>
                <div className={styles.answerContent}>
                  <div className={styles.answerMeta}>
                    <div className={styles.avatar}>{getAvatar(answer.author?.name)}</div>
                    <span className={styles.authorName}>{answer.author?.name}</span>
                    <span className={styles.time}>{formatDate(answer.createdAt)}</span>
                    <span className={styles.order}>#{index + 1}</span>
                  </div>
                  <div className={styles.answerBody}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {answer.content}
                    </ReactMarkdown>
                  </div>
                  {question.status === 'unsolved' && user?.id === question.author?.id && !answer.accepted && (
                    <button className={styles.acceptButton} onClick={() => handleAcceptAnswer(answer.id)}>
                      采纳为最佳答案
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {user && (
        <div className={styles.answerForm}>
          <h3>写下你的回答</h3>
          <textarea
            className={styles.textarea}
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="请输入你的回答..."
            rows={6}
          />
          <div className={styles.formActions}>
            <button className={styles.cancelButton} onClick={() => navigate('/questions')}>
              取消
            </button>
            <button className={styles.submitButton} onClick={handleAnswer} disabled={submitting || !answerContent.trim()}>
              <Send size={16} />
              {submitting ? '提交中...' : '提交回答'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}