# 墨客博客 — CSDN风格重构设计方案

---

## 一、项目概况

### 1.1 项目定位

基于现有墨客博客系统，重构为**技术社区型博客平台**，借鉴CSDN的核心特性，打造面向开发者的技术内容分享平台。

### 1.2 设计原则

| 原则 | 描述 |
|------|------|
| **技术社区化** | 强化技术标签、分类体系、技术问答，打造技术交流氛围 |
| **内容价值化** | 建立文章推荐机制、排行榜、精选内容，提升内容质量 |
| **用户成长体系** | 积分、等级、成就系统，激励用户创作和互动 |
| **互动增强** | 评论楼中楼、@提及、关注/粉丝关系 |
| **SEO优化** | 完善页面SEO、结构化数据、站点地图 |
| **数据驱动** | 基于用户行为数据优化推荐和内容展示 |

### 1.3 功能优先级调整

| 优先级 | 功能模块 | 说明 |
|--------|---------|------|
| P0 | 全文搜索 | 支持文章标题、内容、标签的全文检索 |
| P0 | 技术排行榜 | 阅读排行、评论排行、作者排行、热度排行 |
| P0 | 专栏系统 | 支持作者创建和管理专栏 |
| P1 | 用户技术主页 | 展示用户技术栈、统计数据、关注关系 |
| P1 | 评论楼中楼 | 支持评论的多级回复 |
| P1 | 关注/粉丝系统 | 用户间的关注关系 |
| P1 | 积分等级系统 | 基于行为的积分和等级机制 |
| P1 | 技术问答 | 类似CSDN问答的提问/回答功能 |
| P1 | 文章推荐 | 基于用户行为的个性化推荐 |
| P2 | 消息通知 | 评论回复、点赞、关注等通知 |
| P2 | 收藏夹管理 | 用户收藏文章分类管理 |
| P2 | 数据统计分析 | 管理员数据看板、作者数据分析 |

---

## 二、技术选型决策

### 2.1 前端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| React | 18 | 前端框架 | 成熟稳定，生态完善 |
| React Router | 6 | 路由管理 | SPA路由方案，支持嵌套路由 |
| Vite | 5 | 构建工具 | 极速开发体验，HMR快速热更新 |
| CSS Modules | - | 样式隔离 | 组件级样式隔离，避免命名冲突 |
| Lucide React | 0.441 | 图标库 | 现代图标设计，体积小 |
| react-markdown | 9 | Markdown渲染 | 灵活可扩展，支持语法高亮 |
| remark-gfm | 4 | GFM支持 | GitHub风格Markdown |
| rehype-highlight | 7 | 代码高亮 | 支持多种编程语言语法高亮 |
| react-helmet-async | 2 | SEO Meta | 管理页面Meta标签 |
| debounce | - | 搜索防抖 | 优化搜索性能 |
| react-infinite-scroll-component | - | 无限滚动 | 优化列表加载体验 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| Express | 4 | 后端框架 | 轻量级，生态成熟 |
| PostgreSQL | 16 | 数据库 | 支持全文搜索、JSON、数组类型 |
| pg | 8 | PostgreSQL驱动 | 官方驱动，稳定可靠 |
| JWT | 9 | 认证令牌 | 无状态认证，便于扩展 |
| bcryptjs | 2 | 密码哈希 | 安全的密码存储 |
| multer | 2 | 文件上传 | 成熟的文件处理方案 |
| cors | 2 | 跨域支持 | 处理跨域请求 |
| helmet | 7 | 安全中间件 | 设置安全HTTP头 |
| compression | 1 | 响应压缩 | 提升传输性能 |
| rate-limit | 6 | 请求限流 | 防止API滥用 |

### 2.3 数据库全文搜索方案

使用PostgreSQL内置的**全文搜索**功能：
- `tsvector` + `tsquery` 实现高效全文检索
- `GIN`索引加速搜索
- 使用`pg_trgm`扩展支持中文模糊搜索
- 支持多字段搜索（标题、摘要、正文）

### 2.4 推荐算法方案

基于**协同过滤**的文章推荐：
- 基于用户行为（点赞、收藏、阅读时长）
- 基于文章相似度（标签、分类）
- 基于用户关注关系（关注用户的文章）
- 简单加权算法实现，后期可扩展机器学习模型

---

## 三、数据库Schema变更计划

### 3.1 现有表结构评估

| 表名 | 评估 | 变更 |
|------|------|------|
| users | 基础信息完整 | 新增字段：followersCount, followingCount, level, points, title, company, location, website |
| posts | 基础结构完整 | 新增字段：columnId, hotScore, lastCommentAt, likeCount, favoriteCount |
| categories | 基础结构完整 | 新增字段：orderNum, postCount |
| post_tags | 基础结构完整 | 新增索引优化 |
| comments | 基础结构简单 | 新增字段：parentId（支持楼中楼） |
| post_likes | 基础结构完整 | 无需变更 |
| post_favorites | 基础结构完整 | 新增字段：folderId |

### 3.2 需要新建的表

| 表名 | 描述 | 核心字段 |
|------|------|---------|
| columns | 专栏表 | id, name, slug, description, coverImage, authorId, postCount, viewCount, createdAt |
| column_posts | 专栏文章关联表 | columnId, postId, orderNum |
| user_follows | 用户关注表 | userId, followId, createdAt |
| user_points | 用户积分记录表 | userId, type, points, description, createdAt |
| notifications | 消息通知表 | userId, type, content, read, relatedId, relatedType, createdAt |
| questions | 问答表 | id, title, content, authorId, status, views, answers, acceptedAnswerId, createdAt |
| answers | 回答表 | id, questionId, authorId, content, votes, accepted, createdAt |
| answer_votes | 回答投票表 | answerId, userId, voteType, createdAt |
| favorite_folders | 收藏夹表 | id, name, userId, createdAt |
| user_activity | 用户活动记录表 | userId, type, content, relatedId, relatedType, createdAt |

### 3.3 Schema变更脚本

```sql
-- 1. users表新增字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS "followersCount" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "followingCount" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';

-- 2. posts表新增字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "columnId" INTEGER REFERENCES columns(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hotScore INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "lastCommentAt" TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "likeCount" INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "favoriteCount" INTEGER DEFAULT 0;

-- 3. categories表新增字段
ALTER TABLE categories ADD COLUMN IF NOT EXISTS orderNum INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS "postCount" INTEGER DEFAULT 0;

-- 4. comments表新增字段（楼中楼支持）
ALTER TABLE comments ADD COLUMN IF NOT EXISTS "parentId" INTEGER REFERENCES comments(id);

-- 5. post_favorites表新增字段（收藏夹支持）
ALTER TABLE post_favorites ADD COLUMN IF NOT EXISTS "folderId" INTEGER REFERENCES favorite_folders(id);

-- 6. 创建posts全文搜索索引
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE posts SET "searchVector" = to_tsvector('english', title || ' ' || summary || ' ' || content);
ALTER TABLE posts ADD CONSTRAINT "idx_posts_search" GIN ("searchVector");

-- 7. 创建专栏表
CREATE TABLE IF NOT EXISTS columns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  "coverImage" TEXT DEFAULT '',
  "authorId" INTEGER REFERENCES users(id),
  "postCount" INTEGER DEFAULT 0,
  "viewCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 创建专栏文章关联表
CREATE TABLE IF NOT EXISTS column_posts (
  id SERIAL PRIMARY KEY,
  "columnId" INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  orderNum INTEGER DEFAULT 0,
  UNIQUE("columnId", "postId")
);

-- 9. 创建用户关注表
CREATE TABLE IF NOT EXISTS user_follows (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "followId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "followId")
);

-- 10. 创建用户积分记录表
CREATE TABLE IF NOT EXISTS user_points (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT DEFAULT '',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. 创建消息通知表
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  "relatedId" INTEGER DEFAULT NULL,
  "relatedType" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. 创建问答表
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "authorId" INTEGER REFERENCES users(id),
  tags TEXT[],
  status TEXT DEFAULT 'open',
  views INTEGER DEFAULT 0,
  answers INTEGER DEFAULT 0,
  "acceptedAnswerId" INTEGER REFERENCES answers(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. 创建回答表
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  "questionId" INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  "authorId" INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  accepted BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. 创建回答投票表
CREATE TABLE IF NOT EXISTS answer_votes (
  id SERIAL PRIMARY KEY,
  "answerId" INTEGER NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "voteType" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("answerId", "userId")
);

-- 15. 创建收藏夹表
CREATE TABLE IF NOT EXISTS favorite_folders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. 创建用户活动记录表
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  "relatedId" INTEGER DEFAULT NULL,
  "relatedType" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. 创建排行榜视图
CREATE VIEW post_rankings AS
SELECT 
  p.id,
  p.title,
  p.slug,
  p."coverImage",
  p.views,
  p."likeCount",
  p."favoriteCount",
  (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as commentCount,
  p.hotScore,
  p."authorId",
  u.name as authorName,
  u.avatar as authorAvatar,
  p."publishedAt"
FROM posts p
JOIN users u ON p."authorId" = u.id
WHERE p.status = 'published'
ORDER BY p.hotScore DESC, p.views DESC;

-- 18. 创建作者排行榜视图
CREATE VIEW author_rankings AS
SELECT 
  u.id,
  u.name,
  u.avatar,
  u.bio,
  u.level,
  u.points,
  COUNT(DISTINCT p.id) as postCount,
  SUM(p.views) as totalViews,
  SUM(p."likeCount") as totalLikes,
  (SELECT COUNT(*) FROM user_follows WHERE "followId" = u.id) as followersCount
FROM users u
LEFT JOIN posts p ON u.id = p."authorId" AND p.status = 'published'
GROUP BY u.id, u.name, u.avatar, u.bio, u.level, u.points
ORDER BY followersCount DESC, totalViews DESC;

-- 19. 创建标签排行榜视图
CREATE VIEW tag_rankings AS
SELECT 
  tag,
  COUNT(*) as postCount,
  SUM(p.views) as totalViews
FROM post_tags pt
JOIN posts p ON pt."postId" = p.id AND p.status = 'published'
GROUP BY tag
ORDER BY postCount DESC, totalViews DESC;

-- 20. 创建索引
CREATE INDEX IF NOT EXISTS "idx_questions_tags" ON questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS "idx_answers_questionId" ON answers("questionId");
CREATE INDEX IF NOT EXISTS "idx_user_follows_userId" ON user_follows("userId");
CREATE INDEX IF NOT EXISTS "idx_user_follows_followId" ON user_follows("followId");
CREATE INDEX IF NOT EXISTS "idx_notifications_userId" ON notifications("userId");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON notifications("userId", read);
CREATE INDEX IF NOT EXISTS "idx_post_tags_tag" ON post_tags(tag);
```

---

## 四、API重构计划

### 4.1 现有API评估

| API模块 | 评估 | 变更 |
|---------|------|------|
| 认证API | 完整 | 新增用户等级/积分/头衔返回 |
| 文章API | 基础完整 | 新增搜索、排行榜、热度计算 |
| 用户API | 基础完整 | 新增关注/粉丝、等级积分、活动记录 |
| 评论API | 基础简单 | 新增楼中楼回复 |
| 分类API | 基础完整 | 新增排序、文章数 |
| 管理API | 基础完整 | 扩展专栏管理、用户管理、数据分析 |

### 4.2 需要新增的API

