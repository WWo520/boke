"""从本地导出 + 适配服务器表结构的迁移 SQL。

策略：
1. psycopg2 直连本地 DB 取数据
2. psycopg2 直连服务器 DB（通过公网 IP:5432 不行，因为没开放；用 SSH 端口转发）
   简化：在脚本里硬编码服务器 users/posts 列（已查过），INSERT 只包含这些列
3. 用 ON CONFLICT (id) DO NOTHING 避免覆盖 seed 数据
"""
import psycopg2
from psycopg2 import sql
import os

LOCAL = dict(host="127.0.0.1", port=5432, dbname="moke_blog",
             user="postgres", password="postgres")

# 服务器各表允许写入的列（查过 \d users / \d posts 等）
SERVER_COLS = {
    "users": [
        "id", "name", "email", "password", "avatar", "bio", "role",
        "followersCount", "followingCount", "level", "points",
        "title", "company", "location", "website", "createdAt",
    ],
    "posts": [
        "id", "slug", "title", "summary", "content", "coverImage",
        "categoryId", "authorId", "columnId", "status", "reviewStatus",
        "reviewedBy", "reviewedAt", "reviewComment", "views",
        "hotscore", "lastCommentAt", "likeCount", "favoriteCount",
        "publishedAt", "updatedAt", "hotScore",
    ],
    "post_tags": ["id", "postId", "tag"],
    "comments": ["id", "postId", "parentId", "authorId", "author", "avatar", "content", "likes", "createdAt"],
    "post_likes": ["id", "postId", "userId", "createdAt"],
    "post_favorites": ["id", "postId", "userId", "folderId", "createdAt"],
    "user_follows": ["id", "userId", "followId", "createdAt"],
    "user_points": ["id", "userId", "type", "points", "description", "createdAt"],
}

# WHERE 过滤（只迁核心数据，放弃 likes/favorites/points —— 这些外键会引用未迁移的表）
TABLES = [
    ("users",        "id IN (1, 2, 3)"),
    ("posts",        '"authorId" IN (1, 2, 3) AND id >= 21'),
    ("post_tags",    '"postId" IN (SELECT id FROM posts WHERE "authorId" IN (1, 2, 3) AND id >= 21)'),
    ("comments",     '"authorId" IN (1, 2, 3)'),
    ("user_follows", '"userId" IN (1, 2, 3) AND "followId" IN (1, 2, 3)'),
]


def dump_table(cur, table, where):
    allowed = SERVER_COLS.get(table)
    if not allowed:
        return f"-- {table}: (not in SERVER_COLS)\n"

    # 取表的所有列名（用于确定顺序/过滤）
    cur.execute(sql.SQL("SELECT * FROM {} LIMIT 0").format(sql.Identifier(table)))
    all_cols = [d[0] for d in cur.description]
    # 只保留服务器允许的列（按 allowed 顺序）
    cols = [c for c in allowed if c in all_cols]
    if not cols:
        return f"-- {table}: (no common cols)\n"

    col_list = sql.SQL(", ").join(sql.Identifier(c) for c in cols).as_string(cur)
    select = sql.SQL(", ").join(sql.Identifier(c) for c in cols)
    placeholders = ", ".join(["%s"] * len(cols))

    cur.execute(
        sql.SQL("SELECT {} FROM {} WHERE {} ORDER BY id")
        .format(select, sql.Identifier(table), sql.SQL(where))
    )
    rows = cur.fetchall()

    if not rows:
        return f"-- {table}: (empty, 0 rows)\n"

    lines = []
    for row in rows:
        stmt = cur.mogrify(
            f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING;",
            row,
        ).decode("utf-8")
        lines.append(stmt)
    return "\n".join(lines)


OUT = r"d:\develop\qoder_project\blog_demo\deploy\user-data-migration.sql"

print(f"连接本地 PostgreSQL: {LOCAL['host']}:{LOCAL['port']}/{LOCAL['dbname']}")
conn = psycopg2.connect(**LOCAL)
conn.set_client_encoding('UTF8')
cur = conn.cursor()

with open(OUT, "w", encoding="utf-8") as f:
    f.write("-- Moke Blog: 精确迁移 moke/qw/www 用户及其关联数据\n")
    f.write("-- 字段按服务器 schema 过滤（去掉服务器不存在的列）\n")
    f.write("-- 使用 INSERT ... ON CONFLICT (id) DO NOTHING，跳过服务器已有的 seed 数据\n\n")
    f.write("BEGIN;\n\n")
    for table, where in TABLES:
        print(f"导出 {table} ...")
        content = dump_table(cur, table, where)
        f.write(f"-- ========== {table} ==========\n")
        f.write(content)
        f.write("\n\n")
    f.write("COMMIT;\n")

cur.close()
conn.close()

sz_kb = os.path.getsize(OUT) / 1024
print(f"\n===导出完成=== {OUT} ({sz_kb:.1f} KB)")

# 各表统计
with open(OUT, "r", encoding="utf-8") as f:
    text = f.read()
print("\n--- 各表 INSERT 数量 ---")
for table, _ in TABLES:
    n = text.count(f"INSERT INTO {table} ")
    print(f"  {table}: {n} rows")

# 预览前 8 行
print("\n--- 预览前 8 行 ---")
print("\n".join(text.splitlines()[:8]))
