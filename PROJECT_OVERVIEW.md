# 墨客博客 (Moke Blog) — 项目说明文档

---

## 一、项目概述

墨客博客是一个**功能完整的全栈博客平台**，采用前后端分离架构。前端基于 React 18 + Vite 5 构建，提供流畅的单页应用体验；后端基于 Express 4 + PostgreSQL 提供 RESTful API 服务。项目名"墨客"寓意热爱文字与技术的写作者。

**项目定位**：个人博客 CMS，支持文章的发布、浏览、分类、搜索、评论及用户认证。

---

## 二、技术栈总览

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | React | 18.3 | UI 构建 |
| **构建工具** | Vite | 5.4 | 开发服务器 + 打包 |
| **路由** | React Router | 6.26 | SPA 路由管理 |
| **图标** | Lucide React | 0.441 | 图标系统 |
| **样式** | CSS Modules | — | 组件级样式隔离 |
| **后端框架** | Express | 4.21 | HTTP 服务器 |
| **数据库** | PostgreSQL | 8.22 (pg) | 数据持久化 |
| **认证** | JWT + bcryptjs | 9.0 / 2.4 | 令牌认证 + 密码哈希 |
| **文件上传** | Multer | 2.2 | 图片上传中间件 |
| **跨域** | cors | 2.8 | CORS 处理 |
| **前端代理** | Vite Proxy | — | 开发环境 API 转发 |

---

## 三、项目目录结构

```
blog-demo/
├── index.html                    # HTML 入口文件
├── package.json                  # 前端依赖配置
├── vite.config.js                # Vite 配置（含 API 代理）
├── API.md                        # RESTful API 接口文档
├── README.md                     # 项目总览与快速开始
├── .trae/
│   └── documents/
│       └── blog-website-development-plan.md  # 开发计划文档
│
├── server/                       # ━━━ 后端服务 ━━━
│   ├── .env                      # 环境变量（端口、JWT 密钥等）
│   ├── package.json              # 后端依赖配置
│   ├── src/
│   │   ├── index.js              # Express 入口，路由注册，服务启动
│   │   ├── db.js                 # PostgreSQL 数据库连接与初始化
│   │   └── seed.js               # 数据库种子数据（文章/分类/评论）
│   └── uploads/                  # 图片上传存储目录
│       └── mrcth9wd-gqt7d7.png  # 示例上传图片
│
└── src/                          # ━━━ 前端应用 ━━━
    ├── main.jsx                   # React 应用入口
    ├── App.jsx                    # 路由配置（含懒加载）
    ├── api/
    │   └── client.js              # API 请求客户端封装
    ├── data/
    │   └── mockData.js            # Mock 数据（开发/预览用）
    ├── utils/
    │   └── helpers.js             # 工具函数（日期/分页/搜索/阅读时间）
    ├── styles/
    │   ├── variables.css          # CSS 自定义属性（色彩/间距/排版/阴影）
    │   ├── global.css             # Reset + 全局样式 + 工具类
    │   └── animations.css         # 全局关键帧动画
    ├── components/                # ━━━ 可复用组件 ━━━
    │   ├── Navbar/                # 导航栏（响应式 + 移动端汉堡菜单）
    │   ├── BlogCard/              # 文章卡片（封面图/摘要/标签/作者/阅读量）
    │   ├── BlogList/              # 文章列表（网格布局 + 空状态）
    │   ├── Carousel/              # 轮播图组件
    │   ├── Pagination/            # 分页控件（首尾跳转/省略号折叠）
    │   ├── Sidebar/               # 侧边栏（作者信息/热门文章/最新评论/标签云）
    │   ├── SearchModal/           # 搜索模态框（实时过滤 + 关键词高亮）
    │   ├── AuthModal/             # 登录/注册弹窗（含社交登录入口）
    │   ├── ShareButtons/          # 社交分享（Twitter/Facebook/LinkedIn/WhatsApp）
    │   ├── CommentSection/        # 评论区（表单验证/乐观更新/loading 状态）
    │   ├── Toast/                 # 全局 Toast 通知系统
    │   └── Footer/                # 页脚（版权/社交链接/联系方式）
    └── pages/                     # ━━━ 页面组件 ━━━
        ├── Home.jsx               # 首页（Hero + 文章列表 + 分类 + 数据统计）
        ├── PostDetail.jsx         # 文章详情（正文渲染/面包屑/上下篇/评论）
        ├── CategoryPage.jsx       # 分类页（按分类过滤文章 + 分页）
        ├── PostEditor.jsx         # 文章编辑器（新建/编辑文章）
        └── Profile.jsx            # 个人中心（信息展示 + 密码修改）
```

