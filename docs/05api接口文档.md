# 墨客博客 — API 接口文档

---

## 一、基础信息

### 1.1 接口地址

| 环境 | 地址 |
|------|------|
| 开发环境 | `http://localhost:3333/api` |
| 生产环境 | `https://api.mokeblog.com/api` |

### 1.2 认证方式

- **JWT Bearer**：在请求头中添加 `Authorization: Bearer <token>`
- **token 来源**：登录接口返回
- **token 有效期**：7 天

### 1.3 统一错误格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请填写所有必填字段"
  }
}
```

---

## 二、认证接口

### 2.1 用户登录

**POST** `/api/auth/login`

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 用户邮箱 |
| password | string | 是 | 用户密码 |

**请求示例**：

```json
{
  "email": "admin@moke.com",
  "password": "123456"
}
```

**成功响应**（200）：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "管理员",
    "email": "admin@moke.com",
    "avatar": "/uploads/avatar.png",
    "role": "admin"
  }
}
```

**失败响应**（401）：

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "邮箱或密码错误"
  }
}
```

### 2.2 用户注册

**POST** `/api/auth/register`

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 用户昵称 |
| email | string | 是 | 用户邮箱 |
| password | string | 是 | 用户密码（6-32位） |

**请求示例**：

```json
{
  "name": "张三",
  "email": "zhangsan@moke.com",
  "password": "123456"
}
```

**成功响应**（200）：

```json
{
  "user": {
    "id": 2,
    "name": "张三",
    "email": "zhangsan@moke.com",
    "avatar": null,
    "role": "user"
  }
}
```

**失败响应**（400）：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "邮箱已被注册"
  }
}
```

### 2.3 获取当前用户

**GET** `/api/auth/me`

**认证**：需登录

**成功响应**（200）：

