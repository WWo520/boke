#!/bin/bash
set -e
echo "===复制图片到 server 容器==="
for f in /tmp/uploads-to-sync/*; do
  [ -f "$f" ] || continue
  docker cp "$f" moke-server:/app/uploads/
  echo "  copied $(basename "$f")"
done
echo "图片数量: $(docker exec moke-server ls /app/uploads/ | wc -l)"

echo
echo "===导入 SQL（用户数据迁移）==="
docker exec -i -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL \
  moke-postgres psql -U moke -d moke_blog -v ON_ERROR_STOP=1 \
  < /opt/moke-blog/deploy/user-data-migration.sql 2>&1 | tail -30

echo
echo "===服务器 DB 数据统计==="
docker exec -e PGPASSWORD=moke_pg_a7K3mR9xQeY2wNpL \
  moke-postgres psql -U moke -d moke_blog -t -c "
SELECT 'users' t, COUNT(*) FROM users
UNION ALL SELECT 'posts', COUNT(*) FROM posts
UNION ALL SELECT 'comments', COUNT(*) FROM comments
UNION ALL SELECT 'post_likes', COUNT(*) FROM post_likes
UNION ALL SELECT 'post_favorites', COUNT(*) FROM post_favorites
UNION ALL SELECT 'user_follows', COUNT(*) FROM user_follows
UNION ALL SELECT 'categories', COUNT(*) FROM categories
"

echo "===完成==="
