'use client';

import PostEditor from '@/components/PostEditor';

// 新建文章：复用共享编辑器组件（编辑态由 write/[id] 复用同一组件）
export default function WriteNewPage() {
  return <PostEditor />;
}
