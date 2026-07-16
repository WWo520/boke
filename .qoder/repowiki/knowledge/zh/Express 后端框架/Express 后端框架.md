---
kind: external_dependency
name: Express 后端框架
slug: express
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

### Express 后端框架
- **角色**：RESTful API 服务器，提供前后端分离的接口服务
- **中间件栈**：cors（跨域）、express.json（请求体解析，限制 5MB）、multer（文件上传）
- **路由组织**：按功能模块划分路由文件（auth、posts、users、search、ranking、columns、questions、answers）
- **安全配置**：CORS 完全开放（开发环境），JWT 密钥硬编码为默认值
- **文件上传**：使用 multer.diskStorage 本地存储到 `server/uploads/` 目录