#### 4.2.1 搜索API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/search/posts` | GET | - | 搜索文章（标题、内容、标签） |
| `/api/search/users` | GET | - | 搜索用户 |
| `/api/search/tags` | GET | - | 搜索标签 |
| `/api/search/questions` | GET | - | 搜索问答 |
| `/api/search/suggestions` | GET | - | 搜索建议（实时提示） |

**搜索文章请求**：
```
GET /api/search/posts?q=react&page=1&pageSize=10&categoryId=1
```

**响应**：
```json
{
  "posts": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "suggestions": ["react", "react-native", "react-router"]
}
```

**搜索建议请求**：
```
GET /api/search/suggestions?q=rea
```

**响应**：
```json
{
  "posts": ["React 18 新特性详解", "React Hooks 最佳实践"],
  "users": ["react_master", "react_dev"],
  "tags": ["react", "react-native", "react-router"],
  "questions": ["React 性能优化方案", "React 和 Vue 对比"]
}
```

#### 4.2.2 排行榜API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/rankings/posts` | GET | - | 文章排行榜 |
| `/api/rankings/authors` | GET | - | 作者排行榜 |
| `/api/rankings/tags` | GET | - | 标签热度排行 |
| `/api/rankings/questions` | GET | - | 问答热度排行 |

**文章排行榜请求**：
```
GET /api/rankings/posts?period=weekly&limit=20
```

**响应**：
```json
{
  "rankings": [
    {
      "rank": 1,
      "id": 1,
      "title": "React 18 新特性详解",
      "slug": "react-18-features",
      "coverImage": "/uploads/cover.png",
      "views": 10000,
      "likeCount": 500,
      "commentCount": 100,
      "author": { "name": "张三", "avatar": "/uploads/avatar.png" },
      "hotScore": 15000
    }
  ],
  "period": "weekly",
  "trending": [2, -5, 8]
}
```

#### 4.2.3 专栏API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/columns` | GET | - | 获取专栏列表 |
| `/api/columns/:slug` | GET | - | 获取专栏详情 |
| `/api/columns` | POST | auth | 创建专栏 |
| `/api/columns/:id` | PUT | auth | 更新专栏 |
| `/api/columns/:id` | DELETE | auth | 删除专栏 |
| `/api/columns/:id/posts` | POST | auth | 添加文章到专栏 |
| `/api/columns/:id/posts/:postId` | DELETE | auth | 从专栏移除文章 |
| `/api/columns/:id/subscribe` | POST | auth | 订阅专栏 |
| `/api/columns/:id/unsubscribe` | POST | auth | 取消订阅 |

**创建专栏请求**：
```json
{
  "name": "React 进阶之路",
  "slug": "react-advanced",
  "description": "深入探索 React 技术栈的高级特性",
  "coverImage": "/uploads/column-cover.png"
}
```

#### 4.2.4 关注API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/users/follow/:userId` | POST | auth | 关注用户 |
| `/api/users/unfollow/:userId` | POST | auth | 取消关注 |
| `/api/users/:username/followers` | GET | - | 获取粉丝列表 |
| `/api/users/:username/following` | GET | - | 获取关注列表 |
| `/api/users/:username/followed` | GET | auth | 检查是否关注 |
| `/api/users/feed` | GET | auth | 获取关注用户动态 |

**获取关注动态请求**：
```
GET /api/users/feed?page=1&pageSize=20
```

**响应**：
```json
{
  "activities": [
    {
      "type": "post",
      "content": "张三发布了新文章《React 18 新特性详解》",
      "author": { "name": "张三", "avatar": "/uploads/avatar.png" },
      "relatedId": 1,
      "relatedType": "post",
      "createdAt": "2026-01-01T12:00:00.000Z"
    },
    {
      "type": "follow",
      "content": "李四关注了王五",
      "author": { "name": "李四", "avatar": "/uploads/avatar.png" },
      "relatedId": 5,
      "relatedType": "user",
      "createdAt": "2026-01-01T11:30:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

#### 4.2.5 评论API（楼中楼）

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/comments/:postId` | GET | - | 获取评论（含回复） |
| `/api/comments` | POST | auth | 创建评论（支持parentId） |
| `/api/comments/:id/replies` | GET | - | 获取评论的回复列表 |
| `/api/comments/:id/like` | POST | auth | 点赞评论 |
| `/api/comments/:id` | DELETE | auth | 删除评论 |

**创建带回复的评论**：
```json
{
  "postId": 1,
  "content": "@张三 说得很对！",
  "parentId": 10
}
```

**获取评论响应**：
```json
{
  "comments": [
    {
      "id": 1,
      "postId": 1,
      "author": "张三",
      "avatar": "/uploads/avatar.png",
      "content": "太棒了！",
      "likes": 5,
      "replies": [
        {
          "id": 10,
          "parentId": 1,
          "author": "李四",
          "avatar": "/uploads/avatar2.png",
          "content": "@张三 说得很对！",
          "likes": 3,
          "createdAt": "2026-01-01T12:30:00.000Z"
        }
      ],
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "total": 10
}
```

#### 4.2.6 积分API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/users/points` | GET | auth | 获取当前用户积分记录 |
| `/api/users/level` | GET | auth | 获取当前用户等级信息 |
| `/api/users/points/rules` | GET | - | 获取积分规则说明 |

**积分规则响应**：
```json
{
  "rules": [
    { "action": "publish_post", "points": 100, "description": "发布文章" },
    { "action": "publish_draft", "points": 10, "description": "保存草稿" },
    { "action": "like_post", "points": 5, "description": "点赞文章" },
    { "action": "comment", "points": 10, "description": "发表评论" },
    { "action": "article_liked", "points": 20, "description": "文章被点赞" },
    { "action": "article_commented", "points": 15, "description": "文章被评论" },
    { "action": "answer_question", "points": 50, "description": "回答问题" },
    { "action": "answer_accepted", "points": 200, "description": "回答被采纳" },
    { "action": "follow_user", "points": 5, "description": "关注用户" },
    { "action": "daily_login", "points": 10, "description": "每日登录" }
  ],
  "levels": [
    { "level": 1, "name": "新手", "minPoints": 0, "icon": "🌱" },
    { "level": 2, "name": "初级开发者", "minPoints": 500, "icon": "👨‍💻" },
    { "level": 3, "name": "中级开发者", "minPoints": 2000, "icon": "🧑‍💻" },
    { "level": 4, "name": "高级开发者", "minPoints": 5000, "icon": "👩‍💻" },
    { "level": 5, "name": "技术专家", "minPoints": 10000, "icon": "🎯" },
    { "level": 6, "name": "架构师", "minPoints": 20000, "icon": "🏗️" },
    { "level": 7, "name": "技术领袖", "minPoints": 50000, "icon": "⭐" }
  ]
}
```

#### 4.2.7 通知API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/notifications` | GET | auth | 获取通知列表 |
| `/api/notifications/unread` | GET | auth | 获取未读通知数 |
| `/api/notifications/:id/read` | POST | auth | 标记通知已读 |
| `/api/notifications/read-all` | POST | auth | 标记全部已读 |

**通知类型**：
| 类型 | 说明 |
|------|------|
| `comment_reply` | 评论被回复 |
| `article_liked` | 文章被点赞 |
| `article_commented` | 文章被评论 |
| `follow` | 被关注 |
| `answer_accepted` | 回答被采纳 |
| `column_updated` | 订阅的专栏更新 |

#### 4.2.8 问答API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/questions` | GET | - | 获取问答列表 |
| `/api/questions/:id` | GET | - | 获取问答详情 |
| `/api/questions` | POST | auth | 发布问题 |
| `/api/questions/:id` | PUT | auth | 更新问题 |
| `/api/questions/:id` | DELETE | auth | 删除问题 |
| `/api/questions/:id/answers` | POST | auth | 回答问题 |
| `/api/answers/:id/vote` | POST | auth | 投票回答 |
| `/api/answers/:id/accept` | POST | auth | 采纳回答 |

**发布问题请求**：
```json
{
  "title": "React 18 并发模式如何使用？",
  "content": "最近在学习 React 18，想了解并发模式的具体使用方法...",
  "tags": ["react", "frontend", "javascript"]
}
```

**问答详情响应**：
```json
{
  "id": 1,
  "title": "React 18 并发模式如何使用？",
  "content": "最近在学习 React 18...",
  "author": { "name": "张三", "avatar": "/uploads/avatar.png", "level": 3 },
  "tags": ["react", "frontend", "javascript"],
  "status": "open",
  "views": 500,
  "answers": 5,
  "acceptedAnswerId": 10,
  "answersList": [
    {
      "id": 10,
      "content": "React 18 的并发模式主要通过 startTransition...",
      "author": { "name": "李四", "avatar": "/uploads/avatar2.png", "level": 4 },
      "votes": 25,
      "accepted": true,
      "createdAt": "2026-01-01T13:00:00.000Z"
    }
  ],
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

#### 4.2.9 推荐API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/recommend/posts` | GET | auth | 获取个性化文章推荐 |
| `/api/recommend/questions` | GET | auth | 获取推荐问答 |
| `/api/recommend/users` | GET | auth | 获取推荐关注用户 |

**文章推荐响应**：
```json
{
  "posts": [
    {
      "id": 1,
      "title": "React 18 新特性详解",
      "slug": "react-18-features",
      "coverImage": "/uploads/cover.png",
      "reason": "基于您的阅读历史",
      "score": 0.92
    }
  ],
  "total": 20
}
```

#### 4.2.10 收藏夹API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/favorite/folders` | GET | auth | 获取收藏夹列表 |
| `/api/favorite/folders` | POST | auth | 创建收藏夹 |
| `/api/favorite/folders/:id` | PUT | auth | 更新收藏夹 |
| `/api/favorite/folders/:id` | DELETE | auth | 删除收藏夹 |
| `/api/favorite/folders/:id/posts` | GET | auth | 获取收藏夹文章 |
| `/api/favorite/posts` | POST | auth | 添加文章到收藏夹 |
| `/api/favorite/posts/:postId` | DELETE | auth | 移除收藏文章 |

#### 4.2.11 活动记录API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/users/:username/activity` | GET | - | 获取用户活动记录 |

### 4.3 API响应格式规范

统一响应格式：
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "pagination": { "page": 1, "pageSize": 10, "total": 100 }
}
```

错误响应格式：
```json
{
  "code": 400,
  "message": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": { "title": "标题不能为空" }
  }
}
```

---

## 五、前端路由与组件重构计划

### 5.1 路由重构

#### 5.1.1 公共页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页（文章列表+排行榜+分类+问答入口） |
| `/search` | Search | 搜索结果页 |
| `/search?q=xxx` | Search | 搜索结果页（带参数） |
| `/rankings` | Rankings | 排行榜页面 |
| `/column/:slug` | ColumnDetail | 专栏详情页 |
| `/column/:slug/page/:pageNum` | ColumnDetail | 专栏分页 |
| `/columns` | ColumnList | 专栏列表页 |
| `/post/:slug` | PostDetail | 文章详情 |
| `/category/:slug` | CategoryPage | 分类页面 |
| `/questions` | Questions | 问答首页 |
| `/questions/:id` | QuestionDetail | 问答详情页 |
| `/questions/new` | QuestionForm | 提问页面 |
| `/about` | About | 关于页面 |

#### 5.1.2 用户个人页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/u/:username` | UserPage | 用户技术主页 |
| `/u/:username/posts` | UserPosts | 用户文章列表 |
| `/u/:username/columns` | UserColumns | 用户专栏列表 |
| `/u/:username/questions` | UserQuestions | 用户问答列表 |
| `/u/:username/followers` | UserFollowers | 粉丝列表 |
| `/u/:username/following` | UserFollowing | 关注列表 |
| `/u/:username/activity` | UserActivity | 用户活动记录 |
| `/u/:username/favorites` | UserFavorites | 用户收藏夹 |
| `/u/:username/profile` | Profile | 个人资料管理 |
| `/u/:username/write` | PostEditor | 写文章 |
| `/u/:username/write/:id` | PostEditor | 编辑文章 |

