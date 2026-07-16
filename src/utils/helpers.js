/**
 * 格式化日期为友好显示
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

/**
 * 截断文本到指定长度
 */
export function truncateText(text, maxLength = 150) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

/**
 * 格式化阅读量
 */
export function formatViews(views) {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'k';
  }
  return String(views);
}

/**
 * 格式化阅读时间（按中文估算）
 */
export function estimateReadingTime(content) {
  if (!content) return 1;
  const chineseChars = content.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const englishWords = content.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(Boolean).length;
  const totalMinutes = Math.ceil((chineseChars / 300) + (englishWords / 200));
  return Math.max(1, totalMinutes);
}

/**
 * 分页逻辑
 */
export function paginate(items, page, perPage = 6) {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (safePage - 1) * perPage;
  const endIndex = startIndex + perPage;

  return {
    items: items.slice(startIndex, endIndex),
    currentPage: safePage,
    totalPages,
    totalItems,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

/**
 * 搜索过滤文章
 */
export function searchPosts(posts, query) {
  if (!query.trim()) return posts;
  const q = query.toLowerCase().trim();
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(q) ||
      post.summary.toLowerCase().includes(q) ||
      post.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      post.category.name.toLowerCase().includes(q)
  );
}

/**
 * 异步模拟延迟
 */
export function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
