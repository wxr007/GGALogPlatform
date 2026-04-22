# GGA数据管理服务平台 - 系统架构文档

## 1. 系统概述

### 1.1 项目简介
GGA数据管理服务平台是一个用于收集、存储和管理设备测试GGA数据的综合性服务平台。平台支持用户通过网页端和移动端进行注册登录，移动端通过API上传GGA数据，服务端按用户和日期组织存储数据，网页端提供数据浏览和下载功能。

### 1.2 核心功能
- 用户注册与登录（Web端 + 移动端）
- GGA数据上传（移动端API）
- 数据存储（按用户和日期分类）
- 数据集浏览（Web端）
- 数据查看与下载（Web端）

---

## 2. 技术栈选型

### 2.1 后端技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Node.js** | 24.x | 运行时环境 | 当前环境 v24.14.0 |
| **Fastify** | 5.x | Web框架 | 高性能HTTP框架，比Express快2-3倍 |
| **TypeScript** | 5.x | 编程语言 | 类型安全，提高代码质量 |
| **PostgreSQL** | 16.x | 数据库 | 存储用户信息、数据元信息 |
| **Prisma** | 6.x | ORM | PostgreSQL对象关系映射工具 |
| **JWT** | - | 认证 | 无状态身份验证 |
| **bcrypt** | - | 密码加密 | 安全的密码哈希算法 |
| **@fastify/multipart** | - | 文件上传 | 处理multipart/form-data |
| **@fastify/jwt** | - | JWT插件 | Fastify的JWT认证插件 |
| **@fastify/cors** | - | CORS | 跨域资源共享 |
| **@fastify/swagger** | - | API文档 | 自动生成OpenAPI文档 |

### 2.2 前端技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **React** | 18.x | UI框架 | 组件化开发 |
| **Vite** | 5.x | 构建工具 | 快速的开发服务器和构建 |
| **TypeScript** | 5.x | 编程语言 | 类型安全 |
| **Ant Design** | 5.x | UI组件库 | 企业级UI组件 |
| **React Router** | 6.x | 路由 | SPA路由管理 |
| **Axios** | - | HTTP客户端 | API请求 |
| **Zustand** | - | 状态管理 | 轻量级状态管理 |
| **TailwindCSS** | - | CSS框架 | 实用优先的CSS |

### 2.3 移动端对接说明

移动端APP已存在，只需对接以下API接口：
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/data/upload` - 上传GGA数据
- `POST /api/data/upload/batch` - 批量上传GGA数据

移动端需要：
- 保存JWT Token用于后续请求认证
- 支持multipart/form-data格式文件上传
- 处理网络异常和重试机制

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          客户端层                                 │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   Web前端 (React) │              │  移动端 (RN/原生) │         │
│  │  - 用户注册/登录  │              │  - 用户注册/登录  │         │
│  │  - 数据浏览       │              │  - 数据采集       │         │
│  │  - 数据下载       │              │  - 数据上传       │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼─────────────────────────────────┼───────────────────┘
            │                                 │
            │         HTTPS / REST API        │
            └────────────────┬────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                        服务端层                                  │
│  ┌────────────────────────┴────────────────────────────────┐   │
│  │              Fastify API Gateway                        │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │              中间件层                              │  │   │
│  │  │  • CORS  • JWT验证  • 日志  • 错误处理  • 限流    │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   │
│  │  │ 认证模块   │  │ 数据模块   │  │ 文件模块   │       │   │
│  │  │ - 注册     │  │ - 上传     │  │ - 存储     │       │   │
│  │  │ - 登录     │  │ - 查询     │  │ - 下载     │       │   │
│  │  │ - Token    │  │ - 下载     │  │ - 管理     │       │   │
│  │  └────────────┘  └────────────┘  └────────────┘       │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                        数据层                                    │
│  ┌─────────────────────┐           ┌─────────────────────┐     │
│  │   MongoDB 数据库    │           │   文件系统存储       │     │
│  │  • 用户信息         │           │  /uploads/          │     │
│  │  • 数据元信息       │           │    /{userId}/       │     │
│  │  • 上传记录         │           │      /{date}/       │     │
│  │  • 会话信息         │           │        *.gga        │     │
│  └─────────────────────┘           └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流图

```
移动端采集GGA数据
       │
       ▼
  [数据格式化]
       │
       ▼
  [API上传请求] ──── POST /api/data/upload (携带JWT Token)
       │
       ▼
  [JWT验证] ──── 验证用户身份
       │
       ▼
  [数据验证] ──── 验证GGA数据格式
       │
       ▼
  [文件存储] ──── 按 userId/date/ 存储到文件系统
       │
       ▼
  [元数据记录] ──── 记录到MongoDB（文件名、大小、时间等）
       │
       ▼
  [返回成功响应]
