import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Send } from 'lucide-react';
import { questionsApi } from '../api/client';
import styles from './QuestionForm.module.css';

export default function QuestionForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 5) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await questionsApi.create({
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
      });
      navigate(`/questions/${res.data.id}`);
    } catch (err) {
      console.error('Create question error:', err);
      alert(err.message || '创建问题失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.formPage}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/questions')}>
          <ArrowLeft size={18} />
          返回
        </button>
        <h1>提出问题</h1>
        <div className={styles.placeholder}></div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>问题标题</label>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="简洁清晰地描述你的问题..."
            maxLength={200}
          />
          <p className={styles.hint}>标题应简明扼要，让读者快速了解问题核心</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>问题描述</label>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="详细描述你的问题，包括：
1. 你遇到的具体问题是什么？
2. 你尝试过哪些方法？
3. 期望的结果是什么？

支持 Markdown 格式，可以添加代码块和引用。"
            rows={12}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>标签</label>
          <div className={styles.tagsContainer}>
            {tags.map(tag => (
              <span key={tag} className={styles.tagItem}>
                <Tag size={12} />
                {tag}
                <button type="button" className={styles.removeTag} onClick={() => handleRemoveTag(tag)}>×</button>
              </span>
            ))}
            <input
              type="text"
              className={styles.tagInput}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="输入标签后按 Enter 添加"
              maxLength={20}
              disabled={tags.length >= 5}
            />
          </div>
          <p className={styles.hint}>最多添加 5 个标签，帮助问题被更多人发现</p>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={() => navigate('/questions')}>
            取消
          </button>
          <button type="submit" className={styles.submitButton} disabled={submitting || !title.trim() || !content.trim()}>
            <Send size={16} />
            {submitting ? '发布中...' : '发布问题'}
          </button>
        </div>
      </form>

      <div className={styles.guidelines}>
        <h3>提问指南</h3>
        <ul>
          <li>问题标题要清晰明确，避免模糊表述</li>
          <li>详细描述问题背景和遇到的错误信息</li>
          <li>提供相关代码片段或截图（如果有）</li>
          <li>选择合适的标签，提高问题曝光率</li>
          <li>尊重他人，文明提问</li>
        </ul>
      </div>
    </div>
  );
}