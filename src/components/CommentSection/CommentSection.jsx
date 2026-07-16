import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, User, Heart, Reply } from 'lucide-react';
import { commentsApi } from '../../api/client';
import { formatDate } from '../../utils/helpers';
import styles from './CommentSection.module.css';

function NestedComment({ comment, onLike, likedComments, user }) {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!user) return;

    setSubmitting(true);
    try {
      await commentsApi.reply(comment.id, replyContent.trim());
      setReplyContent('');
      setReplying(false);
      window.location.reload();
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.nestedComment}>
        <div className={styles.nestedAvatar}>
          {comment.avatar ? (
            <img className={styles.nestedAvatarImg} src={comment.avatar} alt={comment.author} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <User size={14} />
            </div>
          )}
        </div>
        <div className={styles.nestedBody}>
          <div className={styles.nestedMeta}>
            <span className={styles.nestedAuthor}>{comment.author}</span>
            <span className={styles.nestedTime}>{formatDate(comment.createdAt)}</span>
          </div>
          <p className={styles.nestedContent}>{comment.content}</p>
          <div className={styles.nestedActions}>
            <button
              className={`${styles.nestedLikeButton}${likedComments.has(comment.id) ? ` ${styles.likeButtonActive}` : ''}`}
              onClick={() => onLike(comment.id)}
            >
              <Heart size={12} />
              <span>{comment.likes}</span>
            </button>
            {user && (
              <button className={styles.nestedReplyButton} onClick={() => setReplying(!replying)}>
                <Reply size={12} />
                <span>回复</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {replying && user && (
        <div className={styles.replyForm}>
          <textarea
            className={styles.replyTextarea}
            placeholder="回复 @${comment.author}..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            maxLength={500}
            autoFocus
          />
          <div className={styles.replyButtons}>
            <button className={styles.replyCancel} onClick={() => setReplying(false)}>取消</button>
            <button className={styles.replySubmit} onClick={handleReplySubmit} disabled={submitting}>
              {submitting ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map(reply => (
            <NestedComment
              key={reply.id}
              comment={reply}
              onLike={onLike}
              likedComments={likedComments}
              user={user}
            />
          ))}
        </div>
      )}
    </>
  );
}