```json
{
  "id": 1,
  "name": "管理员",
  "email": "admin@moke.com",
  "avatar": "/uploads/avatar.png",
  "bio": "这是我的简介",
  "role": "admin",
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

---

## 三、文章接口

### 3.1 获取文章列表

**GET** `/api/posts`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 9 | 每页条数 |
| categoryId | number | 否 | - | 分类 ID |
| status | string | 否 | published | 状态（published/draft） |

**成功响应**（200）：

```json
{
  "posts": [
    {
      "id": 1,
      "slug": "hello-world-1704067200",
      "title": "Hello World",
      "summary": "欢迎来到墨客博客",
      "coverImage": "/uploads/cover.png",
      "category": {
        "id": 1,
        "name": "技术",
        "slug": "tech",
        "color": "#2563eb"
      },
      "author": {
        "id": 1,
        "name": "管理员",
        "avatar": "/uploads/avatar.png"
      },
      "tags": ["技术", "博客"],
      "views": 100,
      "commentCount": 10,
      "publishedAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 9
}
```

### 3.2 获取文章详情

**GET** `/api/posts/:slug`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章标识 |

**成功响应**（200）：

```json
{
  "id": 1,
  "slug": "hello-world-1704067200",
  "title": "Hello World",
  "summary": "欢迎来到墨客博客",
  "content": "# Hello World\n\n欢迎来到墨客博客",
  "coverImage": "/uploads/cover.png",
  "category": {
    "id": 1,
    "name": "技术",
    "slug": "tech",
    "color": "#2563eb"
  },
  "author": {
    "id": 1,
    "name": "管理员",
    "avatar": "/uploads/avatar.png"
  },
  "tags": ["技术", "博客"],
  "views": 100,
  "publishedAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:00:00.000Z"
}
```

**失败响应**（404）：

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "文章不存在"
  }
}
```

### 3.3 创建文章

**POST** `/api/posts`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 文章标题 |
| summary | string | 发布状态必填 | 文章摘要 |
| content | string | 发布状态必填 | 文章正文（Markdown） |
| coverImage | string | 发布状态必填 | 封面图 URL |
| categoryId | number | 发布状态必填 | 分类 ID |
| tags | string | 否 | 标签，逗号分隔 |
| status | string | 否 | 状态（published/draft），默认 published |

**请求示例**：

```json
{
  "title": "Hello World",
  "summary": "欢迎来到墨客博客",
  "content": "# Hello World\n\n欢迎来到墨客博客",
  "coverImage": "/uploads/cover.png",
  "categoryId": 1,
  "tags": "技术,博客",
  "status": "published"
}
```

**成功响应**（200）：

```json
{
  "id": 2,
  "slug": "hello-world-1704067200",
  "title": "Hello World",
  "status": "published"
}
```

### 3.4 更新文章

**PUT** `/api/posts/:slug`

**认证**：需登录，且为文章作者

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章标识 |

**请求体**：同创建文章

**成功响应**（200）：

```json
{
  "id": 1,
  "slug": "hello-world-1704067200",
  "title": "Hello World Updated"
}
```

### 3.5 删除文章

**DELETE** `/api/posts/:slug`

**认证**：需登录，且为文章作者

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章标识 |

**成功响应**（200）：

```json
{
  "message": "文章删除成功"
}
```

### 3.6 点赞文章

**POST** `/api/posts/:slug/like`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章标识 |

**成功响应**（200）：

```json
{
  "liked": true,
  "likeCount": 10
}
```

### 3.7 收藏文章

**POST** `/api/posts/:slug/favorite`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章标识 |

**成功响应**（200）：

```json
{
  "favorited": true,
  "favoriteCount": 5
}
```

---

## 四、用户接口

### 4.1 按用户名查询用户

**GET** `/api/users/:username`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |

**成功响应**（200）：

```json
{
  "id": 1,
  "name": "管理员",
  "avatar": "/uploads/avatar.png",
  "bio": "这是我的简介",
  "postCount": 10,
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

**失败响应**（404）：

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "用户不存在"
  }
}
```

### 4.2 更新个人资料

**PUT** `/api/users/profile`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 用户昵称 |
| avatar | string | 否 | 头像 URL |
| bio | string | 否 | 用户简介 |

**请求示例**：

```json
{
  "name": "张三",
  "avatar": "/uploads/new-avatar.png",
  "bio": "这是我的新简介"
}
```

**成功响应**（200）：

```json
{
  "id": 2,
  "name": "张三",
  "avatar": "/uploads/new-avatar.png",
  "bio": "这是我的新简介"
}
```

### 4.3 获取当前用户文章

**GET** `/api/users/posts`

**认证**：需登录

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 9 | 每页条数 |
| status | string | 否 | - | 状态过滤（published/draft） |

**成功响应**（200）：

```json
{
  "posts": [...],
  "total": 10,
  "page": 1,
  "pageSize": 9
}
```

---

## 五、评论接口

### 5.1 获取文章评论

**GET** `/api/comments/:postId`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| postId | number | 文章 ID |

**成功响应**（200）：

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
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "total": 10
}
```

### 5.2 创建评论

**POST** `/api/comments`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| postId | number | 是 | 文章 ID |
| content | string | 是 | 评论内容 |

**请求示例**：

```json
{
  "postId": 1,
  "content": "太棒了！"
}
```

**成功响应**（200）：

```json
{
  "id": 2,
  "postId": 1,
  "author": "张三",
  "avatar": "/uploads/avatar.png",
  "content": "太棒了！",
  "likes": 0,
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

### 5.3 删除评论

**DELETE** `/api/comments/:id`

**认证**：需登录，且为评论作者或管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 评论 ID |

**成功响应**（200）：

```json
{
  "message": "评论删除成功"
}
```

### 5.4 点赞评论

**POST** `/api/comments/:id/like`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 评论 ID |

**成功响应**（200）：

```json
{
  "liked": true,
  "likeCount": 6
}
```

---

## 六、分类接口

### 6.1 获取所有分类

**GET** `/api/categories`

**成功响应**（200）：

```json
{
  "categories": [
    {
      "id": 1,
      "name": "技术",
      "slug": "tech",
      "description": "技术相关文章",
      "color": "#2563eb",
      "icon": "BookOpen",
      "postCount": 10
    }
  ]
}
```

### 6.2 获取分类详情

**GET** `/api/categories/:slug`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 分类标识 |

**成功响应**（200）：

```json
{
  "id": 1,
  "name": "技术",
  "slug": "tech",
  "description": "技术相关文章",
  "color": "#2563eb",
  "icon": "BookOpen",
  "postCount": 10
}
```

---

## 七、管理接口

### 7.1 获取统计数据

**GET** `/api/admin/stats`

**认证**：需管理员

**成功响应**（200）：

```json
{
  "totalPosts": 100,
  "totalComments": 500,
  "totalUsers": 10,
  "totalCategories": 5,
  "draftCount": 5
}
```

### 7.2 获取所有文章（含草稿）

**GET** `/api/admin/posts`

**认证**：需管理员

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |

**成功响应**（200）：

```json
{
  "posts": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### 7.3 更新文章状态

**PUT** `/api/admin/posts/:id`

**认证**：需管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 文章 ID |

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 状态（published/draft） |

**成功响应**（200）：

```json
{
  "id": 1,
  "status": "published"
}
```

### 7.4 删除文章（管理）

**DELETE** `/api/admin/posts/:id`

**认证**：需管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 文章 ID |

**成功响应**（200）：

```json
{
  "message": "文章删除成功"
}
```

### 7.5 获取所有评论

**GET** `/api/admin/comments`

**认证**：需管理员

**成功响应**（200）：

```json
{
  "comments": [...]
}
```

### 7.6 删除评论（管理）

**DELETE** `/api/admin/comments/:id`

**认证**：需管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 评论 ID |

**成功响应**（200）：

```json
{
  "message": "评论删除成功"
}
```

### 7.7 创建分类

**POST** `/api/admin/categories`

**认证**：需管理员

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 |
| slug | string | 是 | 分类标识 |
| description | string | 否 | 分类描述 |
| color | string | 否 | 分类颜色 |
| icon | string | 否 | 分类图标 |

**成功响应**（200）：

```json
{
  "id": 6,
  "name": "新分类",
  "slug": "new-category"
}
```

### 7.8 更新分类

**PUT** `/api/admin/categories/:id`

**认证**：需管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 分类 ID |

**请求体**：同创建分类

**成功响应**（200）：

```json
{
  "id": 6,
  "name": "新分类",
  "slug": "new-category"
}
```

### 7.9 删除分类

**DELETE** `/api/admin/categories/:id`

**认证**：需管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 分类 ID |

**成功响应**（200）：

```json
{
  "message": "分类删除成功"
}
```

---

## 八、文件上传

### 8.1 上传图片

**POST** `/api/upload`

**请求体**：`multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 图片文件（最大 10MB） |

**成功响应**（200）：

```json
{
  "url": "/uploads/1704067200-abc123.png"
}
```

---

## 九、搜索接口

### 9.1 搜索文章

**GET** `/api/search/posts`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 是 | - | 搜索关键词 |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页条数 |
| categoryId | number | 否 | - | 分类 ID |

**成功响应**（200）：

```json
{
  "posts": [
    {
      "id": 1,
      "slug": "react-18-features",
      "title": "React 18 新特性详解",
      "summary": "深入了解 React 18 的并发特性",
      "coverImage": "/uploads/cover.png",
      "author": { "name": "张三", "avatar": "/uploads/avatar.png" },
      "views": 1000,
      "highlight": "<em>React</em> 18 新特性详解"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "suggestions": ["react", "react-native", "react-router"]
}
```

### 9.2 搜索用户

**GET** `/api/search/users`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 是 | - | 搜索关键词 |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页条数 |

**成功响应**（200）：

```json
{
  "users": [
    {
      "id": 1,
      "name": "张三",
      "avatar": "/uploads/avatar.png",
      "bio": "React 开发者",
      "level": 3,
      "points": 2500
    }
  ],
  "total": 10
}
```

### 9.3 搜索标签

**GET** `/api/search/tags`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 是 | - | 搜索关键词 |

**成功响应**（200）：

```json
{
  "tags": ["react", "react-native", "react-router"]
}
```

### 9.4 搜索建议

**GET** `/api/search/suggestions`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 是 | - | 搜索关键词 |

**成功响应**（200）：

```json
{
  "posts": ["React 18 新特性详解", "React Hooks 最佳实践"],
  "users": ["react_master", "react_dev"],
  "tags": ["react", "react-native", "react-router"],
  "questions": ["React 性能优化方案", "React 和 Vue 对比"]
}
```

---

## 十、排行榜接口

### 10.1 文章排行榜

**GET** `/api/rankings/posts`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| period | string | 否 | weekly | 时间周期（daily/weekly/monthly/all） |
| limit | number | 否 | 20 | 返回数量 |

**成功响应**（200）：

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
      "hotScore": 15000,
      "trending": 2
    }
  ],
  "period": "weekly"
}
```

### 10.2 作者排行榜

**GET** `/api/rankings/authors`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| period | string | 否 | weekly | 时间周期 |
| limit | number | 否 | 20 | 返回数量 |

**成功响应**（200）：

```json
{
  "rankings": [
    {
      "rank": 1,
      "id": 1,
      "name": "张三",
      "avatar": "/uploads/avatar.png",
      "bio": "技术博主",
      "level": 5,
      "points": 12000,
      "postCount": 50,
      "totalViews": 100000,
      "followersCount": 500
    }
  ],
  "period": "weekly"
}
```

### 10.3 标签排行榜

**GET** `/api/rankings/tags`

**成功响应**（200）：

```json
{
  "rankings": [
    { "tag": "react", "postCount": 500, "totalViews": 500000 },
    { "tag": "vue", "postCount": 400, "totalViews": 400000 }
  ]
}
```

---

## 十一、专栏接口

### 11.1 获取专栏列表

**GET** `/api/columns`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页条数 |
| authorId | number | 否 | - | 作者 ID |

**成功响应**（200）：

```json
{
  "columns": [
    {
      "id": 1,
      "name": "React 进阶之路",
      "slug": "react-advanced",
      "description": "深入探索 React 技术栈",
      "coverImage": "/uploads/column-cover.png",
      "author": { "name": "张三", "avatar": "/uploads/avatar.png" },
      "postCount": 10,
      "viewCount": 5000
    }
  ],
  "total": 10
}
```

### 11.2 获取专栏详情

**GET** `/api/columns/:slug`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 专栏标识 |

**成功响应**（200）：

```json
{
  "id": 1,
  "name": "React 进阶之路",
  "slug": "react-advanced",
  "description": "深入探索 React 技术栈",
  "coverImage": "/uploads/column-cover.png",
  "author": { "name": "张三", "avatar": "/uploads/avatar.png" },
  "postCount": 10,
  "viewCount": 5000,
  "posts": [...],
  "isSubscribed": false
}
```

### 11.3 创建专栏

**POST** `/api/columns`

**认证**：需登录，等级 ≥3

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 专栏名称 |
| slug | string | 是 | 专栏标识 |
| description | string | 否 | 专栏描述 |
| coverImage | string | 否 | 封面图 URL |

**成功响应**（200）：

```json
{
  "id": 1,
  "name": "React 进阶之路",
  "slug": "react-advanced"
}
```

### 11.4 添加文章到专栏

**POST** `/api/columns/:id/posts`

**认证**：需登录，专栏作者

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 专栏 ID |

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| postId | number | 是 | 文章 ID |

**成功响应**（200）：

```json
{
  "message": "文章已添加到专栏"
}
```

### 11.5 订阅专栏

**POST** `/api/columns/:id/subscribe`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 专栏 ID |

**成功响应**（200）：

```json
{
  "subscribed": true
}
```

---

## 十二、关注接口

### 12.1 关注用户

**POST** `/api/users/follow/:userId`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | number | 目标用户 ID |

**成功响应**（200）：

```json
{
  "followed": true,
  "followersCount": 100
}
```

### 12.2 取消关注

**POST** `/api/users/unfollow/:userId`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | number | 目标用户 ID |

**成功响应**（200）：

```json
{
  "followed": false,
  "followersCount": 99
}
```

### 12.3 获取粉丝列表

**GET** `/api/users/:username/followers`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |

**成功响应**（200）：

```json
{
  "followers": [
    {
      "id": 2,
      "name": "李四",
      "avatar": "/uploads/avatar.png",
      "level": 2,
      "followed": false
    }
  ],
  "total": 100
}
```

### 12.4 获取关注列表

**GET** `/api/users/:username/following`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |

**成功响应**（200）：

```json
{
  "following": [
    {
      "id": 3,
      "name": "王五",
      "avatar": "/uploads/avatar.png",
      "level": 4,
      "followed": true
    }
  ],
  "total": 50
}
```

### 12.5 获取关注动态

**GET** `/api/users/feed`

**认证**：需登录

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |

**成功响应**（200）：

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
    }
  ],
  "total": 50
}
```

