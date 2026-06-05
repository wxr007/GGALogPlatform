#!/bin/bash

set -e

MODE="${1:-build}"

if [ "$MODE" != "build" ] && [ "$MODE" != "pull" ]; then
  echo "用法: bash deploy.sh [build|pull]"
  echo "  build - 服务器本地构建镜像（默认，适合性能较好的服务器）"
  echo "  pull  - 拉取预构建镜像（适合低配服务器，需先在本机执行 build.sh 推送）"
  exit 1
fi

if [ "$MODE" = "pull" ]; then
  COMPOSE_FILE="docker-compose.deploy.yml"
  BUILD_STEP="拉取预构建镜像"
  BUILD_CMD="docker compose -f $COMPOSE_FILE --env-file .env.production.local pull"
else
  COMPOSE_FILE="docker-compose.yml"
  BUILD_STEP="构建Docker镜像"
  BUILD_CMD="docker compose -f $COMPOSE_FILE --env-file .env.production.local build --no-cache"
fi

cleanup() {
  echo ""
  echo "脚本被中断！请检查服务状态: docker compose -f $COMPOSE_FILE --env-file .env.production.local ps"
  echo "如需恢复服务: docker compose -f $COMPOSE_FILE --env-file .env.production.local up -d"
  exit 130
}

trap cleanup INT TERM

echo "=== GGA数据管理平台 - 部署脚本 ==="
echo "部署模式: $MODE"
echo ""

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "错误: $COMPOSE_FILE 文件不存在"
  exit 1
fi

if [ ! -f .env.production.local ]; then
  echo "错误: .env.production.local 文件不存在"
  echo "请复制 .env.production 到 .env.production.local 并修改其中的配置"
  exit 1
fi

echo "[1/4] 拉取最新代码..."
git pull origin master

echo "[2/4] $BUILD_STEP..."
$BUILD_CMD

echo "[3/4] 停止旧服务并启动新服务..."
docker compose -f $COMPOSE_FILE --env-file .env.production.local down
docker compose -f $COMPOSE_FILE --env-file .env.production.local up -d

echo "[4/4] 执行数据库迁移..."
docker compose -f $COMPOSE_FILE --env-file .env.production.local run --rm server npx prisma migrate deploy
docker compose -f $COMPOSE_FILE --env-file .env.production.local restart server

echo ""
echo "=== 部署完成 ==="
echo "服务状态:"
docker compose -f $COMPOSE_FILE ps
echo ""
echo "日志查看: docker compose -f $COMPOSE_FILE logs -f"
echo "停止服务: docker compose -f $COMPOSE_FILE down"