---

## 四、功能模块详解

### 4.1 首页 (Home)

首页是用户进入博客的第一印象，由以下区块组成：

- **全屏 Hero 区域**：背景图 + 半透明遮罩 + 博客标题"墨客博客" + 副标题"聆听小王子，守望成长，静待花开"。底部有向下滚动提示箭头。
- **心形粒子系统**：基于 Canvas 2D 实现，鼠标移动时在轨迹上生成带重力效果的粉色心形粒子，具有物理运动（速度/旋转/衰减/边界碰撞）。
- **关于我**：博主头像 + 个人简介文字。
- **最新文章**：文章列表以卡片形式展示（封面图/标题/摘要/日期/阅读量/评论数/标签），支持分页。
- **分类浏览**：展示所有分类入口，点击跳转到分类页。
- **主要数据**：文章数/分类数/评论数/访问量统计展示。
- **滚动动画**：使用 `IntersectionObserver` 实现区块进入视口时的淡入动画。

### 4.2 文章详情页 (PostDetail)

- **面包屑导航**：首页 > 分类 > 文章标题，含 ARIA 标签。
- **封面图展示**：文章封面大图 + 分类色标。
- **文章头部**：标题 + 作者头像/名称 + 发布日期/阅读量/预计阅读时间。
- **正文渲染**：基于 Markdown 风格的简易解析器，支持 `##` 标题、`###` 标题、`- ` 无序列表、`数字.` 有序列表、段落。
- **标签**：文章标签展示。
- **社交分享**：Twitter / Facebook / LinkedIn / WhatsApp / 复制链接。
- **上下篇导航**：上一篇 / 下一篇链接。
- **评论区**：发表评论表单 + 评论列表。

### 4.3 分类页 (CategoryPage)

- 按分类 Slug 过滤文章列表。
- 显示分类名称、描述、文章数量。
- 与首页相同的分页机制。

### 4.4 文章编辑器 (PostEditor)

- 支持新建文章和编辑已有文章。
- 表单字段：标题、摘要、正文内容、封面图 URL、分类选择、标签。
- 表单验证（必填项检查、字数限制）。
- 图片上传功能（通过后端 `/api/upload` 接口）。

### 4.5 个人中心 (Profile)

- 需要登录才能访问。
- **个人信息卡片**：展示用户名、邮箱、头像。
- **修改密码**：当前密码验证 + 新密码设置 + 确认密码，含前端验证和密码可见性切换。

### 4.6 搜索 (SearchModal)

- 全屏模态框搜索。
- 实时过滤匹配文章标题、摘要和标签。
- 搜索结果高亮匹配关键词。
- 支持键盘操作（ESC 关闭）。

### 4.7 认证系统 (AuthModal)

- 登录和注册切换式弹窗。
- 前端表单验证（邮箱格式、密码长度等）。
- 社交登录入口展示（UI 占位）。
- JWT Token 存储在 `localStorage`。

### 4.8 评论系统 (CommentSection)

- 评论列表展示（作者头像/名称/内容/发布时间/点赞数）。
- 发表评论需登录，内容 2-500 字验证。
- 乐观更新：提交评论后立即显示，失败则回滚。
- Loading 状态和空状态处理。

---

## 五、后端 API 详解

### 5.1 服务启动

```
server/src/index.js → initDb() → 自动 seed（首次运行） → 监听端口
```

### 5.2 数据模型

