---
kind: external_dependency
name: Next.js 前端框架
slug: nextjs
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

### Next.js 前端框架
- **角色**：项目已迁移到 Next.js 15，但 README 和文档仍描述为 Vite + React Router 架构
- **构建配置**：`next.config.mjs` 中设置 `ignoreBuildErrors: true` 忽略 TypeScript 错误
- **路由系统**：使用文件系统路由（`src/app/` 目录结构），与旧版 React Router 并存但未使用
- **遗留问题**：项目中同时存在旧的 Vite 配置文件和新的 Next.js 配置，造成混淆
- **样式方案**：同时引入 Tailwind CSS 和 CSS Modules，风格不统一