# 榴莲AI服务器部署

## 🎯 简单架构

基于现有逻辑扩展，添加数据库支持，保持架构简单清晰。

## 🚀 快速部署

### 1. 环境准备
```bash
# 复制配置文件
cp .env.example .env

# 编辑配置
nano .env
```

### 2. 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f liulian-api
```

### 3. 验证服务
```bash
# 健康检查
curl http://localhost:8080/api/health

# 测试对话
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好","userId":"123456"}'
```

## 📝 配置说明

### 环境变量
```env
# 数据库配置
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password

# AI模型配置
OLLAMA_URL=http://localhost:11434
GENERAL_MODEL=deepseek-llm:7b
VISION_MODEL=moondream:latest
FAST_MODEL=qwen:7b-chat
```

### 数据库表结构
- `user_data`: 用户数据（好感度、记忆、角色状态）
- `interaction_logs`: 交互日志

## 🔧 核心功能

### 1. 智能模型选择
- 图像消息 → vision模型
- 代码相关 → general模型  
- 短消息 → fast模型
- 默认 → general模型

### 2. 用户状态管理
- **好感度系统**: -100到100，5个等级
- **记忆系统**: 最近20条交互记录
- **角色成长**: 等级和经验值系统

### 3. 数据持久化
- PostgreSQL: 用户数据和日志
- Redis: 缓存和会话存储

## 📊 API接口

### 对话接口
```
POST /api/chat
{
  "message": "用户消息",
  "userId": "用户ID", 
  "messageType": "text|image"
}
```

### 用户状态查询
```
GET /api/user/:userId
```

### 健康检查
```
GET /api/health
```

## 🛠️ 维护命令

```bash
# 查看服务状态
docker-compose ps

# 重启服务
docker-compose restart liulian-api

# 查看日志
docker-compose logs -f

# 备份数据
docker exec liulian-postgres pg_dump -U liulian_user liulian_db > backup.sql

# 更新服务
git pull
docker-compose build
docker-compose up -d
```

## 🔄 开源优势

- **简单易懂**: 代码结构清晰，便于理解和修改
- **易于扩展**: 模块化设计，方便添加新功能
- **社区贡献**: 开源用户可以提供优化方案
- **透明可控**: 所有逻辑公开，用户可以自主定制

## 📈 性能优化建议

1. **模型选择**: 根据用户反馈调整模型选择逻辑
2. **缓存策略**: 优化Redis缓存命中率
3. **数据库索引**: 根据查询模式添加索引
4. **负载均衡**: 支持多实例部署

## 🐛 故障排除

### 常见问题
1. **Ollama连接失败**: 检查OLLAMA_URL配置
2. **数据库连接失败**: 确认密码和网络配置
3. **内存不足**: 调整Docker内存限制

### 日志查看
```bash
# API服务日志
docker-compose logs liulian-api

# 数据库日志  
docker-compose logs postgres

# Redis日志
docker-compose logs redis
```

## 📞 技术支持

如有问题，请查看日志或提交Issue。