---

## 十三、积分接口

### 13.1 获取积分记录

**GET** `/api/users/points`

**认证**：需登录

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |

**成功响应**（200）：

```json
{
  "records": [
    {
      "type": "publish_post",
      "points": 100,
      "description": "发布文章",
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "total": 50,
  "currentPoints": 2500
}
```

### 13.2 获取等级信息

**GET** `/api/users/level`

**认证**：需登录

**成功响应**（200）：

```json
{
  "level": 3,
  "name": "中级开发者",
  "icon": "🧑‍💻",
  "currentPoints": 2500,
  "nextLevelPoints": 5000,
  "progress": 50
}
```

### 13.3 获取积分规则

**GET** `/api/users/points/rules`

**成功响应**（200）：

```json
{
  "rules": [
    { "action": "publish_post", "points": 100, "description": "发布文章" },
    { "action": "like_post", "points": 5, "description": "点赞文章" },
    { "action": "comment", "points": 10, "description": "发表评论" }
  ],
  "levels": [
    { "level": 1, "name": "新手", "minPoints": 0, "icon": "🌱" },
    { "level": 2, "name": "初级开发者", "minPoints": 500, "icon": "👨‍💻" }
  ]
}
```

---

## 十四、通知接口

### 14.1 获取通知列表

**GET** `/api/notifications`

