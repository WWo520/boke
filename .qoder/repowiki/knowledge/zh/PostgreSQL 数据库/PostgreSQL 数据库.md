---
kind: external_dependency
name: PostgreSQL 数据库
slug: postgresql
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

### PostgreSQL 数据库
- **角色**：项目主数据库，存储用户、文章、评论、分类、问答等所有业务数据
- **集成方式**：通过 `pg` 驱动（v8.22）连接，使用连接池管理数据库连接
- **配置位置**：环境变量 `POSTGRES_HOST/PORT/DATABASE/USER/PASSWORD`，默认连接 `localhost:5432/moke_blog`
- **初始化模式**：服务启动时执行 `CREATE TABLE IF NOT EXISTS` + 多个 `ALTER TABLE ADD COLUMN IF NOT EXISTS` 进行 schema 迁移（反模式，建议使用专业迁移工具）
- **索引策略**：为高频查询字段创建单列索引，但缺少复合索引优化
- **注意**：README 中提到的 `sql.js`（SQLite 兼容层）实际未在项目中使用，当前仅使用原生 PostgreSQL