'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Eye, EyeOff, Send, ArrowLeft, Upload, X, FileImage,
  Tag, AlertCircle, CheckCircle, Loader2, Sparkles, Save, Clock,
  Bold, Italic, List, ListOrdered, Quote, Code, Link2, Heading1, Heading2,
} from 'lucide-react';
import { postsApi, categoriesApi } from '../../../../../api/client';
import { uploadImage } from '../../../../../api/client';
import { useToast } from '../../../../../components/Toast/Toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import styles from '../../../../../css_pages/PostEditor.module.css';

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_DIMENSION = 1920; // 最长边最大像素

// Client-side image compression before upload
function compressImage(file) {
  return new Promise((resolve, reject) => {
    // SVG and GIF: skip compression
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      // Resize if larger than MAX_IMAGE_DIMENSION
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('图片压缩失败')); return; }
        // Use compressed blob if smaller, otherwise keep original
        if (blob.size < file.size) {
          const compressed = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(compressed);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片加载失败')); };
    img.src = url;
  });
}

function getToken() {
  try { return sessionStorage.getItem('blog_token'); } catch { return null; }
}

function getCurrentUsername() {
  try {
    const stored = sessionStorage.getItem('blog_user');
    if (stored) {
      const user = JSON.parse(stored);
      return user.name;
    }
    return '';
  } catch {
    return '';
  }
}

