---
kind: frontend_style
name: CSS 变量 + Tailwind v4 + CSS Modules 混合样式体系
category: frontend_style
scope:
    - '**'
source_files:
    - src/styles/variables.css
    - src/styles/animations.css
    - src/app/globals.css
    - src/styles/global.css
    - postcss.config.mjs
    - src/components/BlogCard/BlogCard.jsx
    - src/components/BlogCard/BlogCard.module.css
---

## 系统概述

本项目采用「设计令牌（CSS Variables）+ Tailwind CSS v4 + CSS Modules」三层混合的前端样式架构，在 Next.js App Router 下统一构建。

## 1. 核心工具链
- **Tailwind CSS v4**：通过 `@tailwindcss/postcss` 插件集成，入口使用 `@import "tailwindcss"` 指令（v4 新语法），无需传统 `tailwind.config.js`。
- **PostCSS**：仅配置了 Tailwind 插件，未启用 autoprefixer、cssnano 等额外处理器。
- **CSS Modules**：每个组件目录内配套 `.module.css` 文件，组件以 `styles.xxx` 形式引用。
- **CSS 变量（Design Tokens）**：集中定义于 `src/styles/variables.css`，作为全项目唯一的设计令牌来源。

## 2. 设计令牌与主题
`src/styles/variables.css` 定义了完整的语义化 CSS 变量体系：
- **色彩**：`--color-primary / --color-secondary / --color-accent` 及 success/error 等状态色；背景色分 `bg / bg-secondary / bg-tertiary` 层级。
- **排版**：字体族 `--font-sans / --font-mono`、字号 `--text-xs ~ --text-4xl`、字重 `--font-normal ~ --font-bold`、行高 `--leading-*`。
- **间距**：基于 8px 网格的 `--space-1 ~ --space-20`。
- **圆角/阴影/过渡**：统一的 `--radius-*`、`--color-shadow-*`、`--transition-*`。
- **布局常量**：`--max-width: 1200px`、`--navbar-height`、`--sidebar-width`。
- **暗色模式**：通过 `[data-theme="dark"]` 选择器覆盖变量实现主题切换。
- **响应式断点**：在 `@media (max-width: 768px)` 和 `480px` 下调整间距、字号、导航栏高度等变量值。

## 3. 全局样式分层
- **`src/app/globals.css`**：Next.js App Router 根样式入口，导入 Tailwind、variables、animations，并定义基础 reset、body、a/button/img 等原生元素样式、滚动条美化、`:focus-visible` 无障碍焦点环、`.sr-only` 屏幕阅读器类。
- **`src/styles/global.css`**：与 globals.css 内容基本重复，包含 `.container`、`.page-layout`（双栏 grid 布局）、加载器等通用布局类，供旧版页面或独立页面使用。
- **`src/styles/animations.css`**：集中定义 `fadeIn / slideUp / scaleIn / pulse / shimmer / bounceIn / float / spin` 等 keyframes，以及 `.animate-fade-in`、`.animate-slide-up`、`.animate-stagger` 等动画工具类。

## 4. 组件样式约定
- 每个 UI 组件位于 `src/components/<ComponentName>/` 目录下，配套 `<ComponentName>.module.css`。
- 组件内部使用 BEM 风格命名（如 `.card`、`.imageWrapper`、`.metaItem`、`.authorAvatar`），并通过 `className={styles.xxx}` 引用。
- 组件样式完全依赖 CSS 变量，不出现硬编码颜色/尺寸值，确保与设计令牌一致。
- 示例：`BlogCard.module.css` 中卡片悬停上浮、图片缩放、标签胶囊、作者头像等效果均通过变量组合实现。

## 5. 响应式策略
- **移动端优先**：默认变量在小屏下缩小（间距、字号、圆角），通过 `@media (max-width: 768px)` 和 `480px` 两个断点调整。
- **布局响应式**：`.page-layout` 在 `≤1023px` 时从双栏 grid 切换为单栏；`--sidebar-width` 在 `≤768px` 变为 `100%`。
- **组件级媒体查询**：如 `BlogCard.module.css` 在 `≤639px` 下缩减标题字号、隐藏“阅读更多”文字仅保留箭头图标。

## 6. 开发者规范
- 新增视觉属性必须先在 `variables.css` 中声明对应 CSS 变量，再在组件中使用，禁止硬编码。
- 组件样式统一使用 CSS Modules，避免全局类名污染。
- 动画复用 `animations.css` 中已定义的 keyframes 和工具类，新增动画需在此文件追加。
- 主题扩展仅需在 `[data-theme="dark"]` 块中覆盖变量，无需改动组件样式。
- 响应式调整优先通过变量断点覆盖，其次才在组件样式中写媒体查询。

## 关键文件
- `src/styles/variables.css` — 设计令牌（颜色/排版/间距/圆角/阴影/过渡/布局常量/暗色模式/响应式断点）
- `src/styles/animations.css` — 动画 keyframes 与工具类
- `src/app/globals.css` — Next.js 根样式入口（reset + 基础元素 + 滚动条 + 焦点样式）
- `src/styles/global.css` — 通用布局类（container、page-layout、loader）
- `postcss.config.mjs` — PostCSS 配置（仅 Tailwind v4 插件）
- `next.config.mjs` — Next 配置（images remotePatterns、rewrites 转发 /api 与 /uploads）
- `src/components/BlogCard/BlogCard.jsx` + `BlogCard.module.css` — 组件样式最佳实践示例