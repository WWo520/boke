---
kind: external_dependency
name: JWT 认证令牌
slug: jwt-jsonwebtoken
category: external_dependency
category_hints:
    - auth_protocol
scope:
    - '**'
---

### JWT 认证令牌
- **角色**：无状态用户认证机制，用于保护需要登录的 API 接口
- **实现方式**：使用 `jsonwebtoken` 库签发和验证 Bearer Token
- **安全配置**：默认密钥 `'moke-blog-secret-key-2024'`，生产环境应通过 `JWT_SECRET` 环境变量配置
- **Token 有效期**：7 天，存储在客户端 localStorage
- **中间件**：`authMiddleware` 拦截需要认证的请求，`adminMiddleware` 检查管理员权限