export default function PostEditor() {
  const router = useRouter();
  const params = useParams();
  const paramId = params.id;
  const addToast = useToast();
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [postId, setPostId] = useState(paramId);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [autoSaveTime, setAutoSaveTime] = useState(null);
  const autoSaveTimer = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    coverImage: '',
    categoryId: '',
    tags: '',
    status: 'published',
  });

  // Auth guard: redirect to home if not logged in
  useEffect(() => {
    if (!getToken()) {
      addToast('请先登录后再创作文章', 'error');
      router.push('/', { replace: true });
    }
  }, [router, addToast]);

  // Auto-save draft
  useEffect(() => {
    if (!formData.title && !formData.content) return;
    
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(() => {
      autoSaveDraft();
    }, 30000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [formData.title, formData.content, formData.summary, formData.tags]);

  const autoSaveDraft = async () => {
    if (!formData.title.trim()) return;
    if (formData.status === 'published') return;
    
    setAutoSaveStatus('saving');
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      const postData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        coverImage: formData.coverImage.trim(),
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        tags: tagsArray,
        status: 'draft',
      };

      if (postId) {
        await postsApi.update(postId, postData);
      } else {
        const res = await postsApi.create(postData);
        if (res.data && res.data.id) {
          window.history.replaceState({}, '', `/write/${res.data.id}`);
          setPostId(res.data.id.toString());
        }
      }
      setAutoSaveStatus('saved');
      setAutoSaveTime(new Date());
      setTimeout(() => setAutoSaveStatus(''), 3000);
    } catch (err) {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  };

  // Upload state
  const [uploadState, setUploadState] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (postId) {
      loadPost(postId);
    }
  }, [postId]);

  async function loadPost(postId) {
    setEditLoading(true);
    try {
      const res = await postsApi.getById(postId);
      const post = res.data;
      setFormData({
        title: post.title || '',
        summary: post.summary || '',
        content: post.content || '',
        coverImage: post.coverImage || '',
        categoryId: post.category?.id ? post.category.id.toString() : '',
        tags: post.tags ? post.tags.join(', ') : '',
        status: post.status || 'published',
      });
    } catch (err) {
      addToast(err.message || '加载文章失败', 'error');
    } finally {
      setEditLoading(false);
    }
  }

  useEffect(() => {
    categoriesApi.list()
      .then((res) => setCategories(res.data))
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
        addToast('加载分类失败', 'error');
      });
  }, [addToast]);

  // File handling
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;
    if (!VALID_TYPES.includes(file.type)) {
      addToast('仅支持 JPG、PNG、GIF、WebP、BMP、SVG 格式', 'error');
      return;
    }
    if (file.size > MAX_SIZE) {
      addToast('文件大小不能超过 10MB', 'error');
      return;
    }

    // Preview locally (use original for preview)
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // Step 1: Compress image
    setUploadState('uploading');
    setUploadProgress(0);
    let compressedFile;
    try {
      compressedFile = await compressImage(file);
    } catch {
      compressedFile = file; // fallback to original
    }
    const savedRatio = compressedFile !== file
      ? ` (压缩: ${Math.round((1 - compressedFile.size / file.size) * 100)}%)`
      : '';

    // Step 2: Upload compressed image
    try {
      const result = await uploadImage(compressedFile, (progress) => {
        setUploadProgress(progress);
      });
      setFormData(prev => ({ ...prev, coverImage: result.url }));
      setImagePreview('');
      setUploadState('success');
      URL.revokeObjectURL(localUrl);
      addToast(`上传成功${savedRatio}`);
    } catch (err) {
      setUploadState('error');
      addToast(err.message || '上传失败', 'error');
    }
  }, [addToast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, coverImage: '' }));
    setImagePreview('');
    setUploadState('idle');
    setUploadProgress(0);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.title.length > 200) {
      addToast('标题不能超过 200 字', 'error');
      return;
    }

    if (formData.summary.length > 500) {
      addToast('摘要不能超过 500 字', 'error');
      return;
    }

    if (formData.status === 'published') {
      if (!formData.title || !formData.summary || !formData.content || !formData.coverImage || !formData.categoryId) {
        addToast('请填写所有必填字段', 'error');
        return;
      }
    } else {
      if (!formData.title) {
        addToast('标题不能为空', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      const postData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        coverImage: formData.coverImage.trim(),
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        tags: tagsArray,
        status: formData.status,
      };

      if (postId) {
        await postsApi.update(postId, postData);
      } else {
        await postsApi.create(postData);
      }

      if (formData.status === 'draft') {
        addToast('草稿保存成功！');
      } else {
        addToast(postId ? '文章更新成功！' : '文章发布成功！');
      }
      router.push(`/u/${getCurrentUsername()}/profile`);
    } catch (err) {
      addToast(err.message || (formData.status === 'draft' ? '保存草稿失败' : '操作失败'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = document.querySelector(`.${styles.contentEditor}`);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    const newText = before + prefix + selectedText + suffix + after;
    setFormData(prev => ({ ...prev, content: newText }));
    
    setTimeout(() => {
      textarea.focus();
      const newStart = start + prefix.length;
      const newEnd = selectedText ? newStart + selectedText.length : newStart;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // Preview rendering
  const renderPreview = () => {
    const category = categories.find(c => c.id === parseInt(formData.categoryId));
    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);

    return (
      <div className={styles.preview}>
        {formData.coverImage && (
          <div className={styles.previewCover}>
            <img src={formData.coverImage} alt="封面" className={styles.previewCoverImg} />
          </div>
        )}

        <div className={styles.previewContent}>
          <div className={styles.previewHeader}>
            {category && (
              <span className={styles.previewCategory} style={{ backgroundColor: category.color }}>
                {category.name}
              </span>
            )}
            {tags.length > 0 && (
              <div className={styles.previewTags}>
                {tags.map((tag, i) => (
                  <span key={i} className={styles.previewTag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <h1 className={styles.previewTitle}>{formData.title || '文章标题预览'}</h1>
          <p className={styles.previewSummary}>{formData.summary || '文章摘要预览'}</p>
          <div className={styles.previewBody}>
            {formData.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {formData.content}
              </ReactMarkdown>
            ) : (
              <p className={styles.previewPlaceholder}>文章内容预览区域</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* Hero Gradient Bar */}
      <div className={styles.heroBar}>
        <div className={styles.heroContent}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeft size={18} />
            <span>返回</span>
          </button>
          <div>
            <h1 className={styles.pageTitle}>
              <Sparkles size={24} className={styles.titleIcon} />
              {postId ? '编辑文章' : '创作你的文章'}
            </h1>
            <p className={styles.pageSubtitle}>{postId ? '修改并更新你的文章内容' : '分享你的知识与见解，与世界连接'}</p>
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <div className={styles.mainLayout}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Panel: General info */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>基本信息</h2>
              <div className={styles.modeToggles}>
                <button
                  type="button"
                  className={`${styles.modeToggle} ${!previewMode ? styles.modeToggleActive : ''}`}
                  onClick={() => setPreviewMode(false)}
                  title="编辑"
                >
                  <EyeOff size={16} />
                  <span>编辑</span>
                </button>
                <button
                  type="button"
                  className={`${styles.modeToggle} ${previewMode ? styles.modeToggleActive : ''}`}
                  onClick={() => setPreviewMode(true)}
                  title="预览"
                >
                  <Eye size={16} />
                  <span>预览</span>
                </button>
              </div>
            </div>

            {previewMode ? renderPreview() : (
              <>
                {/* Title */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    文章标题 <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="给你的文章起个响亮的标题..."
                    maxLength={200}
                  />
                  <span className={styles.charCount}>{formData.title.length}/200</span>
                </div>

                {/* Summary */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    文章摘要 <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    value={formData.summary}
                    onChange={(e) => handleChange('summary', e.target.value)}
                    placeholder="用一两句话概括文章内容，吸引读者..."
                    rows={3}
                    maxLength={500}
                  />
                  <span className={styles.charCount}>{formData.summary.length}/500</span>
                </div>

                {/* Category & Tags Row */}
                <div className={styles.row}>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label className={styles.label}>
                      分类 <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={formData.categoryId}
                      onChange={(e) => handleChange('categoryId', e.target.value)}
                    >
                      <option value="">选择分类</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label className={styles.label}>状态</label>
                    <select
                      className={styles.select}
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                    >
                      <option value="published">发布</option>
                      <option value="draft">保存草稿</option>
                    </select>
                  </div>
                  <div className={styles.field} style={{ flex: 2 }}>
                    <label className={styles.label}>标签</label>
                    <div className={styles.inputIconGroup}>
                      <Tag size={16} className={styles.inputGroupIcon} />
                      <input
                        type="text"
                        className={styles.inputInline}
                        value={formData.tags}
                        onChange={(e) => handleChange('tags', e.target.value)}
                        placeholder="用英文逗号分隔多个标签"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Panel: Cover image */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                封面图片 <span className={styles.required}>*</span>
              </h2>
              {formData.coverImage && (
                <button type="button" className={styles.removeBtn} onClick={handleRemoveImage}>
                  <X size={14} />
                  移除
                </button>
              )}
            </div>

            {!formData.coverImage ? (
              <div
                className={`${styles.dropZone} ${uploadState === 'uploading' ? styles.dropZoneUploading : ''} ${uploadState === 'error' ? styles.dropZoneError : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={handleFileClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                {uploadState === 'uploading' ? (
                  <div className={styles.uploadProgress}>
                    <Loader2 size={28} className={styles.spinning} />
                    <p className={styles.uploadText}>正在上传... {uploadProgress}%</p>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.dropIcon}>
                      <Upload size={32} />
                    </div>
                    <p className={styles.dropTitle}>拖拽图片到此处或点击上传</p>
                    <p className={styles.dropHint}>支持 JPG、PNG、GIF、WebP、BMP、SVG，最大 10MB</p>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.coverPreview}>
                <div className={styles.coverOverlay}>
                  {uploadState === 'uploading' ? (
                    <div className={styles.coverStatus}>
                      <Loader2 size={24} className={styles.spinning} />
                      <span>上传中 {uploadProgress}%</span>
                    </div>
                  ) : uploadState === 'success' ? (
                    <div className={styles.coverStatus}>
                      <CheckCircle size={24} />
                      <span>上传成功</span>
                    </div>
                  ) : null}
                </div>
                <img
                  src={imagePreview || formData.coverImage}
                  alt="封面预览"
                  className={styles.coverImg}
                />
              </div>
            )}
          </div>

          {/* Panel: Content */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                文章内容 <span className={styles.required}>*</span>
              </h2>
            </div>
            {!previewMode && (
              <>
                <div className={styles.toolbar}>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('# ')} title="标题">
                    <Heading1 size={16} />
                  </button>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('## ')} title="二级标题">
                    <Heading2 size={16} />
                  </button>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('**', '**')} title="粗体">
                    <Bold size={16} />
                  </button>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('*', '*')} title="斜体">
                    <Italic size={16} />
                  </button>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('- ')} title="无序列表">
                    <List size={16} />
                  </button>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('1. ')} title="有序列表">
                    <ListOrdered size={16} />
                  </button>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('> ')} title="引用">
                    <Quote size={16} />
                  </button>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('```\n', '\n```')} title="代码块">
                    <Code size={16} />
                  </button>
                  <button type="button" className={styles.toolbarBtn} onClick={() => insertMarkdown('[', '](url)')} title="链接">
                    <Link2 size={16} />
                  </button>
                </div>
                <textarea
                  className={styles.contentEditor}
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="开始写你的文章内容...支持 Markdown 格式，如 **粗体**、*斜体*、# 标题、- 列表等"
                  rows={18}
                />
                <div className={styles.contentFooter}>
                  <FileImage size={14} />
                  <span>支持 Markdown 语法：标题、粗体、斜体、列表、引用、代码块、表格等</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actionsBar}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
              取消
            </button>
            <div className={styles.autoSaveIndicator}>
              {autoSaveStatus === 'saving' && (
                <>
                  <Loader2 size={14} className={styles.spinning} />
                  <span className={styles.autoSaveText}>自动保存中...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <CheckCircle size={14} className={styles.autoSaveSuccess} />
                  <span className={styles.autoSaveText}>已自动保存</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <AlertCircle size={14} className={styles.autoSaveError} />
                  <span className={styles.autoSaveText}>保存失败，请手动保存</span>
                </>
              )}
              {autoSaveTime && autoSaveStatus === '' && (
                <>
                  <Clock size={14} />
                  <span className={styles.autoSaveText}>最后保存: {autoSaveTime.toLocaleTimeString('zh-CN')}</span>
                </>
              )}
            </div>
            <button
              type="button"
              className={styles.draftBtn}
              onClick={() => handleChange('status', 'draft')}
              disabled={loading}
            >
              <Save size={18} />
              存为草稿
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className={styles.spinning} />
                  {formData.status === 'draft' ? '保存中...' : '发布中...'}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {formData.status === 'draft' ? '保存草稿' : '发布文章'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
