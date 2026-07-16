---
kind: logging_system
name: 日志系统 — 基于原生 console 的零配置输出
category: logging_system
scope:
    - '**'
source_files:
    - server/src/index.js
    - scripts/generate-icons.js
    - server/add_column.js
    - server/check_schema.js
    - server/src/check-users.js
---

本仓库未引入任何第三方日志框架（如 winston、pino、bunyan、log4js、morgan 等），也未定义统一的 logger 模块或日志级别策略。前后端均直接使用 Node.js 原生的 `console.log` / `console.error` 进行输出，属于“无日志系统”的状态。

### 现状概览
- **后端（Express）**：所有业务逻辑集中在 `server/src/index.js`，错误处理统一使用 `console.error('xxx error:', err)`；启动信息通过 `console.log` 打印服务地址与 API 列表；数据库初始化、seed 过程也使用 `console.log` 提示进度。
- **脚本工具**：`scripts/generate-icons.js`、`server/add_column.js`、`server/check_schema.js`、`server/src/check-users.js` 等一次性脚本同样直接调用 `console.log` / `console.error`。
- **前端（Next.js）**：未发现任何服务端/客户端日志记录代码，页面与组件中未见 `console.*` 调用。
- **中间件层**：未挂载 morgan、pino-http 等 HTTP 访问日志中间件，请求级日志完全缺失。
- **结构化字段**：无任何统一的日志字段约定（如 `service`、`traceId`、`userId`、`level` 等）。
- **输出目标**：仅输出到进程标准输出，未配置文件 sink、远程收集器或分级转储。

### 关键位置
- 后端入口与全局错误输出：`server/src/index.js`
- 辅助脚本：`scripts/generate-icons.js`、`server/add_column.js`、`server/check_schema.js`、`server/src/check-users.js`

### 对开发者的影响与建议
当前状态意味着：
1. 无法按级别过滤日志，调试时难以区分 INFO/WARN/ERROR。
2. 缺少请求上下文（IP、方法、路径、耗时、用户 ID），排查线上问题困难。
3. 生产环境 stdout 日志未被集中采集，不符合可观测性要求。

建议后续引入统一日志方案（例如 pino + pino-http），在 Express 启动处注册中间件，为每个请求注入 traceId 并输出结构化 JSON 日志，同时提供文件/远端 sink。