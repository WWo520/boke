---
kind: external_dependency
name: Multer 文件上传
slug: multer
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

### Multer 文件上传
- **角色**：处理 multipart/form-data 格式的文件上传请求
- **存储策略**：本地文件系统存储到 `server/uploads/` 目录
- **文件限制**：最大 10MB，支持 jpg/jpeg/png/gif/webp/svg/bmp 格式
- **文件名生成**：时间戳 + 随机字符串 + 扩展名，避免冲突
- **访问方式**：通过 `/uploads` 静态路由直接访问上传文件