**认证**：需登录

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |
| read | boolean | 否 | - | 是否已读过滤 |

**成功响应**（200）：

```json
{
  "notifications": [
    {
      "id": 1,
      "type": "comment_reply",
      "content": "李四回复了你的评论",
      "read": false,
      "relatedId": 10,
      "relatedType": "comment",
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "total": 10,
  "unreadCount": 3
}
```

### 14.2 获取未读通知数

**GET** `/api/notifications/unread`

**认证**：需登录

**成功响应**（200）：

```json
{
  "count": 3
}
```

### 14.3 标记通知已读

**POST** `/api/notifications/:id/read`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 通知 ID |

**成功响应**（200）：

```json
{
  "read": true
}
```

### 14.4 标记全部已读

**POST** `/api/notifications/read-all`

**认证**：需登录

**成功响应**（200）：

```json
{
  "message": "全部已读"
}
```

---

## 十五、问答接口

### 15.1 获取问答列表

**GET** `/api/questions`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |
| status | string | 否 | open | 状态（open/closed） |
| tag | string | 否 | - | 标签过滤 |

**成功响应**（200）：

```json
{
  "questions": [
    {
      "id": 1,
      "title": "React 18 并发模式如何使用？",
      "content": "最近在学习 React 18...",
      "author": { "name": "张三", "avatar": "/uploads/avatar.png", "level": 3 },
      "tags": ["react", "frontend"],
      "status": "open",
      "views": 500,
      "answers": 5,
      "acceptedAnswerId": null
    }
  ],
  "total": 100
}
```