#### 5.1.3 管理页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/admin` | Admin | 管理面板（数据统计） |
| `/admin/posts` | AdminPosts | 文章管理 |
| `/admin/comments` | AdminComments | 评论管理 |
| `/admin/categories` | AdminCategories | 分类管理 |
| `/admin/users` | AdminUsers | 用户管理 |
| `/admin/columns` | AdminColumns | 专栏管理 |
| `/admin/questions` | AdminQuestions | 问答管理 |
| `/admin/analytics` | AdminAnalytics | 数据分析 |

### 5.2 组件重构计划

#### 5.2.1 新增公共组件

| 组件 | 职责 | 位置 |
|------|------|------|
| SearchBar | 搜索框（支持实时搜索建议） | components/SearchBar.jsx |
| RankingCard | 排行榜卡片 | components/RankingCard.jsx |
| ColumnCard | 专栏卡片 | components/ColumnCard.jsx |
| FollowButton | 关注按钮 | components/FollowButton.jsx |
| CommentReply | 评论回复组件（楼中楼） | components/CommentReply.jsx |
| UserLevel | 用户等级展示 | components/UserLevel.jsx |
| NotificationList | 通知列表 | components/NotificationList.jsx |
| HotTags | 热门标签 | components/HotTags.jsx |
| QuestionCard | 问答卡片 | components/QuestionCard.jsx |
| AnswerCard | 回答卡片 | components/AnswerCard.jsx |
| FavoriteFolder | 收藏夹组件 | components/FavoriteFolder.jsx |
| ActivityItem | 活动记录项 | components/ActivityItem.jsx |
| RecommendSection | 推荐区域 | components/RecommendSection.jsx |
| DataChart | 数据图表 | components/DataChart.jsx |

#### 5.2.2 新增页面组件

| 组件 | 职责 | 位置 |
|------|------|------|
| Search | 搜索结果页 | pages/Search.jsx |
| Rankings | 排行榜页面 | pages/Rankings.jsx |
| ColumnList | 专栏列表页 | pages/ColumnList.jsx |
| ColumnDetail | 专栏详情页 | pages/ColumnDetail.jsx |
| Questions | 问答首页 | pages/Questions.jsx |
| QuestionDetail | 问答详情页 | pages/QuestionDetail.jsx |
| QuestionForm | 提问页面 | pages/QuestionForm.jsx |
| UserQuestions | 用户问答列表 | pages/UserQuestions.jsx |
| UserActivity | 用户活动记录 | pages/UserActivity.jsx |
| UserFavorites | 用户收藏夹 | pages/UserFavorites.jsx |
| AdminQuestions | 问答管理 | pages/AdminQuestions.jsx |
| AdminAnalytics | 数据分析 | pages/AdminAnalytics.jsx |

#### 5.2.3 重构页面组件

| 组件 | 重构内容 |
|------|---------|
| Home | 增加排行榜区域、热门标签、搜索框、问答入口、推荐区域 |
| UserPage | 改为技术主页，展示等级、积分、关注数、技术标签、活动记录 |
| PostDetail | 支持楼中楼评论、@提及、积分展示、推荐文章 |
| Admin | 扩展管理模块，增加专栏管理、用户管理、问答管理、数据分析 |

### 5.3 目录结构优化

```
src/
├── App.jsx                    # 应用入口组件（路由配置）
├── main.jsx                   # React 入口文件
├── index.css                  # 全局样式
├── assets/                    # 静态资源
│   └── images/               # 图片资源
├── components/               # 公共组件
│   ├── Navbar.jsx            # 导航栏（含搜索）
│   ├── Footer.jsx            # 页脚
│   ├── ArticleCard.jsx       # 文章卡片
│   ├── CommentForm.jsx       # 评论表单（支持@提及）
│   ├── CommentList.jsx       # 评论列表（支持楼中楼）
│   ├── CommentReply.jsx      # 评论回复组件
│   ├── CategoryTag.jsx       # 分类标签
│   ├── TagCloud.jsx          # 标签云
│   ├── HotTags.jsx           # 热门标签
│   ├── SearchBar.jsx         # 搜索框
│   ├── RankingCard.jsx       # 排行榜卡片
│   ├── ColumnCard.jsx        # 专栏卡片
│   ├── FollowButton.jsx      # 关注按钮
│   ├── UserLevel.jsx         # 用户等级
│   ├── NotificationList.jsx  # 通知列表
│   ├── QuestionCard.jsx      # 问答卡片
│   ├── AnswerCard.jsx        # 回答卡片
│   ├── FavoriteFolder.jsx    # 收藏夹组件
│   ├── ActivityItem.jsx      # 活动记录项
│   ├── RecommendSection.jsx  # 推荐区域
│   ├── DataChart.jsx         # 数据图表
│   ├── LoadingSpinner.jsx    # 加载动画
│   ├── PageLoader.jsx        # 页面加载器
│   ├── Skeleton.jsx          # 骨架屏
│   └── Toast.jsx             # 消息提示
├── pages/                    # 页面组件
│   ├── Home.jsx              # 首页（含排行榜、推荐）
│   ├── Search.jsx            # 搜索结果页
│   ├── Rankings.jsx          # 排行榜页面
│   ├── PostDetail.jsx        # 文章详情
│   ├── CategoryPage.jsx      # 分类页面
│   ├── ColumnList.jsx        # 专栏列表页
│   ├── ColumnDetail.jsx      # 专栏详情页
│   ├── Questions.jsx         # 问答首页
│   ├── QuestionDetail.jsx    # 问答详情页
│   ├── QuestionForm.jsx      # 提问页面
│   ├── PostEditor.jsx        # 文章编辑（支持专栏选择）
│   ├── UserPage.jsx          # 用户技术主页
│   ├── UserPosts.jsx         # 用户文章列表
│   ├── UserColumns.jsx       # 用户专栏列表
│   ├── UserQuestions.jsx     # 用户问答列表
│   ├── UserFollowers.jsx     # 粉丝列表
│   ├── UserFollowing.jsx     # 关注列表
│   ├── UserActivity.jsx      # 用户活动记录
│   ├── UserFavorites.jsx     # 用户收藏夹
│   ├── Profile.jsx           # 个人资料管理
│   ├── Admin.jsx             # 管理面板
│   ├── AdminPosts.jsx        # 文章管理
│   ├── AdminComments.jsx     # 评论管理
│   ├── AdminCategories.jsx   # 分类管理
│   ├── AdminUsers.jsx        # 用户管理
│   ├── AdminColumns.jsx      # 专栏管理
│   ├── AdminQuestions.jsx    # 问答管理
│   ├── AdminAnalytics.jsx    # 数据分析
│   ├── About.jsx             # 关于页面
│   └── NotFound.jsx          # 404页面
├── api/                      # API 客户端
│   ├── index.js              # 请求封装
│   ├── auth.js               # 认证 API
│   ├── posts.js              # 文章 API
│   ├── users.js              # 用户 API
│   ├── comments.js           # 评论 API
│   ├── categories.js         # 分类 API
│   ├── columns.js            # 专栏 API
│   ├── search.js             # 搜索 API
│   ├── rankings.js           # 排行榜 API
│   ├── notifications.js      # 通知 API
│   ├── questions.js          # 问答 API
│   ├── recommend.js          # 推荐 API
│   ├── favorites.js          # 收藏夹 API
│   └── admin.js              # 管理 API
├── hooks/                    # 自定义 Hooks
│   ├── useAuth.js            # 认证状态管理
│   ├── useToast.js           # 消息提示
│   ├── useLocalStorage.js    # localStorage 封装
│   ├── useSearchSuggestions.js # 搜索建议
│   ├── useInfiniteScroll.js  # 无限滚动
│   └── useNotifications.js   # 通知管理
├── utils/                    # 工具函数
│   ├── formatDate.js         # 日期格式化
│   ├── generateSlug.js       # Slug 生成
│   ├── compressImage.js      # 图片压缩
│   ├── scrollToTop.js        # 滚动到顶部
│   ├── debounce.js           # 防抖函数
│   ├── truncateText.js       # 文本截断
│   └── highlightSearch.js    # 搜索高亮
└── contexts/                 # React Context
    └── ToastContext.jsx      # Toast 上下文
```

---

## 六、分阶段实施计划

### 6.1 第一阶段：基础设施（1周）

| 任务 | 描述 | 交付物 | 验收标准 |
|------|------|--------|---------|
| 数据库迁移 | 执行Schema变更脚本，创建新表和索引 | 迁移脚本执行成功 | 所有表和索引创建完毕 |
| API基础扩展 | 新增搜索、排行榜、专栏API基础接口 | 后端路由文件 | 接口返回正确数据 |
| 前端路由重构 | 更新App.jsx路由配置 | 路由配置文件 | 页面跳转正常 |
| 安全加固 | 添加helmet、compression、rate-limit中间件 | 后端中间件配置 | 安全头正确设置 |

### 6.2 第二阶段：核心功能（2周）

| 任务 | 描述 | 交付物 | 验收标准 |
|------|------|--------|---------|
| 全文搜索 | 实现文章、用户、标签、问答的全文搜索 | Search页面、search API | 搜索结果准确，支持实时建议 |
| 排行榜系统 | 实现文章排行、作者排行、标签排行、问答排行 | Rankings页面、rankings API | 排行榜数据正确，支持时间周期筛选 |
| 专栏系统 | 实现专栏创建、管理、文章关联、订阅 | Column相关组件和API | 专栏功能完整，订阅生效 |
| 评论楼中楼 | 实现评论多级回复、@提及、点赞 | CommentReply组件、comments API | 回复功能正常，@提及高亮 |

### 6.3 第三阶段：用户体系（2周）

| 任务 | 描述 | 交付物 | 验收标准 |
|------|------|--------|---------|
| 关注系统 | 实现关注/粉丝功能、关注动态流 | FollowButton组件、follow API | 关注关系正确，动态流展示 |
| 用户技术主页 | 重构用户页面，展示等级、积分、技术栈、活动 | UserPage组件 | 页面展示完整，数据准确 |
| 积分等级系统 | 实现积分规则和等级计算、积分记录 | 用户积分API | 积分计算正确，等级晋升正常 |
| 消息通知 | 实现评论回复、点赞、关注、回答采纳通知 | NotificationList组件 | 通知功能正常，未读数正确 |

### 6.4 第四阶段：问答与推荐（1.5周）

| 任务 | 描述 | 交付物 | 验收标准 |
|------|------|--------|---------|
| 技术问答 | 实现提问、回答、投票、采纳功能 | Questions相关页面和API | 问答流程完整，投票生效 |
| 文章推荐 | 实现基于用户行为的个性化推荐 | recommend API、RecommendSection组件 | 推荐内容相关，评分合理 |
| 收藏夹管理 | 实现收藏夹创建、文章分类管理 | favorites API、UserFavorites页面 | 收藏功能正常，分类管理生效 |

