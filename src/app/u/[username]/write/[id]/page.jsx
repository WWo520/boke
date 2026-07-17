'use client';

import PostEditor from '@/components/PostEditor';

// 编辑文章：与新建复用同一共享编辑器组件（内部按路由参数 id 判断编辑/新建）
export default function WriteEditPage() {
  return <PostEditor />;
}