### 15.2 获取问答详情

**GET** `/api/questions/:id`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 问题 ID |

**成功响应**（200）：

```json
{
  "id": 1,
  "title": "React 18 并发模式如何使用？",
  "content": "最近在学习 React 18...",
  "author": { "name": "张三", "avatar": "/uploads/avatar.png", "level": 3 },
  "tags": ["react", "frontend"],
  "status": "open",
  "views": 500,
  "answers": 5,
  "acceptedAnswerId": 10,
  "answersList": [
    {
      "id": 10,
      "content": "React 18 的并发模式主要通过 startTransition...",
      "author": { "name": "李四", "avatar": "/uploads/avatar.png", "level": 4 },
      "votes": 25,
      "accepted": true,
      "createdAt": "2026-01-01T13:00:00.000Z"
    }
  ]
}
```

### 15.3 发布问题

**POST** `/api/questions`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 问题标题 |
| content | string | 是 | 问题描述 |
| tags | string[] | 否 | 标签数组 |

**成功响应**（200）：

```json
{
  "id": 1,
  "title": "React 18 并发模式如何使用？"
}
```

### 15.4 回答问题

**POST** `/api/questions/:id/answers`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 问题 ID |

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 回答内容 |

**成功响应**（200）：

```json
{
  "id": 10,
  "content": "React 18 的并发模式...",
  "votes": 0
}
```

### 15.5 投票回答

**POST** `/api/answers/:id/vote`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 回答 ID |

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| voteType | string | 是 | 投票类型（up/down） |

**成功响应**（200）：

```json
{
  "voted": true,
  "votes": 26
}
```

### 15.6 采纳回答

**POST** `/api/answers/:id/accept`

**认证**：需登录，且为提问者

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 回答 ID |

**成功响应**（200）：

```json
{
  "accepted": true
}
```

---

## 十六、推荐接口

### 16.1 获取文章推荐

**GET** `/api/recommend/posts`

**认证**：需登录

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| limit | number | 否 | 10 | 返回数量 |

**成功响应**（200）：

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

### 16.2 获取问答推荐

**GET** `/api/recommend/questions`

**认证**：需登录

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| limit | number | 否 | 10 | 返回数量 |

**成功响应**（200）：

```json
{
  "questions": [...]
}
```

### 16.3 获取推荐关注用户

**GET** `/api/recommend/users`

**认证**：需登录

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| limit | number | 否 | 10 | 返回数量 |

**成功响应**（200）：

```json
{
  "users": [...]
}
```

---

## 十七、收藏夹接口

### 17.1 获取收藏夹列表

**GET** `/api/favorite/folders`

**认证**：需登录

**成功响应**（200）：

```json
{
  "folders": [
    {
      "id": 1,
      "name": "技术文章",
      "postCount": 10
    }
  ]
}
```

### 17.2 创建收藏夹

**POST** `/api/favorite/folders`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 收藏夹名称 |

**成功响应**（200）：

```json
{
  "id": 1,
  "name": "技术文章"
}
```

### 17.3 获取收藏夹文章

**GET** `/api/favorite/folders/:id/posts`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 收藏夹 ID |

**成功响应**（200）：

```json
{
  "posts": [...],
  "total": 10
}
```

### 17.4 添加文章到收藏夹

**POST** `/api/favorite/posts`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| postId | number | 是 | 文章 ID |
| folderId | number | 否 | 收藏夹 ID |

**成功响应**（200）：

```json
{
  "favorited": true
}
```

### 17.5 移除收藏文章

**DELETE** `/api/favorite/posts/:postId`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| postId | number | 文章 ID |

**成功响应**（200）：

```json
{
  "favorited": false
}
```

---

## 十八、活动接口

### 18.1 获取活动列表

**GET** `/api/activities`

**成功响应**（200）：

```json
{
  "activities": [
    {
      "id": 1,
      "title": "React技术征文",
      "type": "contest",
      "description": "分享你的 React 学习经验",
      "coverImage": "/uploads/activity-cover.png",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T23:59:59.000Z",
      "rewardPoints": 500,
      "participantCount": 100
    }
  ],
  "total": 5
}
```

### 18.2 获取活动详情

**GET** `/api/activities/:id`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 活动 ID |

**成功响应**（200）：

```json
{
  "id": 1,
  "title": "React技术征文",
  "description": "分享你的 React 学习经验",
  "isParticipated": false
}
```

### 18.3 参与活动

**POST** `/api/activities/:id/participate`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 活动 ID |

**成功响应**（200）：

```json
{
  "participated": true
}
```

---

## 十九、话题接口