| 表名 | 主要字段 | 说明 |
|------|----------|------|
| `users` | id, name, email, password, avatar, bio | 用户表 |
| `posts` | id, slug, title, summary, content, coverImage, categoryId, authorId, views, publishedAt, updatedAt | 文章表 |
| `categories` | id, name, slug, description, color, icon | 分类表 |
| `post_tags` | id, postId, tag | 文章标签关联表 |
| `comments` | id, postId, author, avatar, content, likes, createdAt | 评论表 |

### 5.3 核心 API 路由

| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |
| PUT | `/api/auth/password` | 修改密码 | 是 |
| GET | `/api/posts` | 文章列表（分页/过滤/搜索/排序） | 否 |
| GET | `/api/posts/:slug` | 文章详情（含上下篇） | 否 |
| GET | `/api/posts/popular` | 热门文章 | 否 |
| POST | `/api/posts` | 创建文章 | 是 |
| PUT | `/api/posts/:id` | 更新文章 | 是 |
| DELETE | `/api/posts/:id` | 删除文章 | 是 |
| GET | `/api/posts/:slug/comments` | 文章评论列表 | 否 |
| POST | `/api/posts/:slug/comments` | 发表评论 | 是 |
| GET | `/api/comments/recent` | 最新评论 | 否 |
| GET | `/api/categories` | 全部分类 | 否 |
| GET | `/api/tags` | 标签云 | 否 |
| POST | `/api/upload` | 图片上传 | 是 |

### 5.4 认证机制

- **JWT Token**：登录成功后签发，有效期 7 天。
- **Bearer Token**：请求头携带 `Authorization: Bearer <token>`。
- **密码哈希**：使用 bcryptjs，10 轮 salt rounds。
- **中间件**：`authMiddleware` 拦截需要认证的路由。

### 5.5 图片上传

- 使用 Multer 中间件处理 `multipart/form-data`。
- 存储方式：本地文件系统（`server/uploads/`）。
- 支持格式：jpg, jpeg, png, gif, webp, svg, bmp。
- 文件大小限制：10MB。
- 文件名：时间戳 + 随机字符串 + 扩展名，避免冲突。

### 5.6 数据初始化

- 首次启动时自动检测数据库是否为空。
- 如果为空，执行 `seed.js` 导入预设数据（20 篇文章、分类、评论等）。
- 使用 `sql.js`（SQLite 兼容层）初始化 PostgreSQL 表结构。

---

## 六、前后端通信架构

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   浏览器 (Vite)  │ ──────▶ │  Vite Dev Server │ ──────▶ │ Express API │
│   localhost:3000 │ proxy   │   localhost:3000 │  proxy  │ localhost:3002 │
│                 │         │                  │         │             │
│  React + Router  │         │  /api/* → 3002   │         │  PostgreSQL │
│  CSS Modules     │         │  /uploads → 3002 │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

- **开发环境**：Vite 的 `server.proxy` 将 `/api` 和 `/uploads` 请求代理到后端 `localhost:3002`。
- **生产环境**：前后端需分别部署，前端静态文件由 Vite 构建输出，后端独立运行。
- **API 客户端**：`src/api/client.js` 封装了所有 API 调用，自动附加 JWT Token。

---

## 七、前端架构亮点

### 7.1 路由与代码分割

```jsx
const Home = lazy(() => import('./pages/Home'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
// ... 其他页面

<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/post/:slug" element={<PostDetail />} />
    {/* ... */}
  </Routes>
