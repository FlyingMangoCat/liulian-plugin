# AI API 服务使用文档

## 概述

本API服务提供了基于Ollama的AI功能，支持密钥验证和按token计费。用户可以通过API密钥访问AI服务，管理员可以监控和管理API使用情况。

## 认证方式

所有API请求都需要通过API密钥进行认证，支持以下两种方式：

1. 在请求头中添加 `Authorization: Bearer YOUR_API_KEY`
2. 在请求头中添加 `X-API-Key: YOUR_API_KEY`

## API端点

### 1. API密钥管理

#### 创建API密钥
```
POST /api/ai-api/keys
Authorization: Bearer USER_JWT_TOKEN
Content-Type: application/json

{
  "name": "My API Key",
  "usageLimit": 1000000
}
```

#### 获取API密钥列表
```
GET /api/ai-api/keys
Authorization: Bearer USER_JWT_TOKEN
```

#### 删除API密钥
```
DELETE /api/ai-api/keys/:keyId
Authorization: Bearer USER_JWT_TOKEN
```

### 2. AI服务接口

#### 获取可用模型列表
```
GET /api/ai-service/models
Authorization: Bearer YOUR_API_KEY
```

#### AI聊天接口
```
POST /api/ai-service/chat
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "model": "llama2",
  "messages": [
    {
      "role": "user",
      "content": "你好，世界！"
    }
  ]
}
```

#### AI文本生成接口
```
POST /api/ai-service/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "model": "llama2",
  "prompt": "写一首关于春天的诗"
}
```

### 3. 使用统计

#### 获取个人使用统计
```
GET /api/ai-api/usage
Authorization: Bearer USER_JWT_TOKEN
```

### 4. 管理员接口

#### 获取所有API密钥（用于监控）
```
GET /api/ai-api/admin/keys
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### 禁用/启用API密钥
```
PATCH /api/ai-api/admin/keys/:keyId
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "isActive": false
}
```

#### 获取系统使用统计
```
GET /api/ai-api/admin/stats
Authorization: Bearer ADMIN_JWT_TOKEN
```

## 计费说明

API服务按照token使用量计费，计费标准如下：

- Llama2: ￥0.002 / 1K tokens
- Llama3: ￥0.003 / 1K tokens
- Mistral: ￥0.0025 / 1K tokens
- Mixtral: ￥0.004 / 1K tokens
- Gemma: ￥0.002 / 1K tokens
- 其他模型: ￥0.0025 / 1K tokens

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "error": "错误描述",
  "code": "错误代码"
}
```

常见错误代码：
- MISSING_API_KEY: 缺少API密钥
- INVALID_API_KEY: 无效的API密钥
- RATE_LIMIT_EXCEEDED: API密钥使用次数已达上限
- AUTHENTICATION_ERROR: API密钥验证失败
- ADMIN_REQUIRED: 需要管理员权限
- MISSING_MESSAGES: 缺少必要参数: messages
- MISSING_PROMPT: 缺少必要参数: prompt
- AI_SERVICE_ERROR: AI服务错误
- OLLAMA_CONNECTION_ERROR: 无法连接Ollama服务