### 19.1 获取话题列表

**GET** `/api/topics`

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |
| isHot | boolean | 否 | - | 是否热门 |
| isRecommended | boolean | 否 | - | 是否推荐 |

**成功响应**（200）：

```json
{
  "topics": [
    {
      "id": 1,
      "name": "React",
      "slug": "react",
      "description": "React 相关技术讨论",
      "coverImage": "/uploads/topic-cover.png",
      "postCount": 500,
      "followCount": 1000,
      "isHot": true,
      "isRecommended": true
    }
  ],
  "total": 50
}
```

### 19.2 获取话题详情

**GET** `/api/topics/:slug`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 话题标识 |

**成功响应**（200）：

```json
{
  "id": 1,
  "name": "React",
  "slug": "react",
  "description": "React 相关技术讨论",
  "posts": [...],
  "isFollowed": false
}
```

### 19.3 关注话题

**POST** `/api/topics/:id/follow`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 话题 ID |

**成功响应**（200）：

```json
{
  "followed": true
}
```

---

## 二十、举报接口

### 20.1 提交举报

**POST** `/api/reports`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetType | string | 是 | 目标类型（post/comment/user/question/answer） |
| targetId | number | 是 | 目标 ID |
| type | string | 是 | 举报类型（spam/inappropriate/plagiarism/harassment/other） |
| reason | string | 否 | 举报理由 |
| evidence | string | 否 | 证据链接 |

**成功响应**（200）：

```json
{
  "id": 1,
  "status": "pending"
}
```

### 20.2 获取举报列表

**GET** `/api/reports`

**认证**：需管理员

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页条数 |
| status | string | 否 | - | 状态过滤（pending/processed） |

**成功响应**（200）：

```json
{
  "reports": [
    {
      "id": 1,
      "reporter": { "name": "张三", "avatar": "/uploads/avatar.png" },
      "targetType": "post",
      "targetId": 1,
      "type": "spam",
      "reason": "垃圾广告",
      "status": "pending",
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "total": 10
}
```

### 20.3 处理举报

**PUT** `/api/reports/:id`

**认证**：需管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 举报 ID |

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 处理状态（resolved/rejected） |
| note | string | 否 | 处理备注 |

**成功响应**（200）：

```json
{
  "id": 1,
  "status": "resolved"
}
```

---

## 二十一、站点配置接口

### 21.1 获取站点配置

**GET** `/api/config`

**成功响应**（200）：

```json
{
  "site_name": "墨客博客",
  "site_description": "技术社区博客平台",
  "site_keywords": "技术博客,编程,开发",
  "logo_url": "/uploads/logo.png",
  "favicon_url": "/uploads/favicon.ico",
  "post_approval_required": false,
  "max_file_size": 10485760,
  "daily_login_points": 10
}
```

### 21.2 更新站点配置

**PUT** `/api/config`

**认证**：需管理员

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 配置键 |
| value | string | 是 | 配置值 |

**成功响应**（200）：

```json
{
  "key": "site_name",
  "value": "新站点名称"
}
```

---

## 二十二、版本历史接口

### 22.1 获取文章版本列表

**GET** `/api/posts/:slug/versions`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章 slug |

**成功响应**（200）：

```json
{
  "versions": [
    {
      "id": 1,
      "versionNumber": 1,
      "title": "React 18 新特性详解",
      "createdAt": "2026-01-01T12:00:00.000Z",
      "createdBy": { "name": "张三" }
    }
  ],
  "total": 5
}
```

### 22.2 获取版本详情

**GET** `/api/posts/:slug/versions/:versionId`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章 slug |
| versionId | number | 版本 ID |

**成功响应**（200）：