function CommentSection({ slug, comments: initialComments }) {
  const [commentList, setCommentList] = useState(initialComments);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({ name: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [optimisticId, setOptimisticId] = useState(null);
  const [likedComments, setLikedComments] = useState(new Set());
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('blog_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  const validate = useCallback(() => {
    const next = { name: '', content: '' };
    if (!user && !name.trim()) next.name = '请输入昵称';
    if (!content.trim()) next.content = '请输入评论内容';
    else if (content.trim().length < 2) next.content = '评论内容至少 2 个字';
    else if (content.trim().length > 500) next.content = '评论内容不能超过 500 字';
    setErrors(next);
    return !next.name && !next.content;
  }, [name, content, user]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);

      const tempId = Date.now();
      const authorName = user?.name || name.trim();
      const authorAvatar = user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;

      const optimisticComment = {
        id: tempId,
        author: authorName,
        avatar: authorAvatar,
        content: content.trim(),
        likes: 0,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      setCommentList((prev) => [optimisticComment, ...prev]);
      setOptimisticId(tempId);

      try {
        await commentsApi.create(slug, content.trim());
        const res = await commentsApi.list(slug);
        setCommentList(res.data);
        setOptimisticId(null);
      } catch (err) {
        setCommentList((prev) => prev.filter((c) => c.id !== tempId));
        setErrors({ name: '', content: err.message || '评论失败，请稍后重试' });
      } finally {
        setSubmitting(false);
        setName('');
        setContent('');
      }
    },
    [slug, content, validate, name, user],
  );

  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
    setErrors((prev) => ({ ...prev, name: '' }));
  }, []);

  const handleContentChange = useCallback((e) => {
    setContent(e.target.value);
    setErrors((prev) => ({ ...prev, content: '' }));
  }, []);

  const handleLike = useCallback(async (commentId) => {
    if (!user) {
      setErrors({ name: '', content: '请先登录后再点赞' });
      return;
    }

    if (likedComments.has(commentId)) return;

    setLikedComments((prev) => new Set([...prev, commentId]));
    setCommentList((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c,
      ),
    );

    try {
      await commentsApi.like(commentId);
    } catch {
      setLikedComments((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      setCommentList((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likes: Math.max(0, c.likes - 1) } : c,
        ),
      );
    }
  }, [user, likedComments]);

  const list = commentList.length > 0 ? commentList : initialComments;

  return (
    <section className={styles.section}>
      <h3 className={styles.header}>
        <MessageCircle className={styles.headerIcon} />
        评论
        {list.length > 0 && (
          <span className={styles.headerCount}>{list.length} 条评论</span>
        )}
      </h3>

      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.formTitle}>发表评论</p>

        {!user && (
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="comment-name">
              昵称
            </label>
            <input
              id="comment-name"
              className={`${styles.input}${errors.name ? ` ${styles.inputError}` : ''}`}
              type="text"
              placeholder="你的昵称"
              value={name}
              onChange={handleNameChange}
              maxLength={30}
            />
            {errors.name && <p className={styles.errorText}>{errors.name}</p>}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="comment-content">
            评论内容
          </label>
          <textarea
            id="comment-content"
            className={`${styles.textarea}${errors.content ? ` ${styles.inputError}` : ''}`}
            placeholder="说点什么吧..."
            value={content}
            onChange={handleContentChange}
            maxLength={500}
          />
          {errors.content && <p className={styles.errorText}>{errors.content}</p>}
        </div>

        <div className={styles.submitRow}>
          <button
            className={styles.submitButton}
            type="submit"
            disabled={submitting}
          >
            <Send className={styles.submitIcon} />
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </div>
      </form>

      {list.length === 0 && (
        <div className={styles.empty}>
          <MessageCircle className={styles.emptyIcon} />
          暂无评论，快来抢沙发吧 🛋️
        </div>
      )}

      {list.length > 0 && (
        <div className={styles.commentList}>
          {list.map((comment) => (
            <div
              key={comment.id}
              className={`${styles.commentItem}${comment.isOptimistic ? ` ${styles.commentItemOptimistic}` : ''}`}
            >
              <div className={styles.avatar}>
                {comment.avatar ? (
                  <img
                    className={styles.avatarImg}
                    src={comment.avatar}
                    alt={comment.author}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <User />
                  </div>
                )}
              </div>
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.author}>{comment.author}</span>
                  <span className={styles.time}>
                    {comment.isOptimistic ? (
                      <span className={styles.optimisticIndicator}>发送中...</span>
                    ) : (
                      formatDate(comment.createdAt)
                    )}
                  </span>
                </div>
                <p className={styles.content}>{comment.content}</p>
                <div className={styles.actions}>
                  <button
                    className={`${styles.likeButton}${likedComments.has(comment.id) ? ` ${styles.likeButtonActive}` : ''}`}
                    onClick={() => handleLike(comment.id)}
                    disabled={comment.isOptimistic}
                  >
                    <Heart className={styles.likeIcon} />
                    <span className={styles.likeCount}>{comment.likes}</span>
                  </button>
                  {user && (
                    <button className={styles.replyButton} onClick={() => {}}>
                      <Reply size={14} />
                      <span>回复</span>
                    </button>
                  )}
                </div>
                {comment.replies && comment.replies.length > 0 && (
                  <div className={styles.replies}>
                    {comment.replies.map(reply => (
                      <NestedComment
                        key={reply.id}
                        comment={reply}
                        onLike={handleLike}
                        likedComments={likedComments}
                        user={user}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CommentSection;