```

---

## 4. 数据库设计

### 4.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  username    String   @unique
  email       String   @unique
  password    String
  phone       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastLoginAt DateTime?
  isActive    Boolean  @default(true)
  datasets    Dataset[]
  uploadLogs  UploadLog[]

  @@map("users")
}

model Dataset {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  fileName     String
  filePath     String
  fileSize     Int
  date         DateTime
  recordCount  Int      @default(0)
  deviceId     String?
  deviceModel  String?
  deviceFirmware String?
  uploadStatus String   @default("completed")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([date])
  @@index([userId, date])
  @@map("datasets")
}

model UploadLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  datasetId   String?
  status      String
  errorMessage String?
  fileSize    Int
  uploadedAt  DateTime @default(now())
  ipAddress   String?
  userAgent   String?

  @@map("upload_logs")
}
```

---

## 5. API接口设计

### 5.1 认证模块

#### POST /api/auth/register
**请求体：**
```json
{
  "username": "string (3-20字符)",
  "email": "string (邮箱格式)",
  "password": "string (最少6字符)"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "token": "string"
  }
}
```

#### POST /api/auth/login
**请求体：**
```json
{
  "email": "string",
  "password": "string"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "token": "string",
    "expiresIn": 86400
  }
}
```

### 5.2 数据上传模块

#### POST /api/data/upload
**认证：** 需要JWT Token

**请求体：** Multipart/form-data
- `file`: GGA数据文件
- `date`: 数据日期 (YYYY-MM-DD)
- `deviceId`: 设备ID (可选)
- `deviceModel`: 设备型号 (可选)

**响应：**
```json
{
  "success": true,
  "data": {
    "datasetId": "string",
    "fileName": "string",
    "fileSize": 12345,
    "recordCount": 100,
    "uploadTime": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/data/upload/batch
**认证：** 需要JWT Token

**请求体：** Multipart/form-data
- `files`: 多个GGA数据文件数组
- `metadata`: JSON字符串，包含每个文件的元信息

**响应：**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "successful": 9,
    "failed": 1,
    "results": [...]
  }
}
```

### 5.3 数据查询模块

#### GET /api/data/datasets
**认证：** 需要JWT Token

**查询参数：**
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)
- `startDate`: 开始日期
- `endDate`: 结束日期
- `sort`: 排序字段 (date, createdAt)
- `order`: 排序方向 (asc, desc)

**响应：**
```json
{
  "success": true,
  "data": {
    "datasets": [
      {
        "id": "string",
        "fileName": "string",
        "fileSize": 12345,
        "date": "2024-01-15",
        "recordCount": 100,
        "uploadTime": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### GET /api/data/datasets/:id
**认证：** 需要JWT Token

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "fileName": "string",
    "fileSize": 12345,
    "date": "2024-01-15",
    "recordCount": 100,
    "uploadTime": "2024-01-15T10:30:00Z",
    "deviceInfo": {...},
    "preview": "前10条GGA数据..."
  }
}
```

#### GET /api/data/datasets/:id/download
**认证：** 需要JWT Token

**响应：** 文件流下载

### 5.4 数据统计模块

#### GET /api/data/stats
**认证：** 需要JWT Token

**响应：**
```json
{
  "success": true,
  "data": {
    "totalDatasets": 150,
    "totalRecords": 50000,
    "totalSize": "1.2GB",
    "dateRange": {
      "earliest": "2024-01-01",
      "latest": "2024-01-15"
    },
    "recentUploads": [...]
  }
}
```

---

## 6. 文件存储设计

### 6.1 目录结构

```
uploads/
└── {userId}/
    └── {YYYY-MM-DD}/
        ├── {timestamp}_{randomId}.gga
        ├── {timestamp}_{randomId}.gga
        └── ...
```

**示例：**
```
uploads/
└── 64f8a9b2c1d3e4f5a6b7c8d9/
    ├── 2024-01-15/
    │   ├── 1705312200000_abc123.gga
    │   └── 1705315800000_def456.gga
    └── 2024-01-16/
        └── 1705398600000_ghi789.gga
```

### 6.2 文件命名规则

格式：`{timestamp}_{randomId}.gga`

