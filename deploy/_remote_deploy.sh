#!/bin/bash
set -e

echo "=== 创建 swap 空间 ==="
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
  echo "Swap 已创建并启用 (2GB)"
else
  swapon /swapfile 2>/dev/null || true
  echo "Swap 已存在"
fi
free -m

echo "=== 重新构建 ==="
cd /opt/moke-blog
docker compose -f docker-compose.deploy.yml down --remove-orphans 2>/dev/null || true

echo "开始后台构建（限制 Node 内存）..."
nohup bash -c 'cd /opt/moke-blog && NODE_OPTIONS="--max-old-space-size=1024" docker compose -f docker-compose.deploy.yml up -d --build > /tmp/build.log 2>&1 && echo BUILD_DONE > /tmp/build.status || echo BUILD_FAILED > /tmp/build.status' > /dev/null 2>&1 &
echo "Build pid=$!"
echo "Check: tail -f /tmp/build.log && cat /tmp/build.status"
