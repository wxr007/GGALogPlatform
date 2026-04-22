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

## 项目结构

```
├── server/              # 后端服务
│   ├── src/
│   │   ├── config/      # 配置
│   │   ├── controllers/ # 控制器
│   │   ├── middleware/  # 中间件
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由
│   │   ├── app.ts       # 应用入口
│   │   └── server.ts    # 服务器启动
│   └── uploads/         # 文件存储
├── web/                 # Web前端
│   ├── src/
│   │   ├── components/  # 组件
│   │   ├── pages/       # 页面
│   │   ├── services/    # API服务
│   │   ├── store/       # 状态管理
│   │   └── App.tsx
│   └── index.html
├── docker-compose.yml
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
| POST | /api/data/upload | 上传GGA数据 |
| GET | /api/data/datasets | 获取数据集列表 |
| GET | /api/data/datasets/:id | 获取数据详情 |
| GET | /api/data/datasets/:id/download | 下载数据文件 |
| GET | /api/data/stats | 获取数据统计 |

## 移动端对接

移动端APP使用以下API接口:

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/data/upload` - 上传GGA数据

上传数据时需要携带JWT Token:
```
Authorization: Bearer <token>
```

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run dev:server   # 仅启动后端
npm run dev:web      # 仅启动前端
npm run build        # 构建生产版本
```
