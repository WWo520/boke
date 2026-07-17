# 墨客博客 (Moke Blog)

一个功能完整的响应式博客前端项目，基于 React 18 + Vite 5 构建。

## 技术栈

### 前端

| 技术 | 版本 |
|------|------|
| React | 18.3 |
| Vite | 5.4 |
| React Router | 6.26 |
| Lucide React | 0.441 |
| 样式方案 | CSS Modules |

### 后端

| 技术 | 版本 |
|------|------|
| 运行环境 | Node.js (ES Modules) |
| Web 框架 | Express 4.21 |
| 认证 | JWT (jsonwebtoken) + bcryptjs |
| 文件上传 | multer |
| 跨域 | cors |

### 数据库

| 技术 | 版本 |
|------|------|
| 主数据库 | PostgreSQL (pg 8.22) |
| 初始化工具 | sql.js (SQLite 兼容层) |

### 存储

- 图片上传：本地文件系统（`server/uploads/`）

### 前后端通信

- RESTful API（JSON 格式）
- 基于 Token 的认证（Bearer Token）
- 文件上传使用 `FormData` + `XMLHttpRequest`

## 功能特性

### 核心功能
- **文章列表** — 卡片式布局，含封面图、摘要、作者信息、阅读量、标签
- **文章详情** — 正文渲染（标题/段落/列表）、面包屑导航、上下篇切换
- **分类页面** — 按分类过滤文章，显示分类图标和文章数
- **分页系统** — 页码导航、首尾页快捷跳转、省略号折叠
- **全文搜索** — 模态框实时搜索，匹配文章标题、摘要和标签，结果高亮
- **评论系统** — 发表评论表单、表单验证、乐观更新、loading/空状态
- **社交分享** — Twitter / Facebook / LinkedIn / WhatsApp / 复制链接
- **登录注册** — 登录/注册弹窗，含社交登录入口

### UI / UX
- **响应式设计** — 桌面端(≥1024px) / 平板(768~1023px) / 移动端(<768px)
- **CSS 动画** — 文章卡片交错入场、弹窗缩放、遮罩淡入、浮动元素
- **导航栏** — 滚动渐变背景、分类下拉菜单、移动端汉堡菜单
- **侧边栏** — 作者卡片、热门文章排行、最新评论、分类标签云
- **404 页面** — 渐变数字背景、浮动动画、返回首页链接
- **Loading 状态** — 路由懒加载旋转动画

### 可访问性
- 语义化 HTML（`<nav>`、`<main>`、`<article>`、`<aside>`、`<footer>`）
- ARIA 属性（`aria-label`、`aria-current`、`aria-expanded`、`aria-modal`）
- 键盘导航（Tab 切换、ESC 关闭、焦点陷阱）
- 表单标签关联（`<label htmlFor="...">`）
- 图片 alt 文本全覆盖

### 性能
- 按路由代码分割（`React.lazy` + `Suspense`）
- CSS Modules 作用域隔离
- 滚动事件被动监听
- 分页数据懒计算

## 项目结构

```
blog-demo/
├── index.html                     # HTML 入口
├── package.json                   # 依赖配置
├── vite.config.js                 # Vite 配置
├── README.md                      # 本文档
└── src/
    ├── main.jsx                   # React 入口
    ├── App.jsx                    # 路由配置（代码分割）
    ├── styles/
    │   ├── variables.css          # CSS 自定义属性（色彩/间距/排版/阴影）
    │   ├── global.css             # Reset + 全局样式 + 工具类
    │   └── animations.css         # 全局关键帧动画
    ├── data/
    │   └── mockData.js            # Mock 数据（20篇文章、7个分类、评论）
    ├── utils/
    │   └── helpers.js             # 工具函数（日期/截断/分页/搜索）
    ├── components/
    │   ├── Navbar/                # 导航栏（响应式+移动端抽屉）
    │   ├── BlogList/              # 文章列表（网格布局+空状态）
    │   ├── BlogCard/              # 文章卡片（封面/摘要/标签/作者）
    │   ├── Sidebar/               # 侧边栏（作者/热门/评论/标签云）
    │   ├── Pagination/            # 分页控件
    │   ├── SearchModal/           # 搜索模态框（实时过滤+高亮）
    │   ├── AuthModal/             # 登录/注册弹窗
    │   ├── ShareButtons/          # 社交分享按钮
    │   ├── CommentSection/        # 评论区（表单+列表）
    │   └── Footer/                # 页脚（版权+社交+联系）
    └── pages/
        ├── Home.jsx               # 首页
        ├── PostDetail.jsx         # 文章详情页
        ├── CategoryPage.jsx       # 分类页
        └── NotFound.jsx           # 404 页面
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 设计规范

### 色彩
- 主色：`#2563eb`（蓝）
- 辅助色：`#7c3aed`（紫）
- 强调色：`#f59e0b`（金）
- 背景：白色 / 浅灰
- 文字：深蓝灰 `#0f172a` / 石板灰 `#475569`

### 排版
- 字体：Inter（英）/ PingFang SC / Microsoft YaHei（中）
- 等宽字体：JetBrains Mono / Fira Code
- 字号：xs(0.75rem) ~ 4xl(2.25rem)

### 间距
- 8 点网格系统（4px / 8px / 12px / 16px / 24px / 32px / 64px）
- 最大内容宽度：1200px
- 侧边栏宽度：320px

## 浏览器兼容

- Chrome / Edge ≥ 90
- Firefox ≥ 90
- Safari ≥ 15
- 现代移动端浏览器

## License
如需定制自己的博客和别的项目请联系
![alt text](public\image.png)
MIT
