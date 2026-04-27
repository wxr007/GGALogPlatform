# GGA数据管理服务平台

设备测试GGA数据管理服务平台，支持用户注册登录、数据上传、数据浏览和下载。

## 技术栈

- **后端**: Node.js 24 + Fastify 5 + TypeScript + PostgreSQL
- **前端**: React 18 + Vite 6 + TypeScript + Ant Design 5
- **ORM**: Prisma 6

## 快速开始

### 环境要求

- Node.js >= 24
- PostgreSQL >= 16
- npm >= 11

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息。

### 初始化数据库

```bash
cd server
npm run db:generate
npm run db:push
```

### 启动服务

确保PostgreSQL已运行，然后:
```bash
npm run dev
```

- 后端服务: http://localhost:3000
- 前端服务: http://localhost:5173
- API文档: http://localhost:3000/api-docs

### Docker部署

```bash
docker-compose up -d
```

## 生产环境部署（1Panel + Docker）

### 第一步：服务器准备

确保服务器已安装 Docker 和 Docker Compose（1Panel 通常自带）。

```bash
docker --version
docker compose version
```

### 第二步：克隆项目

```bash
cd /opt
git clone https://github.com/wxr007/GGALogPlatform.git
cd GGALogPlatform
```

### 第三步：配置环境变量

```bash
cp .env.production .env.production.local
vim .env.production.local
```

修改以下配置：

| 变量 | 说明 | 示例 |
|------|------|------|
| `POSTGRES_PASSWORD` | 数据库密码 | `your-strong-password` |
| `JWT_SECRET` | JWT密钥 | `your-random-secret-key` |
| `WEB_PORT` | Web服务端口 | `8080` |
| `ALLOWED_ORIGINS` | 允许访问的域名 | `http://your-domain.com:8080` |

### 第四步：首次部署

```bash
# 1. 拉取代码
git pull origin master

# 2. 构建镜像
docker compose --env-file .env.production build --no-cache

# 3. 启动数据库
docker compose up -d postgres
sleep 3

# 4. 执行数据库迁移
docker compose run --rm server npx prisma migrate deploy

# 5. 启动所有服务
docker compose --env-file .env.production up -d
```

### 第五步：配置反向代理（可选）

如需通过域名访问，在1Panel中：

1. 打开 **网站** → **创建网站** → **反向代理**
2. 填写域名，代理地址填 `http://127.0.0.1:8080`
3. 如需HTTPS，在网站设置中申请SSL证书

### 日常更新

每次代码更新后，只需执行：

```bash
cd /opt/GGALogPlatform
bash deploy.sh
```

或手动执行：

```bash
cd /opt/GGALogPlatform
git pull origin master
docker compose --env-file .env.production up -d --build
```

### 常用运维命令

```bash
# 查看服务状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 查看后端日志
docker compose logs -f server

# 重启服务
docker compose restart server

# 停止服务
docker compose down
```

### 架构说明

```
客户端 → 1Panel反向代理(80/443) → web容器(Nginx:80)
                                      ↓ /api/
                                 server容器(Node:3000)
                                      ↓
                                 postgres容器(5432)
```

> 数据库和上传文件使用 Docker Volume 持久化，重启/更新不会丢失数据。

## 项目结构

```
├── server/              # 后端服务
│   ├── src/
│   │   ├── config/      # 配置
│   │   ├── controllers/ # 控制器
│   │   ├── middleware/  # 中间件
│   │   ├── routes/      # 路由
│   │   ├── app.ts       # 应用入口
│   │   └── server.ts    # 服务器启动
│   ├── prisma/          # 数据库模型和迁移
│   ├── uploads/         # 文件存储
│   ├── Dockerfile       # 后端Docker镜像
│   └── .dockerignore    # Docker构建忽略文件
├── web/                 # Web前端
│   ├── src/
│   │   ├── components/  # 组件
│   │   ├── pages/       # 页面
│   │   ├── services/    # API服务
│   │   ├── store/       # 状态管理
│   │   └── App.tsx
│   ├── nginx.conf       # Nginx配置
│   ├── Dockerfile       # 前端Docker镜像
│   └── .dockerignore    # Docker构建忽略文件
├── docker-compose.yml   # Docker编排配置
├── .env.production      # 生产环境变量模板
├── deploy.sh            # 一键部署脚本
├── API.md               # 移动端API文档
└── architecture.md      # 架构文档
```

## API接口

### 认证模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/profile | 获取用户信息 |

### 数据模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/data/upload | 上传GGA数据（.log格式） |
| GET | /api/data/datasets | 获取数据集列表 |
| GET | /api/data/datasets/:id | 获取数据详情 |
| GET | /api/data/datasets/:id/download | 下载数据文件 |
| DELETE | /api/data/datasets/:id | 删除数据集 |
| POST | /api/data/check-files | 检查文件上传状态 |
| GET | /api/data/stats | 获取数据统计 |

## 移动端对接

移动端APP使用以下API接口:

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录（返回双Token）
- `POST /api/auth/refresh` - 刷新Token
- `POST /api/data/upload` - 上传GGA数据（.log格式）
- `POST /api/data/check-files` - 检查文件上传状态

上传数据时需要携带Access Token:
```
Authorization: Bearer <access_token>
```

详细接口文档见 [API.md](API.md)

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run dev:server   # 仅启动后端
npm run dev:web      # 仅启动前端
npm run build        # 构建生产版本
```
