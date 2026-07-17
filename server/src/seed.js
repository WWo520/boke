import bcrypt from 'bcryptjs';

const CATEGORIES = [
  { name: '技术', slug: 'tech', description: '编程语言、框架、工具等技术内容', color: '#2563eb', icon: 'Code2' },
  { name: '设计', slug: 'design', description: 'UI/UX 设计、设计系统等', color: '#7c3aed', icon: 'Palette' },
  { name: '生活', slug: 'life', description: '生活方式、效率工具等', color: '#10b981', icon: 'Sun' },
  { name: '前端', slug: 'frontend', description: '前端开发技术文章', color: '#f59e0b', icon: 'Layout' },
  { name: '思考', slug: 'thoughts', description: '技术思维、职业发展等', color: '#ef4444', icon: 'BrainCircuit' },
];

const POSTS = [
  {
    slug: 'react-18-concurrent-mode-guide',
    title: 'React 18 并发模式实战指南',
    summary: '深入浅出地介绍 React 18 的并发特性，包括 Suspense、Transitions 和新的 Streaming SSR，帮助你构建更流畅的用户体验。',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    categoryId: 1, tags: ['React', 'JavaScript', '前端'], views: 2840,
    publishedAt: '2024-12-15T08:00:00Z',
    content: `React 18 引入了全新的并发模式（Concurrent Mode），这是 React 自诞生以来最重要的一次架构升级。

## 什么是并发模式？

并发模式是 React 的一组新特性，它帮助 React 应用保持响应性，即使在渲染大量组件时也能根据用户设备的性能和网络状况调整渲染优先级。

## 核心特性

### 1. 自动批处理（Automatic Batching）

在 React 18 之前，只有在 React 事件处理函数中的更新才会被批处理。现在，所有更新都会自动批处理，包括 Promise、setTimeout 以及原生事件处理。

### 2. Transitions

Transition 是 React 18 中一个全新的概念，它帮助区分紧急更新和非紧急更新。

### 3. Suspense 增强

React 18 中的 Suspense 不再仅限于代码分割，它可以配合任何异步操作使用。

## 实践建议

在实际项目中，并发模式可以帮助我们解决很多性能问题。但需要注意的是，不是所有场景都需要使用并发模式，合理的分析需求场景才是关键。`,
    comments: [
      { author: '小明', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=xiaoming', content: '写得非常详细，对并发模式的理解又加深了。', createdAt: '2024-12-16T10:30:00Z' },
      { author: 'TechGirl', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=techgirl', content: 'Transition 的部分解释得很清楚，解决了我一直以来的疑惑。', createdAt: '2024-12-17T14:20:00Z' },
      { author: '代码君', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=coder', content: '期待后续关于 Streaming SSR 的文章！', createdAt: '2024-12-18T09:15:00Z' },
    ],
  },
  {
    slug: 'css-container-queries-intro',
    title: 'CSS Container Queries 入门与实践',
    summary: 'Container Queries 让组件可以根据容器尺寸自适应布局，本文将带你从零掌握这一革命性的 CSS 特性。',
    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop',
    categoryId: 4, tags: ['CSS', '前端', '响应式设计'], views: 1560,
    publishedAt: '2024-12-10T10:00:00Z',
    content: `Container Queries 是 CSS 近年来最令人兴奋的特性之一。它让我们终于可以根据父容器的尺寸来设置样式。

## 为什么需要 Container Queries？

在组件化开发的今天，一个组件可能被放置在页面的不同位置，其可用宽度各不相同。传统的 Media Queries 只能根据视口尺寸来调整样式，而 Container Queries 完美地解决了这个痛点。

## 基本用法

Container Queries 让组件真正实现了"一次编写，处处适配"的承诺。`,
    comments: [
      { author: '设计狮', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=designer', content: 'Container Queries 真是前端开发的福音！', createdAt: '2024-12-11T08:00:00Z' },
    ],
  },
  {
    slug: 'vite-dev-environment-setup',
    title: '使用 Vite 搭建极速开发环境',
    summary: '从零开始配置 Vite 项目，体验毫秒级热更新的开发快感，告别 Webpack 漫长的编译等待。',
    coverImage: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&h=450&fit=crop',
    categoryId: 4, tags: ['Vite', '前端', '工具'], views: 2100,
    publishedAt: '2024-12-05T14:00:00Z',
    content: `Vite 凭借其优秀的开发体验，已经成为越来越多开发者的首选构建工具。

## Vite 的核心优势

### 极速启动
Vite 利用浏览器原生 ES Module 支持，实现了真正的按需编译。项目启动速度与项目大小无关。

### 热更新
Vite 的 HMR 速度极快，修改代码后几乎是即时反映在浏览器中。

Vite 让前端开发体验提升到了一个新的高度。`,
    comments: [
      { author: 'NodeMaster', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=node', content: '用了 Vite 就回不去了！', createdAt: '2024-12-06T11:00:00Z' },
      { author: '初学者', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=newbie', content: '配置比我想象中简单很多，谢谢分享！', createdAt: '2024-12-07T16:30:00Z' },
    ],
  },
  {
    slug: 'modern-ui-design-principles',
    title: '现代 UI 设计原则：从理论到实践',
    summary: '探索现代 UI 设计的核心原则，包括视觉层次、色彩理论、排版系统，并通过实际案例展示应用方法。',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
    categoryId: 2, tags: ['UI设计', '设计原则', '用户体验'], views: 1890,
    publishedAt: '2024-11-28T09:00:00Z',
    content: `好的设计不仅仅是好看，更是功能与美学的完美结合。

## 核心设计原则

### 1. 视觉层次
通过大小、颜色、间距来建立清晰的信息层级，让用户能快速理解页面结构。

### 2. 一致性
保持设计语言的一致性，包括按钮样式、字体使用、间距规则等。

### 3. 留白
恰当的留白不仅让页面看起来更清爽，还能提升内容的可读性。

好的设计是隐形的，用户不会注意到它，但会感受到使用过程中的舒适。`,
    comments: [
      { author: '像素眼', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=pixel', content: '配色方案那段非常实用！', createdAt: '2024-11-29T13:00:00Z' },
    ],
  },
  {
    slug: 'typescript-advanced-type-challenges',
    title: 'TypeScript 高级类型体操指南',
    summary: '从条件类型到模板字面量类型，深入 TypeScript 类型系统的精髓，让你的代码类型安全达到新高度。',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop',
    categoryId: 1, tags: ['TypeScript', '类型', '前端'], views: 3200,
    publishedAt: '2024-11-20T11:00:00Z',
    content: `TypeScript 的类型系统是图灵完备的，这意味着你可以用类型来表达几乎任何逻辑。

## 进阶类型技巧

### 条件类型

### 模板字面量类型

掌握这些高级类型技巧，能让你写出更安全、更优雅的代码。`,
    comments: [
      { author: 'TS狂人', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=tsfan', content: '太棒了！建议再加一些 infer 的使用案例。', createdAt: '2024-11-21T09:00:00Z' },
      { author: 'Java转前端', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=javadev', content: 'TypeScript 的类型系统真的强大！', createdAt: '2024-11-22T15:00:00Z' },
    ],
  },
  {
    slug: 'minimalist-desktop-workflow',
    title: '我的极简主义桌面工作流',
    summary: '分享我经过多年打磨的桌面工作流程，包括开发工具、笔记系统、任务管理的极简配置。',
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
    categoryId: 3, tags: ['工作流', '效率', '极简'], views: 2450,
    publishedAt: '2024-11-15T08:00:00Z',
    content: `在信息爆炸的时代，保持专注变得愈发困难。通过极简主义的工作流，我找到了属于自己的节奏。

## 工具选型

### 编辑器：Neovim
轻量、快速、可定制。通过 LSP 配置，获得了与 VSCode 媲美的开发体验。

### 笔记：Obsidian
本地优先、Markdown 格式、双向链接。简单却强大。

### 终端：Warp
GPU 加速的终端，内置 AI 辅助，让命令行操作变得优雅。

极简不是简陋，而是剔除冗余后留下的精华。`,
    comments: [
      { author: '效率控', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=efficiency', content: 'Obsidian 确实好用，推荐配合 Dataview 插件！', createdAt: '2024-11-16T10:00:00Z' },
      { author: 'Vim信徒', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=vimuser', content: '同为 Neovim 用户，握手！', createdAt: '2024-11-17T08:30:00Z' },
      { author: '小白的旅程', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=white', content: 'Warp 看起来不错，试试看！', createdAt: '2024-11-18T19:00:00Z' },
    ],
  },
  {
    slug: 'javascript-async-programming',
    title: '深入理解 JavaScript 异步编程',
    summary: '从回调函数到 Promise，再到 async/await，带你彻底搞懂 JavaScript 异步编程的演进之路。',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop',
    categoryId: 1, tags: ['JavaScript', '异步', '前端'], views: 4100,
    publishedAt: '2024-11-10T08:00:00Z',
    content: `异步编程是 JavaScript 的核心能力之一。理解它的演进历程，有助于我们写出更好的代码。

## 异步编程的演进

### 回调函数时代
早期 JavaScript 通过回调处理异步，但容易陷入"回调地狱"。

### Promise
Promise 提供了更优雅的异步处理方式，通过链式调用避免了嵌套过深的问题。

### async/await
async/await 让异步代码看起来像同步代码一样直观，是目前最推荐的异步编程方式。

掌握异步编程是每个 JavaScript 开发者的必修课。`,
    comments: [
      { author: 'JS新手', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=jsnewbie', content: '讲得很清楚，回调地狱那段深有感触！', createdAt: '2024-11-11T07:00:00Z' },
    ],
  },
  {
    slug: 'design-system-building',
    title: '设计系统的构建与维护',
    summary: '从零开始构建设计系统，包括组件库的设计规范、文档编写以及跨团队协作的最佳实践。',
    coverImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=450&fit=crop',
    categoryId: 2, tags: ['设计系统', '组件库', '前端架构'], views: 1350,
    publishedAt: '2024-11-05T10:00:00Z',
    content: `设计系统是大型前端项目的基石。一个良好的设计系统能极大提升团队的开发效率和产品一致性。

## 构建设计系统

### 设计令牌（Design Tokens）
定义统一的颜色、间距、字体等基础值。

### 组件库
基于设计令牌构建可复用的 UI 组件。

### 文档网站
完善的文档是设计系统成功的关键。

设计系统不是一蹴而就的，它需要持续迭代和维护。`,
    comments: [
      { author: '组件控', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=component', content: '推荐使用 Storybook 来管理组件文档。', createdAt: '2024-11-06T14:00:00Z' },
    ],
  },
  {
    slug: 'frontend-trends-2024',
    title: '2024 年值得关注的前端技术趋势',
    summary: '盘点 2024 年前端领域最值得关注的技术趋势，包括 WebAssembly、边缘计算、AI 辅助开发等。',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
    categoryId: 1, tags: ['前端趋势', 'WebAssembly', 'AI'], views: 5600,
    publishedAt: '2024-10-28T08:00:00Z',
    content: `前端技术发展日新月异，保持对新技术的敏感度对开发者来说非常重要。

## 趋势展望

### 1. AI 辅助开发
Copilot、Cursor 等 AI 工具正在改变我们写代码的方式。

### 2. 边缘渲染
Edge Functions 让服务端渲染的速度达到了新的高度。

### 3. WebAssembly
WASM 让在浏览器中运行高性能应用成为可能。

保持学习，但不要盲目追求新。选择适合项目需求的技术才是关键。`,
    comments: [
      { author: '技术早报', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=news', content: '总结得很全面！', createdAt: '2024-10-29T09:00:00Z' },
      { author: 'AI爱好者', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=aifan', content: 'AI 辅助开发这块确实变化太快了。', createdAt: '2024-10-30T11:00:00Z' },
    ],
  },
  {
    slug: 'css-grid-for-designers',
    title: '写给设计师的 CSS Grid 教程',
    summary: '从设计师的视角理解 CSS Grid，通过可视化示例掌握复杂的网格布局技巧。',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
    categoryId: 2, tags: ['CSS', 'Grid', '设计'], views: 980,
    publishedAt: '2024-10-20T09:00:00Z',
    content: `CSS Grid 是目前最强大的布局系统。设计师理解 Grid 后，能更好地与开发协作。

## Grid 基础

### 网格容器

### 网格项目

设计师和开发者使用同一种语言沟通，能极大减少设计到开发的误差。`,
    comments: [],
  },
  {
    slug: 'micro-frontend-from-scratch',
    title: '从零实现一个微前端框架',
    summary: '通过实现一个迷你微前端框架，理解微前端的核心原理包括应用加载、沙箱隔离和通信机制。',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
    categoryId: 1, tags: ['微前端', '架构', '前端'], views: 1780,
    publishedAt: '2024-10-15T10:00:00Z',
    content: `微前端是近年来大型前端项目广泛采用的架构模式。

## 核心原理

### 应用加载
通过动态 Script 加载子应用。

### 沙箱隔离
使用 Proxy 实现全局变量的隔离。

### 通信机制
基于自定义事件的发布订阅模式。

理解原理后，选择框架就变得更加得心应手了。`,
    comments: [
      { author: '架构师老王', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=architect', content: '沙箱隔离的实现思路很清晰！', createdAt: '2024-10-16T08:00:00Z' },
    ],
  },
  {
    slug: 'reading-methodology-50-books',
    title: '我的读书方法论：一年 50 本的技术积累',
    summary: '分享我的技术阅读方法，包括选书策略、阅读技巧和知识管理体系，帮你高效积累技术深度。',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
    categoryId: 3, tags: ['阅读', '学习方法', '自我提升'], views: 3100,
    publishedAt: '2024-10-08T08:00:00Z',
    content: `持续阅读是技术人员保持竞争力的重要方式。

## 我的阅读方法

### 选书策略
经典书籍 + 前沿技术 + 跨界知识，三者按 5:3:2 的比例分配。

### 阅读技巧
先读目录和序言，建立知识框架；重点章节精读，其他章节略读；做读书笔记，用自己的话总结。

### 知识管理
使用 Zettelkasten 卡片笔记法，将知识连接成网络。

读书不在于多，而在于消化和运用。`,
    comments: [
      { author: '书虫', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=bookworm', content: 'Zettelkasten 方法确实好用！', createdAt: '2024-10-09T20:00:00Z' },
      { author: '学习者', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=learner', content: '请问有没有推荐的书单？', createdAt: '2024-10-10T12:00:00Z' },
    ],
  },
  {
    slug: 'web-performance-optimization',
    title: 'Web 性能优化实战手册',
    summary: '涵盖 Core Web Vitals 优化、图片优化、代码分割、缓存策略等全方位的性能优化指南。',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop',
    categoryId: 1, tags: ['性能优化', 'Web', '前端'], views: 2300,
    publishedAt: '2024-09-28T08:00:00Z',
    content: `性能是用户体验的核心组成部分。

## 优化策略

### Core Web Vitals
LCP：优化最大内容绘制；FID：优化首次输入延迟；CLS：优化累积布局偏移。

### 图片优化
使用 WebP/AVIF 格式、响应式图片、懒加载。

### 代码分割
React.lazy() + Suspense 实现按需加载。

性能优化是一个持续的过程，需要不断测量和改进。`,
    comments: [
      { author: '性能控', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=perf', content: 'LCP 优化那块可以再深入一些。', createdAt: '2024-09-29T14:00:00Z' },
    ],
  },
  {
    slug: 'nodejs-backend-best-practices',
    title: 'Node.js 后端开发最佳实践',
    summary: '从项目结构、错误处理、日志系统到安全防护，全面梳理 Node.js 后端开发的工程化实践。',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop',
    categoryId: 1, tags: ['Node.js', '后端', '工程化'], views: 1650,
    publishedAt: '2024-09-20T10:00:00Z',
    content: `写好 Node.js 后端不仅需要掌握语言本身，更需要良好的工程化实践。

## 最佳实践

### 项目结构
采用分层架构：路由 → 控制器 → 服务层 → 数据访问层。

### 错误处理
统一错误处理中间件，规范化错误码和错误信息。

### 日志
使用结构化日志，记录足够的上下文信息。

Node.js 生态已经足够成熟，可以支撑大型生产级应用。`,
    comments: [
      { author: '全栈小王子', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=fullstack', content: '项目结构建议很实用！', createdAt: '2024-09-21T11:00:00Z' },
    ],
  },
  {
    slug: 'digital-nomad-first-year',
    title: '数字游民第一年：经验与反思',
    summary: '分享成为数字游民第一年的真实经历，包括工作方式的变化、时间管理技巧和各地旅居体验。',
    coverImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=450&fit=crop',
    categoryId: 5, tags: ['数字游民', '远程工作', '生活方式'], views: 4200,
    publishedAt: '2024-09-15T08:00:00Z',
    content: `一年前，我背起背包开始了数字游民的生活。

## 这一年的收获

### 工作方式的变化
远程协作需要更强的自律和沟通能力。

### 时间管理
采用时间块（Time Blocking）的方法管理每日行程。

### 旅居体验
在大理、清迈、巴厘岛等地各住了一段时间，每个地方都有独特的 community。

数字游民不是度假，而是一种需要高度自律的生活方式。`,
    comments: [
      { author: '流浪的程序员', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nomad1', content: '同在旅居中，有机会面基！', createdAt: '2024-09-16T22:00:00Z' },
      { author: '居家办公者', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=homeoffice', content: '时间管理那部分启发很大。', createdAt: '2024-09-17T09:00:00Z' },
    ],
  },
  {
    slug: 'react-native-pitfalls',
    title: 'React Native 跨平台开发踩坑记',
    summary: '记录使用 React Native 开发跨平台应用过程中遇到的各种问题及其解决方案，涵盖原生模块、性能优化等。',
    coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop',
    categoryId: 1, tags: ['React Native', '移动端', '跨平台'], views: 1240,
    publishedAt: '2024-09-08T10:00:00Z',
    content: `React Native 让一套代码同时运行在 iOS 和 Android 上成为可能，但实际开发中需要注意很多细节。

## 常见问题

### 原生模块
部分功能需要编写原生代码，理解原生模块的桥接机制很重要。

### 性能优化
FlatList 的合理使用、图片缓存、动画性能等。

### 平台差异
iOS 和 Android 在导航、手势、键盘处理等方面存在差异。

跨平台开发需要在抽象和灵活之间找到平衡。`,
    comments: [],
  },
  {
    slug: 'color-psychology-in-product-design',
    title: '色彩心理学在产品设计中的应用',
    summary: '深入探讨色彩如何影响用户的认知和决策，以及如何在产品设计中合理运用色彩心理学。',
    coverImage: 'https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=800&h=450&fit=crop',
    categoryId: 2, tags: ['色彩', '心理学', '产品设计'], views: 1100,
    publishedAt: '2024-09-01T09:00:00Z',
    content: `色彩不仅仅是视觉装饰，它直接影响用户的情绪和行为。

## 色彩的心理效应

### 蓝色
传递信任、专业、安全感。常用于金融、科技类产品。

### 绿色
代表自然、健康、成长。适合环保、健康类应用。

### 红色
唤起紧迫感、热情、警告。适合促销、提醒场景。

好的配色方案能让产品更有说服力。`,
    comments: [
      { author: '产品经理小刘', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=pm', content: '这篇文章对我们产品的改版很有启发！', createdAt: '2024-09-02T15:00:00Z' },
    ],
  },
  {
    slug: 'cli-productivity-tips',
    title: '在命令行中提升效率的 10 个小技巧',
    summary: '分享 10 个能显著提升命令行操作效率的技巧，包括别名配置、管道运用、模糊搜索等。',
    coverImage: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&h=450&fit=crop',
    categoryId: 3, tags: ['命令行', '效率', '工具'], views: 2800,
    publishedAt: '2024-08-25T08:00:00Z',
    content: `命令行是开发者最强大的工具之一。掌握一些技巧能让你的效率倍增。

## 必备技巧

### 1. 别名配置

### 2. 模糊搜索
使用 fzf 进行文件和命令的模糊搜索。

### 3. 历史记录

善用命令行，让你的开发效率提升一个台阶。`,
    comments: [
      { author: '终端达人', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=terminal', content: 'fzf 真的用了就回不去！', createdAt: '2024-08-26T10:00:00Z' },
    ],
  },
  {
    slug: 'figma-to-code-delivery',
    title: '从 Figma 到代码：设计交付的最佳流程',
    summary: '建立高效的设计交付流程，包括组件命名规范、设计令牌同步、自动切图以及设计评审机制。',
    coverImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=450&fit=crop',
    categoryId: 2, tags: ['Figma', '设计交付', '协作'], views: 890,
    publishedAt: '2024-08-18T09:00:00Z',
    content: `设计与开发之间的协作效率直接影响产品质量和交付速度。

## 建立高效流程

### 设计规范
Figma 中使用样式和组件库，与开发侧保持命名一致。

### 自动交付
使用 Figma API 自动导出设计令牌和切图。

### 设计评审
开发实现后与设计稿进行逐像素比对。

设计与开发的紧密协作是高质量产品的保障。`,
    comments: [],
  },
  {
    slug: 'writing-skill-for-developers',
    title: '写作是技术人员被低估的超级能力',
    summary: '为什么说写作能力对技术人员的职业发展至关重要？分享我的写作心路历程和实用技巧。',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop',
    categoryId: 5, tags: ['写作', '个人成长', '职业发展'], views: 3500,
    publishedAt: '2024-08-10T08:00:00Z',
    content: `在技术领域深耕多年后，我发现写作能力是技术人员最被低估的软技能。

## 写作的价值

### 1. 加深理解
教是最好的学。写作迫使你把知识系统化。

### 2. 建立影响力
持续输出优质内容能帮你建立个人品牌。

### 3. 提升思维
写作锻炼逻辑思维和表达能力。

从今天开始，试着把你学到的知识写下来。`,
    comments: [
      { author: '技术博主', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=blogger2', content: '深有同感！写作真的改变了我。', createdAt: '2024-08-11T09:00:00Z' },
      { author: '默默学习的后端', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=backenddev', content: '感谢鼓励，决定开始写技术博客了。', createdAt: '2024-08-12T22:00:00Z' },
    ],
  },
];

export default async function seed() {
  const { runSql } = await import('./db.js');

  await runSql('DELETE FROM post_favorites');
  await runSql('DELETE FROM post_likes');
  await runSql('DELETE FROM post_tags');
  await runSql('DELETE FROM comments');
  await runSql('DELETE FROM posts');
  await runSql('DELETE FROM categories');
  await runSql('DELETE FROM users');

  const hashedPassword = await bcrypt.hash('password123', 10);
  await runSql(
    'INSERT INTO users (id, name, email, password, avatar, bio, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [1, '墨客', 'admin@moke.com', hashedPassword,
      'https://api.dicebear.com/9.x/avataaars/svg?seed=blogger&backgroundColor=2563eb',
      '前端开发者 & 技术写作者。热爱探索新技术，分享编程心得与生活感悟。',
      'admin'
    ]
  );

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    await runSql(
      'INSERT INTO categories (id, name, slug, description, color, icon) VALUES ($1, $2, $3, $4, $5, $6)',
      [i + 1, cat.name, cat.slug, cat.description, cat.color, cat.icon]
    );
  }

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    const postId = i + 1;
    await runSql(
      'INSERT INTO posts (id, slug, title, summary, content, "coverImage", "categoryId", "authorId", status, views, "publishedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [postId, post.slug, post.title, post.summary, post.content,
        post.coverImage, post.categoryId, 1, 'published', post.views, post.publishedAt
      ]
    );

    for (const tag of post.tags) {
      await runSql('INSERT INTO post_tags ("postId", tag) VALUES ($1, $2)', [postId, tag]);
    }

    for (const comment of post.comments || []) {
      await runSql('INSERT INTO comments ("postId", author, avatar, content, "createdAt") VALUES ($1, $2, $3, $4, $5)', [postId, comment.author, comment.avatar, comment.content, comment.createdAt]);
    }
  }

  await runSql("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
  await runSql("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))");
  await runSql("SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts))");
  await runSql("SELECT setval('post_tags_id_seq', (SELECT MAX(id) FROM post_tags))");
  await runSql("SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments))");
  await runSql("SELECT setval('post_likes_id_seq', (SELECT MAX(id) FROM post_likes))");
  await runSql("SELECT setval('post_favorites_id_seq', (SELECT MAX(id) FROM post_favorites))");

  console.log('✓ Database seeded successfully');
  console.log(`  - 1 user (admin@moke.com)`);
  console.log(`  - ${CATEGORIES.length} categories`);
  console.log(`  - ${POSTS.length} posts`);
  const totalComments = POSTS.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
  console.log(`  - ${totalComments} comments`);
}

(async () => {
  const isMain = process.argv[1]?.replace(/\\/g, '/').includes('seed');
  if (isMain) {
    const { initDb, closeDb } = await import('./db.js');
    await initDb();
    await seed();
    closeDb();
  }
})();