### 6.5 第五阶段：管理与优化（1周）

| 任务 | 描述 | 交付物 | 验收标准 |
|------|------|--------|---------|
| 管理后台扩展 | 增加专栏管理、用户管理、问答管理、数据分析 | Admin相关页面 | 管理功能完整，数据统计准确 |
| SEO优化 | 添加结构化数据、站点地图、Meta优化 | 页面组件更新 | 搜索引擎收录正常 |
| 性能优化 | 搜索防抖、图片懒加载、缓存策略、无限滚动 | 工具函数更新 | 页面加载速度提升50%以上 |
| UI优化 | 统一设计风格、响应式优化、暗色模式 | CSS样式更新 | 界面美观一致，移动端适配 |
| 测试验证 | 功能测试、API测试、兼容性测试 | 测试报告 | 所有功能正常，无严重Bug |

---

## 七、核心功能详细设计

### 7.1 积分等级系统

#### 7.1.1 积分规则

| 行为 | 积分值 | 每日上限 | 说明 |
|------|--------|---------|------|
| 发布文章 | +100 | 500 | 发布已审核文章 |
| 保存草稿 | +10 | 50 | 保存文章草稿 |
| 点赞文章 | +5 | 50 | 点赞他人文章 |
| 发表评论 | +10 | 100 | 在文章下发表评论 |
| 文章被点赞 | +20 | 无 | 他人点赞你的文章 |
| 文章被评论 | +15 | 无 | 他人评论你的文章 |
| 回答问题 | +50 | 200 | 在问答区回答问题 |
| 回答被采纳 | +200 | 无 | 回答被提问者采纳 |
| 关注用户 | +5 | 50 | 关注其他用户 |
| 每日登录 | +10 | 10 | 每日首次登录 |
| 创建专栏 | +200 | 无 | 创建新专栏 |
| 专栏文章 | +50 | 无 | 在专栏发布文章 |

#### 7.1.2 等级体系

| 等级 | 名称 | 所需积分 | 图标 | 特权 |
|------|------|---------|------|------|
| Lv.1 | 新手 | 0 | 🌱 | 基础功能 |
| Lv.2 | 初级开发者 | 500 | 👨‍💻 | 自定义头像 |
| Lv.3 | 中级开发者 | 2000 | 🧑‍💻 | 创建专栏 |
| Lv.4 | 高级开发者 | 5000 | 👩‍💻 | 优先审核 |
| Lv.5 | 技术专家 | 10000 | 🎯 | 专属徽章 |
| Lv.6 | 架构师 | 20000 | 🏗️ | 内容推荐加权 |
| Lv.7 | 技术领袖 | 50000 | ⭐ | 全站置顶权限 |

### 7.2 热度计算算法

文章热度 = `views * 1 + likeCount * 10 + commentCount * 15 + favoriteCount * 20 - daysSincePublished * 5`

- 阅读量：基础权重1
- 点赞数：权重10
- 评论数：权重15（互动价值高）
- 收藏数：权重20（深度阅读）
- 时间衰减：每过一天减5分

### 7.3 推荐算法

推荐得分 = `userInterestScore * 0.6 + contentSimilarity * 0.3 + socialSignal * 0.1`

- 用户兴趣：基于用户历史阅读、点赞、收藏的标签偏好
- 内容相似度：基于文章标签、分类的余弦相似度
- 社交信号：关注用户的文章加权

### 7.4 数据统计分析

#### 7.4.1 管理员数据看板

| 指标 | 说明 |
|------|------|
| 总用户数 | 注册用户总数 |
| 活跃用户数 | 近30天活跃用户数 |
| 文章总数 | 已发布文章数 |
| 文章增长率 | 环比增长率 |
| 评论总数 | 总评论数 |
| 问答总数 | 问题总数 |
| 专栏总数 | 专栏总数 |
| 热门分类 | 按文章数排序 |
| 热门标签 | 按使用次数排序 |
| 用户增长趋势 | 月度用户增长图 |
| 文章发布趋势 | 月度文章发布图 |

#### 7.4.2 作者数据分析

| 指标 | 说明 |
|------|------|
| 文章阅读量 | 总阅读量、日均阅读 |
| 点赞数 | 总点赞数 |
| 评论数 | 总评论数 |
| 收藏数 | 总收藏数 |
| 粉丝增长 | 粉丝增长趋势 |
| 文章热度排行 | 个人文章热度 |
| 流量来源 | 搜索、推荐、直接访问 |

---

## 八、安全设计

### 8.1 认证安全

| 措施 | 说明 |
|------|------|
| JWT令牌 | 7天有效期，存储在localStorage |
| 密码哈希 | bcryptjs 10轮哈希 |
| 密码强度 | 6-32位，支持字母数字特殊字符 |
| 登录限流 | 1分钟内5次失败后锁定5分钟 |
| 令牌刷新 | 支持令牌刷新机制 |

### 8.2 数据安全

| 措施 | 说明 |
|------|------|
| SQL注入防护 | 参数化查询，禁止字符串拼接 |
| XSS防护 | 输入输出过滤，HTML转义 |
| CSRF防护 | 验证Referer头 |
| 文件上传安全 | 文件名随机化、大小限制、类型校验 |
| 敏感信息保护 | 禁止返回密码字段，日志脱敏 |

### 8.3 访问控制

| 措施 | 说明 |
|------|------|
| 角色权限 | 普通用户/管理员角色区分 |
| 资源归属 | 用户只能修改自己的文章/评论 |
| 路由守卫 | 前端路由权限校验 |
| API中间件 | 后端接口权限校验 |
| 管理面板 | 仅管理员可访问 |

### 8.4 安全中间件

```javascript
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '请求过于频繁，请稍后再试',
});

app.use('/api/', apiLimiter);
```

---

## 九、性能优化方案

### 9.1 前端优化

| 优化项 | 方案 | 预期效果 |
|--------|------|---------|
| 代码分割 | React.lazy + Suspense | 首屏加载体积减少60% |
| 图片优化 | Canvas压缩、WebP格式、懒加载 | 图片加载速度提升70% |
| 搜索防抖 | debounce 300ms | 减少API请求次数 |
| 无限滚动 | react-infinite-scroll-component | 避免一次性加载大量数据 |
| 缓存策略 | localStorage缓存分类、用户信息 | 减少重复请求 |
| CDN加速 | 静态资源CDN分发 | 全球访问加速 |

### 9.2 后端优化

| 优化项 | 方案 | 预期效果 |
|--------|------|---------|
| 数据库连接池 | pg默认连接池配置 | 减少连接开销 |
| 查询优化 | 索引优化、JOIN优化 | 查询速度提升50% |
| 全文搜索索引 | GIN索引 + pg_trgm | 搜索速度提升10倍 |
| 响应压缩 | compression中间件 | 传输体积减少60% |
| 请求缓存 | Redis缓存热点数据 | 减少数据库压力 |
| 异步处理 | 消息队列处理非关键操作 | 提升响应速度 |

### 9.3 数据库索引优化

| 表名 | 索引 | 用途 |
|------|------|------|
| posts | idx_posts_slug | 文章详情查询 |
| posts | idx_posts_categoryId | 分类查询 |
| posts | idx_posts_authorId | 用户文章查询 |
| posts | idx_posts_search | 全文搜索 |
| posts | idx_posts_hotScore | 排行榜查询 |
| comments | idx_comments_postId | 文章评论查询 |
| comments | idx_comments_parentId | 楼中楼回复查询 |
| questions | idx_questions_tags | 标签筛选 |
| user_follows | idx_user_follows_userId | 关注列表查询 |
| user_follows | idx_user_follows_followId | 粉丝列表查询 |

---

## 十、部署方案

### 10.1 开发环境

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发服务器 | 3000 | Vite dev server |
| 后端API | 3333 | Express server |
| PostgreSQL | 5432 | 数据库 |

### 10.2 测试环境

| 服务 | 说明 |
|------|------|
| 前端 | nginx反向代理 |
| 后端 | PM2进程管理 |
| 数据库 | PostgreSQL主从复制 |
| 缓存 | Redis |

