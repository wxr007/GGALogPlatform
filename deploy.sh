#!/bin/bash

set -e

COMPOSE_FILE="docker-compose.deploy.yml"

cleanup() {
  echo ""
  echo "脚本被中断！请检查服务状态: docker compose -f $COMPOSE_FILE ps"
  echo "如需恢复服务: docker compose -f $COMPOSE_FILE up -d"
  exit 130
}

trap cleanup INT TERM

echo "=== GGA数据管理平台 - 部署脚本 ==="
echo ""

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "错误: $COMPOSE_FILE 文件不存在"
  exit 1
fi

if [ ! -f .env ]; then
  echo "错误: .env 文件不存在"
  echo "请复制 .env.production 为 .env 并修改其中的配置"
  exit 1
fi

if [ -n "$GHCR_TOKEN" ]; then
  echo "登录 GitHub Container Registry..."
  echo "$GHCR_TOKEN" | docker login ghcr.io -u wxr007 --password-stdin
fi

echo "[1/3] 拉取预构建镜像..."
docker compose -f $COMPOSE_FILE pull

echo "[2/3] 停止旧服务并启动新服务..."
docker compose -f $COMPOSE_FILE down
docker compose -f $COMPOSE_FILE up -d

echo "[3/3] 执行数据库迁移..."
docker compose -f $COMPOSE_FILE run --rm server npx prisma migrate deploy
docker compose -f $COMPOSE_FILE restart server

echo ""
echo "=== 部署完成 ==="
echo "服务状态:"
docker compose -f $COMPOSE_FILE ps
echo ""
echo "日志查看: docker compose -f $COMPOSE_FILE logs -f"
echo "停止服务: docker compose -f $COMPOSE_FILE down"
