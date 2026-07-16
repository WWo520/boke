---
kind: dependency_management
name: 基于 npm 的单体仓库依赖管理
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - server/package.json
    - package-lock.json
    - server/package-lock.json
---

## 系统概览
本项目采用 **npm + package-lock.json** 作为统一的依赖管理系统，以“单仓多包”（monorepo）形式组织：根目录 `package.json` 管理 Next.js 前端应用，`server/package.json` 管理 Express 后端服务。两个包各自维护独立的 `node_modules`、`package-lock.json`，不存在跨包共享依赖或 workspace 配置。

## 关键文件与位置
- 根包声明：`package.json`（Next.js 前端、Tailwind、Markdown 渲染等）
- 服务端包声明：`server/package.json`（Express、pg、bcryptjs、jsonwebtoken 等）
- 锁文件：`package-lock.json`、`server/package-lock.json`（lockfileVersion=3，记录精确版本与 sha512 integrity）
- 构建/运行脚本：根包 `dev/build/start/preview`，服务端包 `start/dev/seed`
- Playwright 浏览器缓存：`ms-playwright/`（由 `@playwright/test` 自动安装，非代码依赖）

## 架构与约定
- **双包隔离**：前后端各自拥有独立 `dependencies` / `devDependencies`，避免运行时污染；但服务端仍显式引入 `next`、`react`、`react-dom`，属于冗余依赖。
- **版本策略**：全部使用 `^` 语义化范围，未锁定到次/补丁版本，升级时可能产生变动树。
- **镜像源**：锁文件中所有 `resolved` 指向 `https://registry.npmmirror.com`，说明本地 npm 配置了国内镜像源（`.npmrc` 未入库）。
- **无私有仓库/GOPRIVATE**：未发现任何私有 registry、token 或 Go 模块代理配置。
- **无 vendoring**：不使用 `vendor/`、`pnpm-lock.yaml`、`yarn.lock` 或 `bun.lockb`，完全依赖 npm 的 lockfile。
- **Node ESM**：两个包均声明 `"type": "module"`，统一使用 ES Module 导入。

## 开发者应遵循的规则
1. 新增依赖只修改对应包的 `package.json`，不要手动编辑 `package-lock.json`。
2. 保持 `^` 范围风格一致，如需严格锁定请改用 `~` 或直接写死版本号并同步更新 lockfile。
3. 若需共享依赖，应引入 `workspaces` 或将公共库抽为独立包，当前仓库未启用该能力。
4. 在 CI/CD 中务必执行 `npm ci` 而非 `npm install`，以保证与锁文件一致。
5. 服务端包中的 `next`、`react`、`react-dom` 属于重复依赖，建议从 `server/package.json` 移除以避免混淆。