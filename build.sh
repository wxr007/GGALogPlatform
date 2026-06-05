#!/bin/bash

set -e

DOCKER_REGISTRY="${DOCKER_REGISTRY:-wxr007zc}"

echo "=== 本地构建并推送镜像 ==="
echo "Registry: ${DOCKER_REGISTRY}"
echo ""

echo "[1/3] 构建 Server 镜像..."
docker build -t ${DOCKER_REGISTRY}/gga-platform-server:latest -f server/Dockerfile .

echo "[2/3] 构建 Web 镜像..."
docker build -t ${DOCKER_REGISTRY}/gga-platform-web:latest -f web/Dockerfile .

echo "[3/3] 推送镜像到 Docker Hub..."
docker push ${DOCKER_REGISTRY}/gga-platform-server:latest
docker push ${DOCKER_REGISTRY}/gga-platform-web:latest

echo ""
echo "=== 构建完成 ==="
echo "服务器端执行 deploy.sh 即可拉取最新镜像并部署"