### 10.3 生产环境

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx 反向代理                       │
│  • 80/443 端口监听                                       │
│  • HTTPS 终止 (Let's Encrypt)                           │
│  • 静态资源缓存                                           │
│  • /api/* → 后端 :3333                                   │
│  • /uploads/* → 静态目录                                  │
│  • /* → dist/index.html (SPA)                            │
│  • gzip/brotli 压缩                                      │
├─────────────────────────────────────────────────────────┤
│                    PM2 进程管理                          │
│  • 后端服务进程守护                                       │
│  • 自动重启                                              │
│  • 负载均衡                                              │
├─────────────────────────────────────────────────────────┤
│                    PostgreSQL 数据库                      │
│  • 主从复制                                              │
│  • 定期备份                                              │
│  • 连接池优化                                            │
├─────────────────────────────────────────────────────────┤
│                    Redis 缓存                            │
│  • 热点数据缓存                                          │
│  • 排行榜缓存                                            │
│  • 会话管理                                              │
└─────────────────────────────────────────────────────────┘
```

### 10.4 环境变量配置

```env
NODE_ENV=production
PORT=3333
JWT_SECRET=your_secret_key_here
DB_USER=postgres
DB_HOST=localhost
DB_NAME=moke_blog
DB_PASSWORD=your_db_password
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

---

## 十一、风险评估与应对

### 11.1 技术风险

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|---------|
| PostgreSQL全文搜索中文分词效果不佳 | 中 | 高 | 使用pg_trgm扩展，结合拼音搜索 |
| 搜索性能瓶颈 | 中 | 中 | 添加GIN索引，实现搜索缓存 |
| 通知系统消息量大 | 中 | 中 | 实现分页查询，异步推送，Redis队列 |
| 楼中楼评论层级过深 | 低 | 中 | 限制最大回复层级（3层） |
| 推荐算法冷启动 | 中 | 中 | 基于热门内容初始化，渐进式优化 |
| 数据库性能瓶颈 | 中 | 高 | 添加索引，读写分离，缓存策略 |

### 11.2 项目风险

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|---------|
| 数据库迁移数据丢失 | 低 | 高 | 迁移前备份数据库，分阶段迁移 |
| 接口变更导致前端兼容问题 | 中 | 中 | 保持API向后兼容，版本控制，分批发布 |
| 开发进度延期 | 中 | 中 | 预留缓冲时间，优先级排序，敏捷迭代 |
| 安全漏洞 | 低 | 高 | 定期安全审计，依赖更新，代码审查 |

---

## 十二、代码质量保障

### 12.1 代码规范

- **前端**：使用ESLint + Prettier，遵循React官方规范
- **后端**：使用ESLint，遵循Node.js编码规范
- **数据库**：SQL语句参数化，避免SQL注入
- **Git提交**：遵循Conventional Commits规范

### 12.2 测试策略

| 测试类型 | 范围 | 工具 | 覆盖率目标 |
|---------|------|------|-----------|
| 单元测试 | API函数、工具函数 | Jest | 80% |
| 集成测试 | API接口 | Supertest | 核心接口100% |
| 前端测试 | 组件功能 | React Testing Library | 关键组件80% |
| E2E测试 | 核心流程 | Playwright | 核心流程100% |
| 性能测试 | 响应时间 | Artillery | P95 < 500ms |

### 12.3 代码审查

- 每PR至少1人审查
- 重点审查：认证逻辑、数据库查询、安全漏洞、性能优化
- 使用Code Review Checklist确保质量

---

## 十三、交付物清单

### 13.1 文档交付物

| 文档 | 说明 |
|------|------|
| CSDN风格重构设计方案.md | 本设计方案 |
| API接口文档.md | 更新后的API文档 |
| 数据模型文档.md | 更新后的数据模型 |
| 测试报告.md | 功能测试报告 |
| 部署手册.md | 生产环境部署指南 |

### 13.2 代码交付物

| 模块 | 文件 |
|------|------|
| 后端API | server/src/routes/search.js, rankings.js, columns.js, follows.js, notifications.js, questions.js, recommend.js, favorites.js |
| 数据库迁移 | server/src/migrations/migrate-v3.js |
| 前端页面 | src/pages/Search.jsx, Rankings.jsx, ColumnList.jsx, ColumnDetail.jsx, Questions.jsx, QuestionDetail.jsx, QuestionForm.jsx, UserActivity.jsx, UserFavorites.jsx, AdminAnalytics.jsx |
| 前端组件 | src/components/SearchBar.jsx, RankingCard.jsx, ColumnCard.jsx, FollowButton.jsx, QuestionCard.jsx, AnswerCard.jsx, RecommendSection.jsx, DataChart.jsx |
| 前端API | src/api/search.js, rankings.js, columns.js, notifications.js, questions.js, recommend.js, favorites.js |

### 13.3 数据库交付物

| 内容 | 说明 |
|------|------|
| 数据库Schema | 更新后的表结构和索引 |
| 视图 | post_rankings, author_rankings, tag_rankings |
| 种子数据 | 测试用专栏、排行榜、问答数据 |

---

## 十四、用户体验优化设计

### 14.1 暗色模式

#### 14.1.1 设计方案

| 主题模式 | 适用场景 | 切换方式 |
|---------|---------|---------|
| 亮色模式 | 白天、明亮环境 | 默认 |
| 暗色模式 | 夜间、低光环境 | 手动切换、自动跟随系统 |

#### 14.1.2 实现方案

```javascript
// src/contexts/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

#### 14.1.3 CSS变量设计

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-card: #ffffff;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border-color: #eeeeee;
  --accent-color: #409eff;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
}

.dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #0f3460;
  --text-primary: #ffffff;
  --text-secondary: #a0aec0;
  --text-muted: #718096;
  --border-color: #2d3748;
  --accent-color: #63b3ed;
  --success-color: #68d391;
  --warning-color: #fbd38d;
  --danger-color: #fc8181;
}
```

### 14.2 响应式设计

#### 14.2.1 断点设计

| 断点 | 屏幕宽度 | 设备类型 | 布局策略 |
|------|---------|---------|---------|
| xs | < 576px | 手机竖屏 | 单列布局，隐藏侧边栏 |
| sm | ≥ 576px | 手机横屏 | 单列布局，紧凑间距 |
| md | ≥ 768px | 平板 | 双列布局，显示部分侧边栏 |
| lg | ≥ 992px | 桌面 | 标准三列布局 |
| xl | ≥ 1200px | 大屏 | 宽屏优化，增加内容密度 |

#### 14.2.2 响应式组件策略

| 组件 | xs/sm | md | lg/xl |
|------|-------|-----|-------|
| 导航栏 | 汉堡菜单 | 紧凑导航 | 完整导航+搜索 |
| 文章列表 | 卡片堆叠 | 双列卡片 | 三列卡片 |
| 用户主页 | 垂直布局 | 两列布局 | 三列布局 |
| 评论区 | 折叠回复 | 默认展开 | 默认展开 |

### 14.3 无障碍访问（WCAG 2.1）

#### 14.3.1 键盘导航支持

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 跳转到主内容 | Ctrl + Home | 绕过导航直接进入内容区 |
| 搜索框聚焦 | Ctrl + K | 快速定位搜索框 |
| 导航菜单 | Tab/Arrow Keys | 键盘导航菜单 |
| 返回顶部 | Ctrl + ↑ | 快速返回页面顶部 |
| 评论点赞 | Enter/Space | 键盘触发交互 |

#### 14.3.2 ARIA标签支持

| 组件 | ARIA属性 | 说明 |
|------|---------|------|
| 导航栏 | `role="navigation"` | 定义导航区域 |
| 搜索框 | `aria-label="搜索文章"` | 辅助技术识别 |
| 按钮 | `aria-label="点赞文章"` | 图标按钮标签 |
| 通知 | `role="alert"` | 实时通知播报 |
| 进度条 | `aria-live="polite"` | 加载状态更新 |

### 14.4 国际化（i18n）

#### 14.4.1 支持语言

| 语言 | 代码 | 状态 |
|------|------|------|
| 简体中文 | zh-CN | 默认 |
| 繁体中文 | zh-TW | 规划 |
| 英文 | en-US | 规划 |
| 日文 | ja-JP | 规划 |

#### 14.4.2 实现方案

```javascript
// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationZH from './locales/zh-CN.json';
import translationEN from './locales/en-US.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: translationZH },
      'en-US': { translation: translationEN },
    },
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    interpolation: { escapeValue: false },
  });

export default i18n;
```

---

## 十五、实时通信设计

### 15.1 WebSocket通信

#### 15.1.1 技术选型

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| Socket.IO | 4 | WebSocket通信 | 自动重连、房间管理、跨浏览器兼容 |
| Redis | 7 | 消息队列 | 分布式消息广播 |

#### 15.1.2 连接架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端浏览器                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ Socket.IO   │   │ Socket.IO   │   │ Socket.IO   │       │
│  │  Client     │   │  Client     │   │  Client     │       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx 反向代理                            │
│  • WebSocket升级 (Upgrade: websocket)                      │
│  • 负载均衡                                                 │
├─────────────────────────────────────────────────────────────┤
│                    Express + Socket.IO Server               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Socket.IO Namespaces                                │   │
│  │  /notifications - 用户通知                           │   │
│  │  /comments - 实时评论                                │   │
│  │  /posts - 文章更新                                   │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Redis Pub/Sub                           │
│  • 跨服务器消息广播                                         │
│  • 订阅频道: notifications, comments, posts               │
└─────────────────────────────────────────────────────────────┘
```

#### 15.1.3 Socket.IO命名空间设计

| 命名空间 | 用途 | 事件 |
|---------|------|------|
| `/notifications` | 实时通知推送 | `new_notification`, `mark_read`, `unread_count` |
| `/comments` | 实时评论 | `new_comment`, `new_reply`, `like_comment` |
| `/posts` | 文章更新 | `new_post`, `update_post`, `delete_post` |
| `/questions` | 问答更新 | `new_question`, `new_answer`, `accepted_answer` |

#### 15.1.4 连接认证

```javascript
// server/src/socket/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
  
  if (!token) {
    return next(new Error('认证失败'));
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Token无效'));
  }
};

module.exports = authenticate;
```

### 15.2 消息推送机制

#### 15.2.1 推送流程

```
用户行为 → 后端处理 → 消息入队 → Redis Pub → Socket.IO广播 → 客户端接收
```

#### 15.2.2 推送事件类型

| 事件类型 | 触发场景 | 目标用户 | 优先级 |
|---------|---------|---------|-------|
| `new_comment` | 文章收到新评论 | 文章作者 | 高 |
| `new_reply` | 评论收到回复 | 被回复用户 | 高 |
| `article_liked` | 文章被点赞 | 文章作者 | 中 |
| `follow` | 被关注 | 被关注用户 | 中 |
| `answer_accepted` | 回答被采纳 | 回答者 | 高 |
| `column_updated` | 订阅专栏更新 | 订阅者 | 中 |
| `new_post` | 关注用户发布文章 | 关注者 | 低 |

#### 15.2.3 离线消息处理

| 场景 | 处理方式 |
|------|---------|
| 用户离线 | 消息存储到notifications表 |
| 用户上线 | 拉取未读消息 |
| 消息过多 | 分页加载，保留最近100条 |

---

## 十六、内容审核与安全机制

### 16.1 文章审核流程

#### 16.1.1 审核状态

| 状态 | 说明 | 可见性 |
|------|------|--------|
| `draft` | 草稿 | 仅作者可见 |
| `pending` | 待审核 | 仅作者可见 |
| `approved` | 审核通过 | 公开可见 |
| `rejected` | 审核拒绝 | 仅作者可见 |
| `deleted` | 已删除 | 不可见 |

#### 16.1.2 审核流程

```
作者发布文章 → 自动内容检测 → 
  ├─ 检测通过 → 自动审核通过 → 公开可见
  └─ 检测可疑 → 进入人工审核队列 → 
    ├─ 审核通过 → 公开可见
    └─ 审核拒绝 → 通知作者修改
```

#### 16.1.3 自动检测规则

| 检测项 | 规则 | 处理 |
|--------|------|------|
| 关键词过滤 | 匹配敏感词库 | 标记可疑，进入人工审核 |
| 内容长度 | < 50字或 > 50000字 | 拒绝或提示 |
| 图片安全 | 检测违规图片 | 替换为占位图 |
| 外链检测 | 检测恶意链接 | 自动过滤 |
| 重复内容 | 检测相似度 > 80% | 标记可疑 |

### 16.2 用户举报系统

#### 16.2.1 举报类型

| 类型 | 说明 |
|------|------|
| `spam` | 垃圾内容 |
| `inappropriate` | 不当内容 |
| `plagiarism` | 抄袭 |
| `harassment` | 骚扰 |
| `other` | 其他 |

#### 16.2.2 举报表结构

```sql
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  "reporterId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "targetType" TEXT NOT NULL,
  "targetId" INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT DEFAULT '',
  evidence TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  "processedBy" INTEGER REFERENCES users(id),
  "processedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 16.2.3 举报处理流程

```
用户提交举报 → 管理员收到通知 → 审核举报内容 → 
  ├─ 有效举报 → 处理违规内容 → 通知举报人
  └─ 无效举报 → 关闭举报 → 通知举报人
```

### 16.3 内容过滤

#### 16.3.1 敏感词过滤

```javascript
// server/src/middleware/contentFilter.js
const sensitiveWords = require('../data/sensitiveWords.json');

const filterContent = (content) => {
  let filtered = content;
  sensitiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
};

module.exports = { filterContent };
```

#### 16.3.2 XSS防护

| 位置 | 防护方式 |
|------|---------|
| 输入层 | DOMPurify清理用户输入 |
| 存储层 | HTML转义存储 |
| 输出层 | 安全渲染，禁止innerHTML |
| 富文本 | 使用sanitize-html过滤 |

---

## 十七、运营功能设计

### 17.1 活动管理

#### 17.1.1 活动类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `contest` | 征文比赛 | "React技术征文" |
| `event` | 技术活动 | "线上分享会" |
| `promotion` | 推广活动 | "新用户礼包" |
| `campaign` | 营销活动 | "积分翻倍周" |

#### 17.1.2 活动表结构

```sql
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL,
  "coverImage" TEXT DEFAULT '',
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'draft',
  "rewardPoints" INTEGER DEFAULT 0,
  "maxParticipants" INTEGER DEFAULT 0,
  "participantCount" INTEGER DEFAULT 0,
  "createdBy" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 17.2 话题管理

#### 17.2.1 话题表结构

```sql
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  "coverImage" TEXT DEFAULT '',
  "postCount" INTEGER DEFAULT 0,
  "followCount" INTEGER DEFAULT 0,
  isHot BOOLEAN DEFAULT FALSE,
  isRecommended BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 17.2.2 话题文章关联

```sql
CREATE TABLE IF NOT EXISTS topic_posts (
  "topicId" INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY("topicId", "postId")
);
```

### 17.3 友情链接

#### 17.3.1 友情链接表结构

```sql
CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT DEFAULT '',
  description TEXT DEFAULT '',
  orderNum INTEGER DEFAULT 0,
  isVisible BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 17.4 站点配置

#### 17.4.1 配置表结构

```sql
CREATE TABLE IF NOT EXISTS site_config (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT DEFAULT '',
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 17.4.2 配置项列表

| Key | Value | 说明 |
|-----|-------|------|
| `site_name` | 墨客博客 | 站点名称 |
| `site_description` | 技术社区博客平台 | 站点描述 |
| `site_keywords` | 技术博客,编程,开发 | 站点关键词 |
| `logo_url` | /uploads/logo.png | 站点Logo |
| `favicon_url` | /uploads/favicon.ico | 站点图标 |
| `default_cover_image` | /uploads/default-cover.png | 默认封面图 |
| `post_approval_required` | false | 是否需要审核 |
| `max_file_size` | 10485760 | 最大文件大小 |
| `daily_login_points` | 10 | 每日登录积分 |

---

## 十八、技术实现细节

### 18.1 Redis缓存策略

#### 18.1.1 缓存类型

| 缓存类型 | 数据 | Key格式 | 过期时间 | 更新策略 |
|---------|------|---------|---------|---------|
| 排行榜 | 文章/作者/标签排行 | `rank:posts:weekly` | 1小时 | 定时刷新 |
| 用户信息 | 用户基本信息 | `user:{id}` | 12小时 | 用户更新时失效 |
| 文章详情 | 文章内容 | `post:{slug}` | 1小时 | 文章更新时失效 |
| 分类列表 | 分类数据 | `categories` | 24小时 | 分类更新时失效 |
| 搜索建议 | 搜索提示 | `search:suggest:{keyword}` | 1小时 | 自动过期 |
| 通知计数 | 未读通知数 | `notifications:count:{userId}` | 实时 | 事件驱动更新 |

#### 18.1.2 缓存实现

```javascript
// server/src/utils/cache.js
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

const cache = {
  get: async (key) => {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },
  set: async (key, value, ttl = 3600) => {
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  },
  del: async (key) => {
    await client.del(key);
  },
  incr: async (key) => {
    await client.incr(key);
  },
  decr: async (key) => {
    await client.decr(key);
  },
};

module.exports = cache;
```

### 18.2 异步任务处理

#### 18.2.1 任务队列

| 任务类型 | 说明 | 优先级 |
|---------|------|-------|
| `send_notification` | 发送通知 | 高 |
| `update_hot_score` | 更新文章热度 | 中 |
| `update_points` | 更新用户积分 | 高 |
| `send_email` | 发送邮件 | 低 |
| `cleanup_files` | 清理临时文件 | 低 |
| `generate_sitemap` | 生成站点地图 | 低 |

#### 18.2.2 实现方案

```javascript
// server/src/queues/taskQueue.js
const Queue = require('bull');

const taskQueue = new Queue('tasks', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

taskQueue.process('send_notification', async (job) => {
  const { userId, type, content } = job.data;
  await createNotification(userId, type, content);
});

taskQueue.process('update_hot_score', async (job) => {
  const { postId } = job.data;
  await recalculateHotScore(postId);
});

module.exports = taskQueue;
```

### 18.3 日志与监控

#### 18.3.1 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| DEBUG | 开发调试 | 函数调用、参数值 |
| INFO | 正常操作 | 用户登录、文章发布 |
| WARN | 警告信息 | 过期Token、API限流 |
| ERROR | 错误信息 | 数据库连接失败、API异常 |
| FATAL | 致命错误 | 服务无法启动 |

#### 18.3.2 日志配置

```javascript
// server/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

#### 18.3.3 监控指标

| 指标 | 说明 | 采集方式 |
|------|------|---------|
| API响应时间 | 平均响应时间 | 中间件统计 |
| 请求成功率 | 成功请求比例 | 中间件统计 |
| 数据库查询时间 | SQL执行时间 | 查询日志 |
| 内存使用 | 进程内存占用 | OS监控 |
| CPU使用率 | 进程CPU占用 | OS监控 |
| 并发连接数 | WebSocket连接数 | Socket.IO统计 |

### 18.4 API版本控制

#### 18.4.1 版本策略

| 版本 | 状态 | 说明 |
|------|------|------|
| v1 | 维护中 | 现有API，兼容旧版本 |
| v2 | 开发中 | 重构后API，新增功能 |
| v3 | 规划中 | 未来版本 |

#### 18.4.2 路由设计

```javascript
// server/src/routes/index.js
const v1Routes = require('./v1');
const v2Routes = require('./v2');

app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);
app.use('/api', v2Routes);
```

---

## 十九、数据库读写分离与备份

### 19.1 读写分离方案

#### 19.1.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      应用层 (Express)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Connection Pool Manager                            │   │
│  │  • 写操作 → Master                                  │   │
│  │  • 读操作 → Slave (轮询)                            │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        数据库层                            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │   Master     │────▶│   Slave 1    │     │   Slave 2    │  │
│  │   (读写)     │     │   (只读)     │     │   (只读)     │  │
│  └──────────────┘     └──────────────┘     └──────────────┘  │
│       │                     │                     │          │
│       └─────────────────────┴─────────────────────┘          │
│                       流复制 (Streaming Replication)         │
└─────────────────────────────────────────────────────────────┘
```

#### 19.1.2 配置实现

```javascript
// server/src/db/replication.js
const { Pool } = require('pg');

const masterConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const slaveConfig = [
  { ...masterConfig, host: process.env.DB_SLAVE1_HOST },
  { ...masterConfig, host: process.env.DB_SLAVE2_HOST },
];

let slaveIndex = 0;

const masterPool = new Pool(masterConfig);
const slavePools = slaveConfig.map(cfg => new Pool(cfg));

const getSlavePool = () => {
  const pool = slavePools[slaveIndex % slavePools.length];
  slaveIndex++;
  return pool;
};

module.exports = {
  query: async (text, params, options = {}) => {
    const pool = options.write ? masterPool : getSlavePool();
    return pool.query(text, params);
  },
  masterPool,
};
```

### 19.2 备份方案

#### 19.2.1 备份策略

| 备份类型 | 频率 | 保留期 | 方式 |
|---------|------|-------|------|
| 自动全量备份 | 每日凌晨2点 | 30天 | pg_dump |
| 增量备份 | 每小时 | 7天 | WAL日志 |
| 手动备份 | 按需 | 永久 | pg_dump |

#### 19.2.2 备份脚本

```bash
#!/bin/bash
BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="moke_blog"

mkdir -p $BACKUP_DIR

pg_dump -U postgres -d $DB_NAME | gzip > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

#### 19.2.3 恢复流程

```
1. 停止应用服务
2. 备份当前数据库
3. 创建新数据库
4. 解压备份文件
5. 执行恢复命令: psql -U postgres -d moke_blog < backup.sql
6. 启动应用服务
7. 验证数据完整性
```

---

## 二十、API扩展与数据模型更新

### 20.1 新增API接口

#### 20.1.1 活动API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/activities` | GET | - | 获取活动列表 |
| `/api/activities/:id` | GET | - | 获取活动详情 |
| `/api/activities` | POST | admin | 创建活动 |
| `/api/activities/:id` | PUT | admin | 更新活动 |
| `/api/activities/:id` | DELETE | admin | 删除活动 |
| `/api/activities/:id/participate` | POST | auth | 参与活动 |

#### 20.1.2 话题API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/topics` | GET | - | 获取话题列表 |
| `/api/topics/:slug` | GET | - | 获取话题详情 |
| `/api/topics` | POST | admin | 创建话题 |
| `/api/topics/:id` | PUT | admin | 更新话题 |
| `/api/topics/:id` | DELETE | admin | 删除话题 |
| `/api/topics/:id/follow` | POST | auth | 关注话题 |

#### 20.1.3 举报API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/reports` | POST | auth | 提交举报 |
| `/api/reports` | GET | admin | 获取举报列表 |
| `/api/reports/:id` | PUT | admin | 处理举报 |

#### 20.1.4 站点配置API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/config` | GET | - | 获取站点配置 |
| `/api/config` | PUT | admin | 更新站点配置 |

### 20.2 更新数据模型

#### 20.2.1 posts表状态字段扩展

```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT DEFAULT 'approved';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "reviewedBy" INTEGER REFERENCES users(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "reviewComment" TEXT DEFAULT '';
```

#### 20.2.2 新增表汇总

| 表名 | 描述 | 核心字段 |
|------|------|---------|
| reports | 用户举报表 | reporterId, targetType, targetId, type, status |
| activities | 活动表 | title, type, startDate, endDate, rewardPoints |
| topics | 话题表 | name, slug, description, isHot, isRecommended |
| topic_posts | 话题文章关联表 | topicId, postId |
| links | 友情链接表 | name, url, logo, orderNum, isVisible |
| site_config | 站点配置表 | key, value, description |

---

## 二十一、内容创作体验增强

### 21.1 Markdown编辑器增强

#### 21.1.1 编辑器功能

| 功能 | 说明 | 快捷键 |
|------|------|--------|
| 实时预览 | Markdown实时渲染预览 | Ctrl+P |
| 代码高亮 | 支持多种编程语言语法高亮 | - |
| 代码块复制 | 一键复制代码块 | 点击复制按钮 |
| 表格插入 | 快速插入表格模板 | Ctrl+T |
| 图片上传 | 拖拽上传，自动压缩 | Ctrl+U |
| 链接插入 | 快速插入链接 | Ctrl+L |
| 标题层级 | 一键切换标题层级 | Ctrl+1-6 |
| 引用块 | 快速插入引用 | Ctrl+Q |
| 无序列表 | 快速插入列表 | Ctrl+B |
| 待办事项 | 支持任务列表 | Ctrl+Shift+C |

#### 21.1.2 编辑器工具栏

```javascript
// src/components/EditorToolbar.jsx
const toolbarItems = [
  { icon: 'H1', action: 'heading', value: 1 },
  { icon: 'H2', action: 'heading', value: 2 },
  { icon: 'H3', action: 'heading', value: 3 },
  { icon: 'Bold', action: 'bold' },
  { icon: 'Italic', action: 'italic' },
  { icon: 'Code', action: 'code' },
  { icon: 'Link', action: 'link' },
  { icon: 'Image', action: 'image' },
  { icon: 'List', action: 'list' },
  { icon: 'Quote', action: 'quote' },
  { icon: 'Table', action: 'table' },
  { icon: 'Preview', action: 'togglePreview' },
];
```

### 21.2 草稿自动保存

#### 21.2.1 自动保存策略

| 触发条件 | 保存时机 | 存储位置 |
|---------|---------|---------|
| 内容变更 | 每30秒自动保存 | localStorage + 服务端 |
| 页面离开 | 立即保存 | 服务端 |
| 手动保存 | 点击保存按钮 | 服务端 |

#### 21.2.2 实现方案

```javascript
// src/hooks/useAutoSave.js
import { useEffect, useRef } from 'react';

const useAutoSave = (content, onSave, interval = 30000) => {
  const timeoutRef = useRef(null);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    const save = () => {
      if (contentRef.current.trim()) {
        onSave(contentRef.current);
      }
    };

    timeoutRef.current = setTimeout(() => {
      save();
      timeoutRef.current = setTimeout(save, interval);
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onSave, interval]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      save();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};

export default useAutoSave;
```

### 21.3 版本历史

#### 21.3.1 版本记录规则

| 操作 | 记录条件 | 保留策略 |
|------|---------|---------|
| 首次保存 | 创建新版本 | 永久保留 |
| 手动保存 | 创建新版本 | 保留最近20个版本 |
| 自动保存 | 更新当前版本 | 不创建新版本 |
| 发布文章 | 创建最终版本 | 永久保留 |

#### 21.3.2 版本对比

```javascript
// server/src/utils/diff.js
const diff = require('diff');

const compareVersions = (version1, version2) => {
  const result = diff.diffWords(version1.content, version2.content);
  return result.map(part => ({
    text: part.value,
    added: part.added,
    removed: part.removed,
  }));
};

module.exports = { compareVersions };
```

#### 21.3.3 版本表结构

```sql
CREATE TABLE IF NOT EXISTS post_versions (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "summary" TEXT DEFAULT '',
  "title" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdBy" INTEGER REFERENCES users(id)
);
```

### 21.4 文章模板

#### 21.4.1 模板类型

| 模板 | 适用场景 | 示例 |
|------|---------|------|
| 技术教程 | 技术文章 | 入门指南、进阶教程 |
| 经验分享 | 经验总结 | 踩坑记录、最佳实践 |
| 翻译文章 | 外文翻译 | 技术博客翻译 |
| 项目介绍 | 项目展示 | 开源项目介绍 |
| 读书笔记 | 学习笔记 | 书籍阅读笔记 |

#### 21.4.2 模板内容

```json
{
  "templates": [
    {
      "id": "tutorial",
      "name": "技术教程",
      "icon": "BookOpen",
      "content": "# {{title}}\n\n## 前言\n\n{{intro}}\n\n## 准备工作\n\n{{prerequisites}}\n\n## 步骤\n\n### 步骤一\n\n{{step1}}\n\n### 步骤二\n\n{{step2}}\n\n## 总结\n\n{{summary}}\n\n## 参考资料\n\n{{references}}"
    }
  ]
}
```

---

## 二十二、社交互动增强

### 22.1 @提及功能

#### 22.1.1 提及触发

| 触发方式 | 说明 |
|---------|------|
| @字符 | 输入@后显示用户列表 |
| 搜索过滤 | 根据输入实时过滤用户 |
| 选择插入 | 点击用户自动插入@用户名 |

#### 22.1.2 提及通知

| 场景 | 通知内容 | 优先级 |
|------|---------|-------|
| 评论@用户 | "张三在评论中@了你" | 高 |
| 文章@用户 | "张三在文章中提到了你" | 中 |
| 回答@用户 | "张三在回答中@了你" | 高 |

### 22.2 文章分享

#### 22.2.1 分享渠道

| 渠道 | 分享方式 | 说明 |
|------|---------|------|
| 微信 | 生成分享卡片 | 扫描二维码分享 |
| 微博 | 跳转微博分享 | 带标题和摘要 |
| Twitter | 跳转Twitter分享 | 带链接 |
| 复制链接 | 复制文章URL | 直接粘贴分享 |
| 邮件 | 打开邮件客户端 | 带文章信息 |

#### 22.2.2 分享卡片设计

```json
{
  "title": "React 18 新特性详解",
  "summary": "深入了解 React 18 的并发特性和新API",
  "author": "张三",
  "coverImage": "/uploads/cover.png",
  "url": "https://mokeblog.com/post/react-18-features",
  "tags": ["React", "前端", "JavaScript"]
}
```

### 22.3 私信系统

#### 22.3.1 私信功能

| 功能 | 说明 |
|------|------|
| 发送私信 | 用户间一对一私信 |
| 消息列表 | 显示对话列表 |
| 消息已读 | 标记消息已读状态 |
| 消息通知 | 新消息提醒 |
| 消息搜索 | 搜索历史消息 |

#### 22.3.2 私信表结构

```sql
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  "senderId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "receiverId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_messages_senderId" ON messages("senderId");
CREATE INDEX IF NOT EXISTS "idx_messages_receiverId" ON messages("receiverId");
CREATE INDEX IF NOT EXISTS "idx_messages_read" ON messages("receiverId", read);
```

#### 22.3.3 私信API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/messages` | GET | auth | 获取消息列表 |
| `/api/messages/:userId` | GET | auth | 获取与指定用户的对话 |
| `/api/messages` | POST | auth | 发送消息 |
| `/api/messages/:id/read` | POST | auth | 标记消息已读 |
| `/api/messages/unread` | GET | auth | 获取未读消息数 |

### 22.4 话题讨论

#### 22.4.1 话题功能

| 功能 | 说明 |
|------|------|
| 话题创建 | 管理员创建话题 |
| 话题关注 | 用户关注话题 |
| 话题文章 | 文章关联话题 |
| 话题讨论 | 话题下的讨论区 |
| 热门话题 | 展示热门话题 |

#### 22.4.2 话题讨论区API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/topics/:slug/discussions` | GET | - | 获取话题讨论 |
| `/api/topics/:slug/discussions` | POST | auth | 创建讨论 |
| `/api/topics/:slug/discussions/:id` | PUT | auth | 更新讨论 |
| `/api/topics/:slug/discussions/:id` | DELETE | auth | 删除讨论 |

---

## 二十三、SEO优化增强

### 23.1 结构化数据

#### 23.1.1 Schema标记

| 类型 | 标记内容 | 说明 |
|------|---------|------|
| Article | 文章标题、作者、发布时间、图片 | Google搜索结果展示 |
| Person | 用户名称、头像、简介 | 作者卡片展示 |
| Organization | 站点名称、Logo、描述 | 站点标识 |
| Breadcrumb | 页面层级路径 | 面包屑导航 |
| SiteNavigationElement | 导航链接 | 导航结构 |

#### 23.1.2 文章结构化数据

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "React 18 新特性详解",
  "description": "深入了解 React 18 的并发特性和新API",
  "image": "https://mokeblog.com/uploads/cover.png",
  "author": {
    "@type": "Person",
    "name": "张三",
    "url": "https://mokeblog.com/u/zhangsan"
  },
  "publisher": {
    "@type": "Organization",
    "name": "墨客博客",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mokeblog.com/uploads/logo.png"
    }
  },
  "datePublished": "2026-01-01T12:00:00Z",
  "dateModified": "2026-01-02T10:00:00Z"
}
```

### 23.2 站点地图

#### 23.2.1 Sitemap生成

| 内容 | 优先级 | 更新频率 |
|------|-------|---------|
| 首页 | 1.0 | 每日 |
| 文章列表 | 0.9 | 每日 |
| 文章详情 | 0.8 | 每周 |
| 用户主页 | 0.7 | 每月 |
| 分类页面 | 0.8 | 每周 |
| 专栏页面 | 0.8 | 每周 |

#### 23.2.2 Sitemap XML结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mokeblog.com/</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://mokeblog.com/post/react-18-features</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 23.3 OG标签

#### 23.3.1 Open Graph标签

| 标签 | 说明 | 示例 |
|------|------|------|
| og:title | 页面标题 | React 18 新特性详解 |
| og:description | 页面描述 | 深入了解React 18的并发特性 |
| og:image | 分享图片 | /uploads/cover.png |
| og:url | 页面URL | /post/react-18-features |
| og:type | 内容类型 | article |
| og:site_name | 站点名称 | 墨客博客 |
| og:article:author | 文章作者 | 张三 |
| og:article:published_time | 发布时间 | 2026-01-01 |

### 23.4 移动端SEO

#### 23.4.1 移动端优化

| 优化项 | 说明 |
|------|------|
| 响应式布局 | 适配不同屏幕尺寸 |
| 视口设置 | `<meta name="viewport" content="width=device-width, initial-scale=1">` |
| 移动端导航 | 汉堡菜单、触控友好 |
| 图片优化 | WebP格式、懒加载 |
| 加载速度 | 首屏加载<3秒 |
| 结构化数据 | 支持移动端搜索 |

---

## 二十四、数据分析增强

### 24.1 作者数据分析看板

#### 24.1.1 数据指标

| 指标 | 说明 | 计算方式 |
|------|------|---------|
| 文章阅读量 | 总阅读次数 | SUM(views) |
| 日均阅读 | 每日平均阅读量 | SUM(views)/days |
| 点赞数 | 总点赞次数 | SUM(likeCount) |
| 评论数 | 总评论次数 | COUNT(comments) |
| 收藏数 | 总收藏次数 | SUM(favoriteCount) |
| 粉丝增长 | 粉丝数量变化 | 当前粉丝数-历史粉丝数 |
| 文章热度排行 | 个人文章热度 | hotScore排序 |
| 流量来源 | 流量来源分布 | 搜索/推荐/直接/外部 |

#### 24.1.2 流量来源分析

| 来源类型 | 说明 | 统计方式 |
|---------|------|---------|
| 搜索 | 搜索引擎带来的流量 | referrer包含search |
| 推荐 | 站内推荐带来的流量 | referrer为站内链接 |
| 直接访问 | 直接输入URL | 无referrer |
| 外部链接 | 外部网站链接 | referrer为外部链接 |
| 社交分享 | 社交媒体带来的流量 | referrer包含social |

### 24.2 用户行为分析

#### 24.2.1 行为追踪

| 行为 | 追踪方式 | 用途 |
|------|---------|------|
| 页面浏览 | 记录访问页面 | 分析用户兴趣 |
| 阅读时长 | 记录文章阅读时间 | 分析内容质量 |
| 点赞行为 | 记录点赞操作 | 分析用户偏好 |
| 收藏行为 | 记录收藏操作 | 分析用户偏好 |
| 评论行为 | 记录评论操作 | 分析用户活跃度 |
| 搜索行为 | 记录搜索关键词 | 分析用户需求 |

#### 24.2.2 行为记录表

```sql
CREATE TABLE IF NOT EXISTS user_behavior (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id),
  "sessionId" TEXT NOT NULL,
  type TEXT NOT NULL,
  "pageUrl" TEXT NOT NULL,
  "postId" INTEGER REFERENCES posts(id),
  "duration" INTEGER DEFAULT 0,
  "referrer" TEXT DEFAULT '',
  "userAgent" TEXT DEFAULT '',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_user_behavior_userId" ON user_behavior("userId");
CREATE INDEX IF NOT EXISTS "idx_user_behavior_type" ON user_behavior(type);
CREATE INDEX IF NOT EXISTS "idx_user_behavior_postId" ON user_behavior("postId");
```

### 24.3 内容热度趋势

#### 24.3.1 热度分析

| 维度 | 分析内容 | 可视化方式 |
|------|---------|-----------|
| 时间维度 | 每日/每周/每月热度变化 | 折线图 |
| 分类维度 | 各分类热度对比 | 柱状图 |
| 作者维度 | 各作者热度对比 | 排行榜 |
| 标签维度 | 各标签热度对比 | 词云图 |

#### 24.3.2 热度趋势API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/analytics/posts/trends` | GET | admin | 获取文章热度趋势 |
| `/api/analytics/categories/trends` | GET | admin | 获取分类热度趋势 |
| `/api/analytics/users/trends` | GET | admin | 获取用户增长趋势 |
| `/api/analytics/posts/:id/stats` | GET | auth | 获取文章详细数据 |

---

## 二十五、安全增强

### 25.1 OAuth第三方登录

#### 25.1.1 支持平台

| 平台 | API | 用途 |
|------|-----|------|
| GitHub | OAuth 2.0 | 开发者用户登录 |
| Google | OAuth 2.0 | 通用用户登录 |
| Gitee | OAuth 2.0 | 国内开发者登录 |
| 微信 | OAuth 2.0 | 移动端用户登录 |

#### 25.1.2 登录流程

```
用户点击第三方登录 → 跳转授权页面 → 用户授权 → 回调获取Token → 获取用户信息 → 创建/关联账户 → 登录成功
```

#### 25.1.3 OAuth表结构

```sql
CREATE TABLE IF NOT EXISTS oauth_providers (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT DEFAULT '',
  "refreshToken" TEXT DEFAULT '',
  "expiresAt" TIMESTAMP DEFAULT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, "providerId")
);
```

#### 25.1.4 OAuth API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/auth/oauth/github` | GET | - | GitHub登录跳转 |
| `/api/auth/oauth/github/callback` | GET | - | GitHub回调 |
| `/api/auth/oauth/google` | GET | - | Google登录跳转 |
| `/api/auth/oauth/google/callback` | GET | - | Google回调 |
| `/api/auth/oauth/providers` | GET | auth | 获取已绑定平台 |
| `/api/auth/oauth/unbind/:provider` | POST | auth | 解绑平台 |

### 25.2 双因素认证

#### 25.2.1 TOTP认证

| 功能 | 说明 |
|------|------|
| 启用TOTP | 用户开启双因素认证 |
| 绑定设备 | 扫描二维码绑定认证器 |
| 验证登录 | 登录时输入验证码 |
| 备用码 | 生成备用恢复码 |
| 关闭认证 | 用户关闭双因素认证 |

#### 25.2.2 TOTP表结构

```sql
CREATE TABLE IF NOT EXISTS totp_secrets (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  "recoveryCodes" TEXT[],
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 25.2.3 TOTP API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/auth/totp/setup` | POST | auth | 设置TOTP |
| `/api/auth/totp/verify` | POST | auth | 验证TOTP |
| `/api/auth/totp/enable` | POST | auth | 启用TOTP |
| `/api/auth/totp/disable` | POST | auth | 禁用TOTP |
| `/api/auth/totp/recovery` | POST | auth | 使用恢复码 |

### 25.3 密码重置流程

#### 25.3.1 重置流程

```
用户请求重置 → 发送重置链接 → 用户点击链接 → 验证链接有效性 → 设置新密码 → 重置成功
```

#### 25.3.2 安全措施

| 措施 | 说明 |
|------|------|
| 链接有效期 | 15分钟 |
| 链接次数限制 | 最多点击3次 |
| 验证码验证 | 可选邮箱验证码 |
| 密码强度检查 | 至少6位，包含字母数字 |

#### 25.3.3 密码重置API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/auth/forgot` | POST | - | 请求密码重置 |
| `/api/auth/reset/:token` | GET | - | 验证重置链接 |
| `/api/auth/reset` | POST | - | 设置新密码 |

---

## 二十六、扩展功能设计

### 26.1 RSS订阅

#### 26.1.1 RSS Feed类型

| 类型 | URL | 说明 |
|------|-----|------|
| 全站文章 | `/rss` | 最新发布的文章 |
| 分类文章 | `/rss/category/:slug` | 指定分类的文章 |
| 用户文章 | `/rss/user/:username` | 指定用户的文章 |
| 专栏文章 | `/rss/column/:slug` | 指定专栏的文章 |

#### 26.1.2 RSS Feed结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>墨客博客</title>
    <link>https://mokeblog.com</link>
    <description>技术社区博客平台</description>
    <item>
      <title>React 18 新特性详解</title>
      <link>https://mokeblog.com/post/react-18-features</link>
      <description>深入了解React 18的并发特性</description>
      <pubDate>Thu, 01 Jan 2026 12:00:00 GMT</pubDate>
      <author>张三</author>
    </item>
  </channel>
</rss>
```

### 26.2 邮件订阅

#### 26.2.1 订阅类型

| 类型 | 说明 | 频率 |
|------|------|------|
| 文章更新 | 关注作者的新文章 | 即时 |
| 专栏更新 | 订阅专栏的新文章 | 即时 |
| 话题更新 | 关注话题的新文章 | 即时 |
| 每周精选 | 每周精选文章汇总 | 每周 |
| 每日新闻 | 每日技术新闻 | 每日 |

#### 26.2.2 邮件订阅表

```sql
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  "targetId" INTEGER DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email, type, "targetId")
);
```

### 26.3 打赏功能

#### 26.3.1 打赏方式

| 方式 | 说明 | 支持金额 |
|------|------|---------|
| 微信支付 | 微信扫码支付 | 自定义金额 |
| 支付宝 | 支付宝扫码支付 | 自定义金额 |
| 积分打赏 | 使用平台积分打赏 | 100/200/500积分 |

#### 26.3.2 打赏记录表

```sql
CREATE TABLE IF NOT EXISTS tips (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT DEFAULT '',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 26.3.3 打赏API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/tips` | POST | auth | 创建打赏 |
| `/api/tips/:postId` | GET | - | 获取打赏列表 |
| `/api/tips/stats/:userId` | GET | auth | 获取打赏统计 |

### 26.4 付费专栏

#### 26.4.1 付费模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| 单次购买 | 按文章付费 | 单篇优质内容 |
| 订阅专栏 | 按月/年订阅 | 系列课程 |
| 免费预览 | 部分内容免费 | 引流转化 |

#### 26.4.2 付费专栏表

```sql
CREATE TABLE IF NOT EXISTS column_subscriptions (
  id SERIAL PRIMARY KEY,
  "columnId" INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "startDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paid_posts (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  price INTEGER DEFAULT 0,
  "previewContent" TEXT DEFAULT '',
  "isPaid" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 二十七、用户体验细节

### 27.1 阅读进度

#### 27.1.1 进度条设计

| 位置 | 样式 | 说明 |
|------|------|------|
| 顶部进度条 | 细条，跟随滚动 | 页面顶部显示 |
| 章节进度 | 数字百分比 | 显示当前阅读位置 |
| 预计阅读时间 | 分钟数 | 文章开头显示 |

#### 27.1.2 实现方案

```javascript
// src/components/ReadingProgress.jsx
import { useState, useEffect } from 'react';

const ReadingProgress = ({ contentRef }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [contentRef]);

  return (
    <div className="reading-progress">
      <div 
        className="reading-progress-bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ReadingProgress;
```

### 27.2 夜间模式优化

#### 27.2.1 模式切换

| 模式 | 触发方式 | 记忆方式 |
|------|---------|---------|
| 亮色模式 | 手动切换 | localStorage |
| 暗色模式 | 手动切换 | localStorage |
| 跟随系统 | 自动检测 | localStorage |
| 定时切换 | 日出日落 | localStorage |

#### 27.2.2 暗色模式优化

| 优化项 | 说明 |
|------|------|
| 代码块 | 暗色主题代码高亮 |
| 图片 | 自适应亮度调整 |
| 链接颜色 | 保持可见性 |
| 文字对比度 | 符合WCAG标准 |

### 27.3 快捷键支持

#### 27.3.1 全局快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| Ctrl + K | 聚焦搜索框 | 快速搜索 |
| Ctrl + Home | 跳转到顶部 | 返回首页 |
| Ctrl + End | 跳转到底部 | 页面末尾 |
| Ctrl + ↑ | 回到顶部 | 快速滚动 |
| Ctrl + ↓ | 滚动到底部 | 快速滚动 |
| Esc | 关闭弹窗 | 取消操作 |

#### 27.3.2 编辑器快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| Ctrl + S | 保存草稿 | 快速保存 |
| Ctrl + P | 切换预览 | Markdown预览 |
| Ctrl + B | 加粗 | 文字加粗 |
| Ctrl + I | 斜体 | 文字斜体 |
| Ctrl + ` | 代码块 | 插入代码块 |
| Ctrl + L | 链接 | 插入链接 |

### 27.4 文章导出

#### 27.4.1 导出格式

| 格式 | 说明 | 用途 |
|------|------|------|
| Markdown | 原始Markdown格式 | 备份、迁移 |
| HTML | 网页格式 | 离线阅读 |
| PDF | 打印格式 | 打印、分享 |
| EPUB | 电子书格式 | 阅读器阅读 |

#### 27.4.2 导出API

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/posts/:slug/export/md` | GET | auth | 导出Markdown |
| `/api/posts/:slug/export/html` | GET | auth | 导出HTML |
| `/api/posts/:slug/export/pdf` | GET | auth | 导出PDF |

---

## 二十八、总结

本设计方案基于现有墨客博客系统，借鉴CSDN的核心特性，进行技术社区化重构。主要改进包括：

1. **全文搜索**：支持文章、用户、标签、问答的高效检索，支持实时搜索建议
2. **技术排行榜**：阅读排行、作者排行、标签排行、问答排行，支持时间周期筛选
3. **专栏系统**：支持系统化的内容发布和管理，支持订阅功能
4. **用户技术主页**：展示用户技术栈、等级、积分、关注关系、活动记录
5. **评论楼中楼**：支持多级回复、@提及、点赞
6. **积分等级系统**：完善的积分规则和等级体系，激励用户创作和互动
7. **技术问答**：类似CSDN问答的提问/回答/投票/采纳功能
8. **文章推荐**：基于用户行为的个性化推荐
9. **消息通知**：评论回复、点赞、关注、回答采纳等通知
10. **收藏夹管理**：用户收藏文章分类管理
11. **数据统计分析**：管理员数据看板、作者数据分析
12. **安全加固**：helmet、compression、rate-limit中间件
13. **性能优化**：代码分割、图片优化、数据库索引、缓存策略
14. **用户体验优化**：暗色模式、响应式设计、无障碍访问、国际化
15. **实时通信**：WebSocket实时通知、消息推送机制
16. **内容审核**：文章审核流程、用户举报系统、内容过滤
17. **运营功能**：活动管理、话题管理、友情链接、站点配置
18. **技术实现细节**：Redis缓存策略、异步任务处理、日志监控、API版本控制
19. **数据库优化**：读写分离方案、备份策略
20. **内容创作体验增强**：Markdown编辑器增强、草稿自动保存、版本历史、文章模板
21. **社交互动增强**：@提及功能、文章分享、私信系统、话题讨论
22. **SEO优化增强**：结构化数据、站点地图、OG标签、移动端SEO
23. **数据分析增强**：作者数据分析看板、用户行为分析、内容热度趋势
24. **安全增强**：OAuth第三方登录、双因素认证、密码重置流程
25. **扩展功能**：RSS订阅、邮件订阅、打赏功能、付费专栏
26. **用户体验细节**：阅读进度、夜间模式优化、快捷键支持、文章导出

采用分阶段实施策略（5个阶段，共7.5周），确保项目质量和进度可控。技术栈保持现有架构（React 18 + Express + PostgreSQL），降低迁移成本。

---

*文档版本：v5.0 | 更新日期：2026-07-13*
