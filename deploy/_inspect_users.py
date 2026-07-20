"""查询本地 3 个目标用户（moke/qw/www）的关联数据量。"""
import paramiko
import json

HOST = "47.104.191.199"
USER = "root"
KEY = r"C:\Users\yz02\.ssh\id_ed25519"

# 查询脚本：通过 SSH 在服务器本地，docker exec 进本地容器执行 psql
# 注意：本地容器在用户的 Windows 机器上，这里查的是服务器上的 DB，所以先改成查服务器 DB
# 用户本地 DB 在 Windows 上，无法直接访问。需要先在 Windows 本地 docker exec 查。

# 改为：直接用 Windows 本地 docker 命令（在本地 Windows shell 运行）
import subprocess

def docker_psql(sql):
    """在 Windows 本地 docker exec 进 moke-blog-postgres 执行 psql。"""
    cmd = [
        "docker", "exec", "-e", "PGCLIENTENCODING=UTF8",
        "moke-blog-postgres",
        "psql", "-U", "postgres", "-d", "moke_blog",
        "-t", "-A", "-c", sql,
    ]
    r = subprocess.run(cmd, capture_output=True, timeout=15)
    out = r.stdout.decode("utf-8", errors="replace").strip()
    err = r.stderr.decode("utf-8", errors="replace").strip()
    return out, err

print("===目标用户基本信息===")
sql = """SELECT id, name, email, role FROM users WHERE email IN ('admin@moke.com','yz9951@126.com','yz0951@126.com') ORDER BY id"""
out, err = docker_psql(sql)
print(out if out else err)
user_ids = []
for line in out.splitlines():
    if line.strip():
        parts = line.split("|")
        if len(parts) >= 4 and parts[0].isdigit():
            user_ids.append(int(parts[0]))
print(f"目标用户 ID: {user_ids}")

if not user_ids:
    print("未找到目标用户，退出")
    exit(1)

id_list = ",".join(str(i) for i in user_ids)

print("\n===这些用户写的文章===")
sql = f"""SELECT id, title, status, views, "categoryId", "authorId" FROM posts WHERE "authorId" IN ({id_list}) ORDER BY id"""
out, _ = docker_psql(sql)
print(out if out else "(无)")
post_ids = []
for line in out.splitlines():
    if line.strip():
        parts = line.split("|")
        if parts and parts[0].isdigit():
            post_ids.append(int(parts[0]))
print(f"文章 ID: {post_ids}")

print("\n===这些用户发的评论===")
sql = f"""SELECT id, "postId", author, LEFT(content, 60) FROM comments WHERE "authorId" IN ({id_list}) ORDER BY id"""
out, _ = docker_psql(sql)
print(out if out else "(无)")

print("\n===这些文章的点赞===")
if post_ids:
    post_id_list = ",".join(str(i) for i in post_ids)
    sql = f"""SELECT COUNT(*) FROM post_likes WHERE "postId" IN ({post_id_list})"""
    out, _ = docker_psql(sql)
    print(f"点赞总数: {out}")
    sql = f"""SELECT COUNT(*) FROM post_favorites WHERE "postId" IN ({post_id_list})"""
    out, _ = docker_psql(sql)
    print(f"收藏总数: {out}")
    sql = f"""SELECT tag, COUNT(*) FROM post_tags WHERE "postId" IN ({post_id_list}) GROUP BY tag"""
    out, _ = docker_psql(sql)
    print(f"文章标签:\n{out}")

print("\n===这些用户的关注===")
sql = f"""SELECT COUNT(*) FROM user_follows WHERE "userId" IN ({id_list}) OR "followId" IN ({id_list})"""
out, _ = docker_psql(sql)
print(f"关注关系数: {out}")

print("\n===这些用户的专栏===")
sql = f"""SELECT COUNT(*) FROM columns WHERE "authorId" IN ({id_list})"""
out, _ = docker_psql(sql)
print(f"专栏数: {out}")
