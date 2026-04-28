#!/bin/bash

set -e

echo "=== GGA数据管理平台 - 部署脚本 ==="

if [ ! -f .env.production.local ]; then
  echo "错误: .env.production.local 文件不存在"
  echo "请复制 .env.production 到 .env.production.local 并修改其中的配置"
  exit 1
fi

echo "[1/4] 拉取最新代码..."
git pull origin master

echo "[2/4] 构建Docker镜像..."
docker compose --env-file .env.production.local build --no-cache

echo "[3/4] 启动所有服务..."
docker compose --env-file .env.production.local up -d

echo "[4/4] 执行数据库迁移..."
docker compose run --rm server npx prisma migrate deploy
docker compose restart server

echo ""
echo "=== 部署完成 ==="
echo "服务状态:"
docker compose ps
echo ""
echo "日志查看: docker compose logs -f"
echo "停止服务: docker compose down"
