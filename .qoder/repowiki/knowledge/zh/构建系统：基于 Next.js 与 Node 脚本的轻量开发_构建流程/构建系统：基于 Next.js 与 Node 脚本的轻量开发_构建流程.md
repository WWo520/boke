---
kind: build_system
name: 构建系统：基于 Next.js 与 Node 脚本的轻量开发/构建流程
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - server/package.json
    - next.config.mjs
    - postcss.config.mjs
    - tsconfig.json
    - jsconfig.json
    - scripts/generate-icons.js
---

本仓库未引入 Makefile、Dockerfile、CI/CD 流水线或专用打包工具，构建体系完全依赖 Node.js 生态的原生脚本与 Next.js 内置命令，属于无显式构建系统的轻量方案。

1. 使用的系统与工具
- 前端：Next.js（App Router），通过 next build 生成静态产物到 .next/，由 next start 提供生产服务器。
- 后端：纯 Node + Express，直接以 node --env-file=... src/index.js 启动，无需额外编译步骤。
- 环境变量：使用 Node 原生 --env-file 参数加载 .env.development / .env.production，不再依赖 dotenv 包。
- 测试：Playwright E2E 测试，结果输出至 test-results/，浏览器二进制缓存在 ms-playwright/。
- 资源生成：根目录 scripts/generate-icons.js 用于图标生成等辅助任务。

2. 关键文件与位置
- 根 package.json：定义 dev/build/start/preview 四个脚本，统一入口。
- server/package.json：后端独立 npm 包，提供 start/dev/seed 脚本。
- next.config.mjs：配置 rewrites 将 /api/* 和 /uploads/* 转发至本地 3333 端口的 Express 服务；同时允许从 localhost:3333 拉取图片。
- postcss.config.mjs：Tailwind CSS 4 构建配置。
- tsconfig.json / jsconfig.json：TypeScript 与 JS 项目配置。
- e2e/：Playwright 测试用例目录。

3. 架构与约定
- 前后端同仓管理，但各自维护独立的 package.json 与依赖树；前端负责页面渲染与 API 代理，后端仅暴露 REST 接口与静态上传资源。
- 开发时通常并行启动两个进程：npm run dev（Next 3000）+ cd server && npm run dev（Express 3333），通过 Next rewrites 透明转发。
- 生产环境建议分别部署 Next 应用与 Express 服务，或使用 PM2/Nginx 反向代理组合运行。
- 数据库迁移与种子数据通过 server/src/migrate*.js、seed.js 等脚本手动执行，未见自动化 CI 集成。

4. 开发者应遵循的规则
- 新增依赖后务必在对应 package.json 中声明，并重新安装依赖。
- 修改环境变量请同步更新 .env.development 与 .env.production，并确保 next.config.mjs 中的 rewrites 目标端口保持一致。
- 若引入新的静态资源域名，需在 next.config.mjs 的 images.remotePatterns 中白名单注册。
- 当前未配置 TypeScript 严格模式与 ESLint/Prettier 规则，建议在提交前自行校验代码质量。
- 暂无 Dockerfile 与 CI 配置，如需容器化或自动化发布，需自行补充相应脚本与流水线文件。