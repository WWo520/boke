#!/bin/bash
set -euo pipefail

cd /opt

# 清理旧的目录，解压包
rm -rf /opt/moke-blog /opt/moke-blog-temp
tar -xzf /opt/moke-blog-deploy.tar.gz
rm -f /opt/moke-blog-deploy.tar.gz
mv /opt/blog_demo /opt/moke-blog
cd /opt/moke-blog

echo "===解压完成，目录结构==="
ls -la | head -20

echo "===部署文件==="
ls deploy/ docker-compose.deploy.yml

echo "===生成强 JWT_SECRET（openssl rand -hex 32）==="
NEW_SECRET=$(openssl rand -hex 32)
# 用 perl 替换（sed 对 $ 转义麻烦）
perl -pi -e "s{^JWT_SECRET=.*}{JWT_SECRET=$NEW_SECRET}" deploy/.env.production
echo "JWT_SECRET 已替换（前 40 字符）:"
grep JWT_SECRET deploy/.env.production | cut -c1-40

echo "===开始 docker compose 构建与启动（后台，日志写 /tmp/build.log）==="
# 先 kill 已有同名容器（若有）
docker compose -f docker-compose.deploy.yml down --remove-orphans 2>/dev/null || true

# 后台执行构建
nohup bash -c 'cd /opt/moke-blog && docker compose -f docker-compose.deploy.yml up -d --build > /tmp/build.log 2>&1 && echo BUILD_DONE > /tmp/build.status || echo BUILD_FAILED > /tmp/build.status' > /dev/null 2>&1 &
echo "build 已在后台启动，pid=$!"
echo "日志：tail -f /tmp/build.log"
echo "状态：cat /tmp/build.status"