- `timestamp`: 上传时间的Unix时间戳（毫秒）
- `randomId`: 6位随机字符串（防止文件名冲突）

### 6.3 存储策略

**本地存储（开发/小规模）：**
- 直接存储到服务器文件系统
- 定期备份到云存储

**云存储（生产/大规模）：**
- AWS S3 / 阿里云OSS
- 使用CDN加速下载
- 配置生命周期规则（可选）

---

## 7. 安全设计

### 7.1 认证与授权

**JWT Token机制：**
```typescript
{
  "userId": "string",
  "username": "string",
  "iat": number,      // 签发时间
  "exp": number       // 过期时间（24小时）
}
```

**Token管理：**
- 访问令牌有效期：24小时
- 刷新令牌（可选）：7天
- Token存储在客户端安全存储中

### 7.2 密码安全

- 使用bcrypt加密，cost factor: 12
- 密码长度要求：最少6位
- 不传输明文密码

### 7.3 API安全

- **CORS配置：** 限制允许的域名
- **速率限制：** 防止暴力攻击
  - 登录接口：5次/分钟
  - 上传接口：10次/分钟
  - 其他接口：100次/分钟
- **输入验证：** 所有输入使用JSON Schema验证
- **文件验证：** 
  - 限制文件大小（最大50MB）
  - 验证文件类型（.gga）
  - 扫描文件内容

### 7.4 数据安全

- HTTPS强制（生产环境）
- 数据库连接加密
- 文件访问权限控制（用户只能访问自己的数据）
- 敏感信息不记录到日志

---

## 8. 错误处理

### 8.1 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "用户友好的错误信息",
    "details": {}  // 可选，开发环境详细错误
  }
}
```

### 8.2 错误码定义

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| AUTH_INVALID_CREDENTIALS | 401 | 用户名或密码错误 |
| AUTH_TOKEN_EXPIRED | 401 | Token已过期 |
| AUTH_TOKEN_INVALID | 401 | Token无效 |
| USER_ALREADY_EXISTS | 409 | 用户已存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| FILE_TOO_LARGE | 413 | 文件过大 |
| FILE_INVALID_TYPE | 400 | 文件类型无效 |
| DATASET_NOT_FOUND | 404 | 数据集不存在 |
| ACCESS_DENIED | 403 | 无权访问 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 9. 项目结构

```
gga-data-platform/
├── server/                          # 后端服务
│   ├── src/
│   │   ├── config/                  # 配置文件
│   │   │   ├── database.ts          # 数据库配置
│   │   │   ├── app.ts               # 应用配置
│   │   │   └── storage.ts           # 存储配置
│   │   │
│   │   ├── models/                  # 数据模型
│   │   │   ├── User.ts
│   │   │   ├── Dataset.ts
│   │   │   └── UploadLog.ts
│   │   │
│   │   ├── controllers/             # 控制器
│   │   │   ├── auth.controller.ts
│   │   │   ├── data.controller.ts
│   │   │   └── stats.controller.ts
│   │   │
│   │   ├── routes/                  # 路由
│   │   │   ├── auth.routes.ts
│   │   │   ├── data.routes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── middleware/              # 中间件
│   │   │   ├── auth.middleware.ts   # JWT验证
│   │   │   ├── error.middleware.ts  # 错误处理
│   │   │   ├── validation.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   │
│   │   ├── services/                # 业务逻辑
│   │   │   ├── auth.service.ts
│   │   │   ├── data.service.ts
│   │   │   ├── file.service.ts
│   │   │   └── stats.service.ts
│   │   │
│   │   ├── utils/                   # 工具函数
│   │   │   ├── logger.ts
│   │   │   ├── fileHelper.ts
│   │   │   └── response.ts
│   │   │
│   │   ├── types/                   # 类型定义
│   │   │   ├── index.ts
│   │   │   └── api.ts
│   │   │
│   │   ├── app.ts                   # Fastify应用初始化
│   │   └── server.ts                # 服务器启动入口
│   │
│   ├── uploads/                     # 文件存储目录（开发环境）
│   ├── .env.example                 # 环境变量示例
│   ├── tsconfig.json
│   └── package.json
│
├── web/                             # Web前端
│   ├── src/
│   │   ├── components/              # 通用组件
│   │   │   ├── Layout/
│   │   │   ├── Auth/
│   │   │   └── Data/
│   │   │
│   │   ├── pages/                   # 页面
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DatasetList.tsx
│   │   │   └── DatasetDetail.tsx
│   │   │
│   │   ├── services/                # API服务
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   └── data.service.ts
│   │   │
│   │   ├── store/                   # 状态管理
│   │   │   ├── auth.store.ts
│   │   │   └── data.store.ts
│   │   │
│   │   ├── hooks/                   # 自定义Hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useDatasets.ts
│   │   │
│   │   ├── types/                   # 类型定义
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                   # 工具函数
│   │   │   └── helpers.ts
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── mobile/                          # 移动端（可选）
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── app.json
│   └── package.json
│
├── docs/                            # 文档
│   ├── architecture.md              # 本文档
│   └── api.md                       # API文档
│
├── docker-compose.yml               # Docker编排
├── .gitignore
└── README.md
```

---

## 10. 环境变量配置

### 10.1 后端环境变量 (.env)

```env
# 应用配置
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/gga-platform

