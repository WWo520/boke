---
kind: external_dependency
name: bcryptjs 密码哈希
slug: bcryptjs
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

### bcryptjs 密码哈希
- **角色**：用户密码加密存储，防止明文密码泄露
- **配置参数**：使用 10 轮 salt rounds 进行哈希计算
- **使用场景**：用户注册时加密密码，登录时验证密码
- **安全性**：相比 MD5/SHA1 更安全，支持盐值随机化