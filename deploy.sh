#!/bin/bash

set -e

cleanup() {
  echo ""
  echo "脚本被中断！请检查服务状态: docker compose -f docker-compose.deploy.yml --env-file .env.production.local ps"
  echo "如需恢复服务: docker compose -f docker-compose.deploy.yml --env-file .env.production.local up -d"
  exit 130
}

trap cleanup INT TERM

echo "=== GGA数据管理平台 - 部署脚本 ==="

if [ ! -f docker-compose.deploy.yml ]; then
  echo "错误: docker-compose.deploy.yml 文件不存在"
  exit 1
fi

if [ ! -f .env.production.local ]; then
  echo "错误: .env.production.local 文件不存在"
  echo "请复制 .env.production 到 .env.production.local 并修改其中的配置"
  exit 1
fi

echo "[1/4] 拉取最新代码..."
git pull origin master

echo "[2/4] 拉取预构建镜像..."
docker compose -f docker-compose.deploy.yml --env-file .env.production.local pull

echo "[3/4] 停止旧服务并启动新服务..."
docker compose -f docker-compose.deploy.yml --env-file .env.production.local down
docker compose -f docker-compose.deploy.yml --env-file .env.production.local up -d

echo "[4/4] 执行数据库迁移..."
docker compose -f docker-compose.deploy.yml --env-file .env.production.local run --rm server npx prisma migrate deploy
docker compose -f docker-compose.deploy.yml --env-file .env.production.local restart server

echo ""
echo "=== 部署完成 ==="
echo "服务状态:"
docker compose -f docker-compose.deploy.yml ps
echo ""
echo "日志查看: docker compose -f docker-compose.deploy.yml logs -f"
echo "停止服务: docker compose -f docker-compose.deploy.yml down"