```json
{
  "id": 1,
  "versionNumber": 1,
  "title": "React 18 新特性详解",
  "summary": "深入了解 React 18 的并发特性",
  "content": "# React 18 新特性详解...",
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

### 22.3 版本对比

**GET** `/api/posts/:slug/versions/compare`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章 slug |

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version1 | number | 是 | 版本1 ID |
| version2 | number | 是 | 版本2 ID |

**成功响应**（200）：

```json
{
  "version1": { "versionNumber": 1, "title": "版本1" },
  "version2": { "versionNumber": 2, "title": "版本2" },
  "diff": [
    { "text": "React 18", "added": false, "removed": false },
    { "text": " 新特性", "added": true, "removed": false }
  ]
}
```

### 22.4 回滚到指定版本

**POST** `/api/posts/:slug/versions/:versionId/rollback`

**认证**：需登录，且为文章作者

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章 slug |
| versionId | number | 版本 ID |

**成功响应**（200）：

```json
{
  "rolledBack": true,
  "versionNumber": 2
}
```

---

## 二十三、私信接口

### 23.1 获取消息列表

**GET** `/api/messages`

**认证**：需登录

**成功响应**（200）：

```json
{
  "conversations": [
    {
      "userId": 2,
      "user": { "name": "李四", "avatar": "/uploads/avatar.png" },
      "lastMessage": "你好，最近有什么新文章吗？",
      "unreadCount": 2,
      "lastMessageAt": "2026-01-01T14:00:00.000Z"
    }
  ],
  "total": 5
}
```

### 23.2 获取与指定用户的对话

**GET** `/api/messages/:userId`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | number | 用户 ID |

**查询参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 20 | 每页条数 |

**成功响应**（200）：

```json
{
  "messages": [
    {
      "id": 1,
      "content": "你好，最近有什么新文章吗？",
      "senderId": 2,
      "read": true,
      "createdAt": "2026-01-01T14:00:00.000Z"
    }
  ],
  "total": 10
}
```

### 23.3 发送消息

**POST** `/api/messages`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| receiverId | number | 是 | 接收者 ID |
| content | string | 是 | 消息内容 |

**成功响应**（200）：

```json
{
  "id": 1,
  "content": "你好，最近有什么新文章吗？",
  "createdAt": "2026-01-01T14:00:00.000Z"
}
```

### 23.4 标记消息已读

**POST** `/api/messages/:id/read`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 消息 ID |

**成功响应**（200）：

```json
{
  "read": true
}
```

### 23.5 获取未读消息数

**GET** `/api/messages/unread`

**认证**：需登录

**成功响应**（200）：

```json
{
  "unreadCount": 5
}
```

---

## 二十四、OAuth接口

### 24.1 GitHub登录跳转

**GET** `/api/auth/oauth/github`

**成功响应**（302）：跳转至 GitHub 授权页面

### 24.2 GitHub回调

**GET** `/api/auth/oauth/github/callback`

**查询参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | GitHub 返回的授权码 |
| state | string | 状态参数 |

**成功响应**（200）：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@moke.com",
    "avatar": "/uploads/avatar.png"
  }
}
```

### 24.3 Google登录跳转

**GET** `/api/auth/oauth/google`

**成功响应**（302）：跳转至 Google 授权页面

### 24.4 Google回调

**GET** `/api/auth/oauth/google/callback`

**成功响应**（200）：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 24.5 获取已绑定平台

**GET** `/api/auth/oauth/providers`

**认证**：需登录

**成功响应**（200）：

```json
{
  "providers": ["github", "google"]
}
```

### 24.6 解绑平台

**POST** `/api/auth/oauth/unbind/:provider`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| provider | string | 平台名称（github/google/gitee/wechat） |

**成功响应**（200）：

```json
{
  "unbound": true
}
```

---

## 二十五、双因素认证接口

### 25.1 设置TOTP

**POST** `/api/auth/totp/setup`

**认证**：需登录

