# GGA数据管理平台 - 移动端API接口文档

> **版本**: v1.0  
> **更新日期**: 2026-04-22  
> **基础URL**: `http://your-server-domain/api`

---

## 目录

1. [认证说明](#认证说明)
2. [通用响应格式](#通用响应格式)
3. [认证模块](#认证模块)
4. [数据上传模块](#数据上传模块)
5. [数据查询模块](#数据查询模块)
6. [数据统计模块](#数据统计模块)
7. [错误码说明](#错误码说明)

---

## 认证说明

### 双Token认证机制

系统采用 **Access Token + Refresh Token** 双Token机制，实现自动续期，避免频繁登录。

#### Token类型

| Token类型 | 有效期 | 用途 |
|-----------|--------|------|
| Access Token | 2小时 | 访问受保护接口 |
| Refresh Token | 30天 | 刷新Access Token |

#### 请求头格式

除注册和登录接口外，所有接口都需要在请求头中携带Access Token：

```
Authorization: Bearer <access_token>
```

#### Token刷新流程

1. 使用Access Token访问接口
2. 当Access Token过期（返回401）时，使用Refresh Token调用刷新接口
3. 刷新接口返回新的Access Token和Refresh Token
4. 使用新的Access Token继续访问接口
5. 如果Refresh Token也过期，则需要重新登录

#### 安全机制

- 每次刷新Token后，旧的Refresh Token会立即失效
- 退出登录时，Refresh Token会被标记为失效
- 服务端存储Refresh Token的哈希值，不存储明文

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

### 失败响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

---

## 认证模块

### 1. 用户注册

**接口地址**: `POST /api/auth/register`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456",
  "phone": "13800138000"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-20个字符 |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码，最少6个字符 |
| phone | string | 否 | 手机号 |

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "testuser",
      "email": "test@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "USER_ALREADY_EXISTS",
    "message": "用户名或邮箱已存在"
  }
}
```

---

### 2. 用户登录

**接口地址**: `POST /api/auth/login`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "testuser",
      "email": "test@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "邮箱或密码错误"
  }
}
```

---

### 3. 刷新Token

**接口地址**: `POST /api/auth/refresh`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refreshToken | string | 是 | 刷新令牌 |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "REFRESH_TOKEN_EXPIRED",
    "message": "刷新令牌已过期或已失效"
  }
}
```

---

### 4. 退出登录

**接口地址**: `POST /api/auth/logout`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refreshToken | string | 否 | 刷新令牌（建议传入以使旧token失效） |

**成功响应** (200):
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

---

### 5. 获取用户信息

**接口地址**: `GET /api/auth/profile`

**请求头**:
```
Authorization: Bearer <token>
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

---

## 数据上传模块

### 4. 上传GGA数据文件

**接口地址**: `POST /api/data/upload`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体** (multipart/form-data):

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | GGA数据文件（.gga格式） |
| date | string | 否 | 数据日期，格式：YYYY-MM-DD，默认为当天 |
| deviceId | string | 否 | 设备ID |
| deviceModel | string | 否 | 设备型号 |

**cURL示例**:
```bash
curl -X POST http://your-server-domain/api/data/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/data.gga" \
  -F "date=2024-01-15" \
  -F "deviceId=device-001" \
  -F "deviceModel=Model-X"
```

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "datasetId": "uuid-string",
    "fileName": "data.gga",
    "fileSize": 12345,
    "recordCount": 100,
    "uploadTime": "2024-01-15T10:30:00.000Z"
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "FILE_INVALID_TYPE",
    "message": "只支持.gga格式的文件"
  }
}
```

---

## 数据查询模块

### 5. 获取数据集列表

**接口地址**: `GET /api/data/datasets`

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |
| startDate | string | 否 | 开始日期，格式：YYYY-MM-DD |
| endDate | string | 否 | 结束日期，格式：YYYY-MM-DD |
| sort | string | 否 | 排序字段：date 或 createdAt，默认createdAt |
| order | string | 否 | 排序方向：asc 或 desc，默认desc |

**请求示例**:
```
GET /api/data/datasets?page=1&limit=20&startDate=2024-01-01&endDate=2024-01-31&sort=date&order=desc
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "datasets": [
      {
        "id": "uuid-string",
        "fileName": "data.gga",
        "fileSize": 12345,
        "date": "2024-01-15T00:00:00.000Z",
        "recordCount": 100,
        "uploadTime": "2024-01-15T10:30:00.000Z"
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

---

### 7. 删除数据集

**接口地址**: `DELETE /api/data/datasets/{id}`

**请求头**:
```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 数据集ID |

**成功响应** (200):
```json
{
  "success": true,
  "message": "数据集已删除"
}
```

**失败响应**:
```json
{
  "success": false,
  "error": {
    "code": "DATASET_NOT_FOUND",
    "message": "数据集不存在"
  }
}
```

---

### 8. 检查文件是否已上传

**接口地址**: `POST /api/data/check-files`

**请求头**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "fileNames": ["data1.gga", "data2.gga", "data3.gga"]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fileNames | string[] | 是 | 文件名列表 |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "existing": [
      {
        "fileName": "data1.gga",
        "datasetId": "uuid-string",
        "date": "2024-01-15T00:00:00.000Z",
        "fileSize": 12345,
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "notUploaded": ["data2.gga", "data3.gga"]
  }
}
```

| 返回字段 | 说明 |
|----------|------|
| existing | 已上传的文件列表，包含详细信息 |
| notUploaded | 未上传的文件名列表 |

**移动端使用场景**:
- 上传前调用此接口，避免重复上传
- 断点续传时检查哪些文件需要继续上传

---

### 9. 获取数据集详情

**接口地址**: `GET /api/data/datasets/{id}`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 数据集ID |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "fileName": "data.gga",
    "fileSize": 12345,
    "date": "2024-01-15T00:00:00.000Z",
    "recordCount": 100,
    "uploadTime": "2024-01-15T10:30:00.000Z",
    "deviceInfo": {
      "deviceId": "device-001",
      "model": "Model-X",
      "firmware": null
    },
    "preview": "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,*47\n..."
  }
}
```

---

### 10. 下载数据集文件

**接口地址**: `GET /api/data/datasets/{id}/download`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 数据集ID |

**响应**:
- Content-Type: `application/octet-stream`
- Content-Disposition: `attachment; filename="data.gga"`
- 响应体为文件二进制流

---

## 数据统计模块

### 11. 获取数据统计

**接口地址**: `GET /api/data/stats`

**请求头**:
```
Authorization: Bearer <token>
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "totalDatasets": 150,
    "totalRecords": 50000,
    "totalSize": 1234567890,
    "dateRange": {
      "earliest": "2024-01-01T00:00:00.000Z",
      "latest": "2024-01-15T00:00:00.000Z"
    },
    "recentUploads": [
      {
        "id": "uuid-string",
        "fileName": "data.gga",
        "fileSize": 12345,
        "date": "2024-01-15T00:00:00.000Z",
        "uploadTime": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| AUTH_INVALID_CREDENTIALS | 401 | 邮箱或密码错误 |
| AUTH_TOKEN_EXPIRED | 401 | Access Token已过期 |
| AUTH_TOKEN_INVALID | 401 | Access Token无效 |
| REFRESH_TOKEN_REQUIRED | 400 | 请提供刷新令牌 |
| REFRESH_TOKEN_INVALID | 401 | 刷新令牌无效 |
| REFRESH_TOKEN_EXPIRED | 401 | 刷新令牌已过期或已失效 |
| INVALID_TOKEN_TYPE | 401 | 令牌类型错误 |
| USER_ALREADY_EXISTS | 409 | 用户名或邮箱已存在 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| ACCOUNT_DISABLED | 403 | 账户已被禁用 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| FILE_REQUIRED | 400 | 请上传文件 |
| FILE_TOO_LARGE | 413 | 文件过大（最大50MB） |
| FILE_INVALID_TYPE | 400 | 文件类型无效，只支持.gga格式 |
| DATASET_NOT_FOUND | 404 | 数据集不存在 |
| ACCESS_DENIED | 403 | 无权访问 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 移动端对接注意事项

### 1. Token存储

建议将token存储在安全存储中：
- **iOS**: Keychain
- **Android**: EncryptedSharedPreferences 或 Keystore

需要存储两个token：
- `accessToken` - 用于API请求认证
- `refreshToken` - 用于刷新accessToken

### 2. Token自动刷新实现

**Android (Retrofit + OkHttp Interceptor)**:
```java
public class TokenAuthenticator implements Authenticator {
    @Override
    public Request authenticate(Route route, Response response) throws IOException {
        String refreshToken = getStoredRefreshToken();
        
        // 调用刷新接口
        RefreshResponse result = refreshTokenApi.refresh(refreshToken);
        
        if (result.isSuccess()) {
            // 保存新token
            saveTokens(result.getAccessToken(), result.getRefreshToken());
            
            // 重试原请求
            return response.request().newBuilder()
                .header("Authorization", "Bearer " + result.getAccessToken())
                .build();
        }
        
        // 刷新失败，跳转登录页
        navigateToLogin();
        return null;
    }
}

OkHttpClient client = new OkHttpClient.Builder()
    .authenticator(new TokenAuthenticator())
    .build();
```

**iOS (Alamofire Interceptor)**:
```swift
class TokenRefreshInterceptor: RequestInterceptor {
    func retry(_ request: Request, for session: Session, dueTo error: Error, completion: @escaping (RetryResult) -> Void) {
        guard let response = request.response, response.statusCode == 401 else {
            completion(.doNotRetry)
            return
        }
        
        let refreshToken = KeychainManager.shared.getRefreshToken()
        
        AuthAPI.refreshToken(refreshToken) { result in
            switch result {
            case .success(let response):
                KeychainManager.shared.saveTokens(
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken
                )
                completion(.retry)
            case .failure:
                KeychainManager.shared.clearTokens()
                self.navigateToLogin()
                completion(.doNotRetry)
            }
        }
    }
}
```

### 3. 文件上传

使用multipart/form-data格式上传文件：

**Android (Retrofit)**:
```java
@Multipart
@POST("api/data/upload")
Call<UploadResponse> uploadGGAData(
    @Header("Authorization") String token,
    @Part MultipartBody.Part file,
    @Part("date") RequestBody date,
    @Part("deviceId") RequestBody deviceId,
    @Part("deviceModel") RequestBody deviceModel
);
```

**iOS (Alamofire)**:
```swift
AF.upload(
    multipartFormData: { multipartFormData in
        multipartFormData.append(fileData, withName: "file", fileName: "data.gga", mimeType: "application/octet-stream")
        multipartFormData.append("2024-01-15".data(using: .utf8)!, withName: "date")
    },
    to: "http://your-server-domain/api/data/upload",
    headers: ["Authorization": "Bearer \(token)"]
)
```

### 4. 网络请求拦截器

建议配置请求拦截器自动添加token：

```javascript
// 伪代码示例
httpClient.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Access Token过期，尝试刷新
      const refreshToken = getStoredRefreshToken();
      try {
        const result = await refreshApi(refreshToken);
        saveTokens(result.accessToken, result.refreshToken);
        // 重试原请求
        return httpClient.request(error.config);
      } catch {
        // 刷新失败，跳转登录页
        navigateToLogin();
      }
    }
    return Promise.reject(error);
  }
);
```

### 4. 文件大小限制

- 单个文件最大：50MB
- 建议在网络较差时实现断点续传或重试机制

### 5. 日期格式

所有日期使用ISO 8601格式：`YYYY-MM-DDTHH:mm:ss.sssZ`

---

## 环境地址

| 环境 | 地址 |
|------|------|
| 开发环境 | http://localhost:3000/api |
| 测试环境 | 待定 |
| 生产环境 | 待定 |

---

## 联系方式

如有问题，请联系后端开发团队。