# JWT配置
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# 文件存储配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# CORS配置
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# 日志配置
LOG_LEVEL=debug

# 速率限制
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 10.2 前端环境变量 (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=GGA数据管理平台
```

---

## 11. 部署方案

### 11.1 开发环境

```bash
# 启动后端
cd server
npm install
npm run dev

# 启动前端
cd web
npm install
npm run dev
```

### 11.2 Docker部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: gga-platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/gga-platform
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      - postgres

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  postgres_data:
  uploads_data:
```

### 11.3 生产环境建议

**服务器配置：**
- CPU: 2核心以上
- 内存: 4GB以上
- 存储: SSD，根据数据量决定
- 操作系统: Ubuntu 22.04 LTS

**部署方式：**
- 使用PM2管理Node.js进程
- Nginx反向代理
- Let's Encrypt SSL证书
- 定期备份数据库和文件

**监控：**
- 应用监控：Prometheus + Grafana
- 日志管理：ELK Stack
- 错误追踪：Sentry

---

## 12. 性能优化

### 12.1 后端优化

- **连接池：** PostgreSQL连接池配置（Prisma内置）
- **缓存：** Redis缓存热点数据（可选）
- **分页查询：** 避免一次性加载大量数据
- **索引优化：** 为常用查询字段创建索引
- **流式处理：** 大文件使用流式上传/下载

### 12.2 前端优化

- **代码分割：** 路由级别的代码分割
- **懒加载：** 组件懒加载
- **缓存策略：** API响应缓存
- **CDN：** 静态资源CDN加速

### 12.3 文件存储优化

- **压缩：** GGA文件可选压缩存储
- **分片：** 大文件分片上传
- **CDN：** 文件下载CDN加速

---

## 13. 扩展性设计

### 13.1 水平扩展

- **无状态设计：** API服务无状态，可水平扩展
- **负载均衡：** Nginx/云负载均衡器
- **会话管理：** JWT无状态认证

### 13.2 存储扩展

- **云存储集成：** 支持切换到AWS S3/阿里云OSS
- **分布式存储：** 支持MinIO等分布式存储

### 13.3 功能扩展

- **WebSocket：** 实时数据推送（可选）
- **消息队列：** 异步处理上传任务（可选）
- **数据分析：** 集成数据可视化功能

---

## 14. 开发规范

### 14.1 代码规范

- 使用ESLint + Prettier
- TypeScript严格模式
- 提交信息规范：Conventional Commits

### 14.2 Git工作流

```
main (生产)
  ↑
staging (预发布)
  ↑
feature/* (功能分支)
```

### 14.3 测试策略

- **单元测试：** Jest
- **集成测试：** Supertest
- **E2E测试：** Playwright (前端)

---

## 15. 后续优化建议

### 15.1 短期优化
1. 添加API文档（Swagger）
2. 实现完整的错误日志
3. 添加数据预览功能
4. 实现批量下载

### 15.2 中期优化
1. 添加数据可视化图表
2. 实现数据搜索和过滤
3. 添加用户权限管理
4. 集成云存储

### 15.3 长期优化
1. 数据分析功能
2. 设备管理功能
3. 团队协作功能
4. 移动端离线支持

---

## 附录

### A. GGA数据格式说明

NMEA GGA (Global Positioning System Fix Data) 格式示例：
```
$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,*47
```

### B. 相关资源

- Fastify官方文档：https://www.fastify.io/
- PostgreSQL文档：https://www.postgresql.org/docs/
- Prisma文档：https://www.prisma.io/docs/
- React官方文档：https://react.dev/
- TypeScript文档：https://www.typescriptlang.org/

---

**文档版本：** 1.0  
**最后更新：** 2026-04-22  
**维护者：** 开发团队
