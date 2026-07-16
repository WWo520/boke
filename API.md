# 墨客博客 API 文档

Base URL: `http://localhost:3000/api`

---

## 文章

### 获取文章列表

```
GET /posts
```

**查询参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 9 | 每页数量 |
| `category` | string | - | 分类 slug（可选，过滤文章） |
| `search` | string | - | 搜索关键词（可选，匹配标题/摘要） |

**响应示例**

```json
{
  "data": [
    {
      "id": 1,
      "slug": "getting-started-with-react",
      "title": "React 入门指南",
      "summary": "React 是一个用于构建用户界面的 JavaScript 库...",
      "coverImage": "https://picsum.photos/seed/react/800/450",
      "category": {
        "id": 1,
        "name": "前端开发",
        "slug": "frontend",
        "color": "#2563eb",
        "icon": "Code2"
      },
      "author": {
        "name": "张三",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan"
      },
      "tags": ["React", "JavaScript", "入门"],
      "publishedAt": "2025-12-15T08:00:00.000Z",
      "views": 1280,
      "commentCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 9,
    "total": 20,
    "totalPages": 3
  }
}
```

---

### 获取文章详情

```
GET /posts/:slug
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `slug` | string | 文章唯一标识 |

**响应示例**

```json
{
  "data": {
    "id": 1,
    "slug": "getting-started-with-react",
    "title": "React 入门指南",
    "content": "## 什么是 React？\n\nReact 是由 Facebook 开发的...",
    "coverImage": "https://picsum.photos/seed/react/800/450",
    "category": {
      "id": 1,
      "name": "前端开发",
      "slug": "frontend",
      "color": "#2563eb"
    },
    "author": {
      "name": "张三",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan",
      "bio": "前端工程师，热爱开源"
    },
    "tags": ["React", "JavaScript", "入门"],
    "publishedAt": "2025-12-15T08:00:00.000Z",
    "updatedAt": "2025-12-20T10:30:00.000Z",
    "views": 1280,
    "commentCount": 5,
    "prevPost": {
      "slug": "css-grid-layout",
      "title": "CSS Grid 布局完全指南"
    },
    "nextPost": {
      "slug": "understanding-javascript-closures",
      "title": "理解 JavaScript 闭包"
    }
  }
}
```

**错误响应**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "文章不存在"
  }
}
```

---

### 获取热门文章

```
GET /posts/popular
```

**查询参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | number | 5 | 返回数量 |

**响应示例**

```json
{
  "data": [
    {
      "slug": "getting-started-with-react",
      "title": "React 入门指南",
      "views": 1280,
      "publishedAt": "2025-12-15T08:00:00.000Z"
    }
  ]
}
```

---

## 分类

### 获取全部分类

```
GET /categories
```

**响应示例**

```json
{
  "data": [
    {
      "id": 1,
      "name": "前端开发",
      "slug": "frontend",
      "description": "HTML、CSS、JavaScript 等前端技术",
      "color": "#2563eb",
      "icon": "Code2",
      "count": 5
    }
  ]
}
```

---

## 标签

### 获取标签云

```
GET /tags
```

**响应示例**

```json
{
  "data": [
    {
      "name": "React",
      "count": 4
    },
    {
      "name": "JavaScript",
      "count": 6
    }
  ]
}
```

---

## 评论

### 获取文章评论

```
GET /posts/:slug/comments
```

**查询参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页数量 |

**响应示例**

```json
{
  "data": [
    {
      "id": 1,
      "author": "李明",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=liming",
      "content": "写得非常详细，对于新手很有帮助！",
      "createdAt": "2025-12-16T10:30:00.000Z",
      "likes": 3
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 发表评论

```
POST /posts/:slug/comments
```

**请求头**

```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | 是 | 评论内容，2-500 字 |

```json
{
  "content": "写得非常详细，对于新手很有帮助！"
}
```

**响应示例** (201 Created)

```json
{
  "data": {
    "id": 6,
    "author": "当前用户",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
    "content": "写得非常详细，对于新手很有帮助！",
    "createdAt": "2025-12-20T14:00:00.000Z",
    "likes": 0
  }
}
```

**错误响应**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "评论内容不能为空"
  }
}
```

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "请先登录"
  }
}
```

---

### 获取最新评论

```
GET /comments/recent
```

**查询参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | number | 5 | 返回数量 |

**响应示例**

```json
{
  "data": [
    {
      "id": 1,
      "author": "李明",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=liming",
      "content": "写得非常详细，对于新手很有帮助！",
      "postSlug": "getting-started-with-react",
      "postTitle": "React 入门指南",
      "createdAt": "2025-12-16T10:30:00.000Z"
    }
  ]
}
```

---

## 认证

### 登录

```
POST /auth/login
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱 |
| `password` | string | 是 | 密码 |

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "张三",
      "email": "user@example.com",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan"
    }
  }
}
```

**错误响应**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "邮箱或密码错误"
  }
}
```

---

### 注册

```
POST /auth/register
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 用户名，2-20 字 |
| `email` | string | 是 | 邮箱 |
| `password` | string | 是 | 密码，至少 6 位 |

```json
{
  "name": "张三",
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例** (201 Created)

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "张三",
      "email": "user@example.com",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan"
    }
  }
}
```

---

### 获取当前用户

```
GET /auth/me
```

**请求头**

```
Authorization: Bearer <token>
```

**响应示例**

```json
{
  "data": {
    "id": 1,
    "name": "张三",
    "email": "user@example.com",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan",
    "bio": "前端工程师"
  }
}
```

---

## 公共规范

### 分页参数

所有列表接口统一分页格式：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页数量（最大 50） |

分页响应：

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 认证方式

Bearer Token 认证，在请求头中携带：

```
Authorization: Bearer <token>
```

### 错误格式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误描述"
  }
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