**成功响应**（200）：

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/墨客博客:zhangsan?secret=JBSWY3DPEHPK3PXP&issuer=墨客博客",
  "recoveryCodes": ["abc123", "def456", "ghi789"]
}
```

### 25.2 验证TOTP

**POST** `/api/auth/totp/verify`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 6位验证码 |

**成功响应**（200）：

```json
{
  "verified": true
}
```

### 25.3 启用TOTP

**POST** `/api/auth/totp/enable`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 6位验证码 |

**成功响应**（200）：

```json
{
  "enabled": true
}
```

### 25.4 禁用TOTP

**POST** `/api/auth/totp/disable`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | 是 | 用户密码 |

**成功响应**（200）：

```json
{
  "disabled": true
}
```

### 25.5 使用恢复码

**POST** `/api/auth/totp/recovery`

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 恢复码 |

**成功响应**（200）：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 二十六、密码重置接口

### 26.1 请求密码重置

**POST** `/api/auth/forgot`

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 用户邮箱 |

**成功响应**（200）：

```json
{
  "message": "重置链接已发送到您的邮箱"
}
```

### 26.2 验证重置链接

**GET** `/api/auth/reset/:token`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| token | string | 重置令牌 |

**成功响应**（200）：

```json
{
  "valid": true,
  "email": "zhangsan@moke.com"
}
```

### 26.3 设置新密码

**POST** `/api/auth/reset`

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | 重置令牌 |
| password | string | 是 | 新密码（6-32位） |

**成功响应**（200）：

```json
{
  "message": "密码重置成功"
}
```

---

## 二十七、打赏接口

### 27.1 创建打赏

**POST** `/api/tips`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| postId | number | 是 | 文章 ID |
| amount | number | 是 | 打赏金额（分） |
| type | string | 是 | 打赏方式（wechat/alipay/points） |
| message | string | 否 | 留言 |

**成功响应**（200）：

```json
{
  "id": 1,
  "amount": 100,
  "type": "points"
}
```

### 27.2 获取打赏列表

**GET** `/api/tips/:postId`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| postId | number | 文章 ID |

**成功响应**（200）：

```json
{
  "tips": [
    {
      "id": 1,
      "amount": 100,
      "message": "写得太好了！",
      "user": { "name": "李四", "avatar": "/uploads/avatar.png" },
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "total": 10,
  "totalAmount": 1000
}
```

### 27.3 获取打赏统计

**GET** `/api/tips/stats/:userId`

**认证**：需登录，且为用户本人或管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | number | 用户 ID |

**成功响应**（200）：

```json
{
  "totalTips": 100,
  "totalAmount": 10000,
  "monthlyTips": [
    { "month": "2026-01", "amount": 5000 },
    { "month": "2026-02", "amount": 5000 }
  ]
}
```

---

## 二十八、邮件订阅接口

### 28.1 订阅文章更新

**POST** `/api/subscriptions/post`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetId | number | 是 | 作者 ID |

**成功响应**（200）：

```json
{
  "subscribed": true
}
```

### 28.2 订阅专栏

**POST** `/api/subscriptions/column`

**认证**：需登录

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetId | number | 是 | 专栏 ID |

**成功响应**（200）：

```json
{
  "subscribed": true
}
```

### 28.3 获取订阅列表

**GET** `/api/subscriptions`

**认证**：需登录

**成功响应**（200）：

```json
{
  "subscriptions": [
    {
      "id": 1,
      "type": "post",
      "targetId": 1,
      "targetName": "张三",
      "active": true
    }
  ],
  "total": 5
}
```

### 28.4 取消订阅

**DELETE** `/api/subscriptions/:id`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 订阅 ID |

**成功响应**（200）：

```json
{
  "subscribed": false
}
```

---

## 二十九、数据分析接口

### 29.1 获取文章热度趋势

**GET** `/api/analytics/posts/trends`

**认证**：需管理员

**查询参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| period | string | weekly | 时间周期（daily/weekly/monthly） |

**成功响应**（200）：

```json
{
  "period": "weekly",
  "trends": [
    { "date": "2026-01-01", "views": 1000, "likes": 100 },
    { "date": "2026-01-02", "views": 1200, "likes": 120 }
  ]
}
```

### 29.2 获取分类热度趋势

**GET** `/api/analytics/categories/trends`

**认证**：需管理员

**成功响应**（200）：

```json
{
  "trends": [
    { "category": "React", "views": 10000 },
    { "category": "Vue", "views": 8000 }
  ]
}
```

### 29.3 获取用户增长趋势

**GET** `/api/analytics/users/trends`

**认证**：需管理员

**成功响应**（200）：

```json
{
  "trends": [
    { "date": "2026-01-01", "newUsers": 100, "activeUsers": 500 },
    { "date": "2026-01-02", "newUsers": 120, "activeUsers": 550 }
  ]
}
```

### 29.4 获取文章详细数据

**GET** `/api/analytics/posts/:id/stats`

**认证**：需登录，且为文章作者或管理员

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 文章 ID |

**成功响应**（200）：

```json
{
  "postId": 1,
  "title": "React 18 新特性详解",
  "views": 1000,
  "likes": 100,
  "comments": 50,
  "favorites": 30,
  "tips": 10,
  "trafficSources": [
    { "source": "search", "percent": 40 },
    { "source": "recommend", "percent": 30 },
    { "source": "direct", "percent": 20 },
    { "source": "external", "percent": 10 }
  ],
  "dailyViews": [
    { "date": "2026-01-01", "views": 100 },
    { "date": "2026-01-02", "views": 120 }
  ]
}
```

---

## 三十、文章导出接口

### 30.1 导出Markdown

**GET** `/api/posts/:slug/export/md`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章 slug |

**成功响应**（200）：

```markdown
# React 18 新特性详解

## 前言

深入了解 React 18 的并发特性...
```

### 30.2 导出HTML

**GET** `/api/posts/:slug/export/html`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章 slug |

**成功响应**（200）：HTML 文件

### 30.3 导出PDF

**GET** `/api/posts/:slug/export/pdf`

**认证**：需登录

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章 slug |

**成功响应**（200）：PDF 文件

---

## 三十一、错误码汇总

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| `VALIDATION_ERROR` | 参数验证失败 | 400 |
| `UNAUTHORIZED` | 未授权，token 无效或未提供 | 401 |
| `FORBIDDEN` | 无权限访问 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |
| `RATE_LIMITED` | 请求过于频繁 | 429 |
| `DUPLICATE_RECORD` | 重复记录 | 409 |
| `LEVEL_INSUFFICIENT` | 等级不足 | 403 |
| `TOTP_NOT_VERIFIED` | TOTP 未验证 | 403 |
| `TOTP_INVALID` | TOTP 验证码无效 | 400 |
| `RESET_TOKEN_INVALID` | 重置令牌无效 | 400 |
| `RESET_TOKEN_EXPIRED` | 重置令牌已过期 | 400 |
| `INSUFFICIENT_POINTS` | 积分不足 | 400 |

---

*文档版本：v5.0 | 更新日期：2026-07-13*