</Suspense>
```

使用 `React.lazy` + `Suspense` 实现路由级代码分割，每个页面独立打包，减少首屏加载体积。

### 7.2 CSS Modules 样式隔离

每个组件/页面都有对应的 `.module.css` 文件，通过 `import styles from './Component.module.css'` 引入，类名自动哈希，避免全局样式冲突。

### 7.3 Toast 通知系统

通过 React Context 实现全局 Toast 通知，任何组件都可以调用 `useToast()` hook 弹出成功/错误/警告提示。

### 7.4 Canvas 粒子动画

首页 Hero 区域的爱心粒子系统完全基于原生 Canvas 2D API 实现：
- 贝塞尔曲线绘制心形
- 粒子物理模拟（重力、速度、旋转、衰减）
- 鼠标位置追踪触发粒子生成
- `requestAnimationFrame` 驱动动画循环

---

## 八、UI/UX 设计特点

### 8.1 响应式设计

| 断点 | 范围 | 布局 |
|------|------|------|
| 桌面端 | ≥ 1024px | 主内容 + 侧边栏双栏 |
| 平板 | 768px ~ 1023px | 主内容 + 侧边栏单栏 |
| 移动端 | < 768px | 全宽单栏，汉堡菜单 |

### 8.2 设计规范

| 要素 | 规范 |
|------|------|
| 主色 | `#2563eb`（蓝色） |
| 辅助色 | `#7c3aed`（紫色） |
| 强调色 | `#f59e0b`（金色） |
| 字体 | Inter（英文）/ PingFang SC / Microsoft YaHei（中文） |
| 间距 | 8 点网格系统（4/8/12/16/24/32/64px） |
| 最大宽度 | 1200px |
| 侧边栏 | 320px |

### 8.3 动画系统

- **文章卡片交错入场**：CSS `animation-delay` 基于索引计算。
- **弹窗缩放**：`scale(0.95)` → `scale(1)` 过渡。
- **遮罩淡入**：`opacity: 0` → `1` 过渡。
- **浮动元素**：Hero 区域背景图微动效果。
- **滚动触发**：`IntersectionObserver` 驱动区块入场。

---

## 九、可访问性 (A11y)

| 特性 | 实现 |
|------|------|
| 语义化 HTML | `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`, `<time>` |
| ARIA 属性 | `aria-label`, `aria-current`, `aria-expanded`, `aria-modal` |
| 键盘导航 | Tab 切换, ESC 关闭模态框, 焦点陷阱 |
| 表单标签 | `<label htmlFor="...">` 关联输入框 |
| 图片 Alt | 所有图片均有 `alt` 属性 |
| 角色标记 | 自定义按钮使用 `role="button"` + `tabIndex` |

---

## 十、性能优化

| 优化项 | 实现方式 |
|--------|----------|
| 路由代码分割 | `React.lazy` + `Suspense` |
| 图片懒加载 | `loading="lazy"` 属性 |
| 被动事件监听 | 滚动事件使用 `passive` 模式 |
| CSS 作用域隔离 | CSS Modules 避免全局污染 |
| 分页数据 | 服务端分页，每页 6~9 条 |
| 搜索客户端过滤 | 前端即时搜索，减少 API 调用 |

---

## 十一、快速开始

```bash
# 1. 克隆项目
cd blog-demo

# 2. 安装前端依赖
npm install

# 3. 安装后端依赖
cd server && npm install && cd ..

# 4. 配置数据库（确保 PostgreSQL 已启动并创建数据库）
# 修改 server/.env 中的数据库连接信息

# 5. 启动后端服务（端口 3002）
cd server && npm start

# 6. 启动前端开发服务器（端口 3000，自动代理 API）
npm run dev

# 7. 访问 http://localhost:3000
```

---

## 十二、浏览器兼容性

- Chrome / Edge ≥ 90
- Firefox ≥ 90
- Safari ≥ 15
- 现代移动端浏览器

---

## 十三、后续扩展建议

| 方向 | 说明 |
|------|------|
| Markdown 编辑器 | 替换简单文本框为富文本/Markdown 编辑器（如 TipTap、MDX Editor） |
| 图片管理 | 集成对象存储（OSS/COS），替换本地文件系统存储 |
| 文章草稿 | 添加草稿状态和定时发布功能 |
| 用户管理 | 管理员后台、用户角色权限 |
| SEO 优化 | SSR/SSG（Next.js 迁移）、Meta 标签动态注入 |
| 主题系统 | 支持暗色模式切换、主题自定义 |
| 点赞/收藏 | 文章点赞、收藏功能 |
| 邮件通知 | 评论回复邮件提醒 |
| 单元测试 | Jest + React Testing Library 覆盖核心组件 |

---

*本文档基于项目代码自动分析生成，版本日期：2026-07-09*
