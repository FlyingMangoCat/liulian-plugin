/**
 * AI模块配置文件
 * 支持MongoDB连接配置
 */

export default {
  // AI配置
  ai: {
    // Ollama配置
    ollama: {
      api_url: process.env.OLLAMA_API_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    },
    
    // 系统提示词
    system_prompt: process.env.SYSTEM_PROMPT || '你是一个智能AI助手，会根据用户的问题提供有用的信息和帮助。',
    
    // 触发配置
    triggers: {
      names: ["榴莲", "小莲", "莲莲"],
      always_respond_to_mentions: true,
      always_respond_in_private: true
    },
    
    // 回复概率
    probability: {
      private: 100,
      group: 40
    },
    
    // 回复配置
    reply: {
      max_length: 200,
      delay_between_messages: 500
    },
    
    // 黑名单
    blacklist: {
      groups: [],
      enable: false
    },
    
    // 回复长度限制
    reply_length: {
      max_chars: 120,
      max_sentences: 2,
      trim_ellipsis: true
    }
  },
  
  // 数据库配置
  database: {
    // MongoDB配置（用于用户系统集成）
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/liulian',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // 连接池配置
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    
    // Redis配置（用于缓存）
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      ttl: 3600 // 缓存过期时间（秒）
    },
    
    // PostgreSQL配置（向后兼容）
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'liulian',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  },
  
  // 兼容性配置
  compatibility: {
    // 命令前缀（用于识别命令消息）
    command_prefixes: ['/', '#', '!', '！', '.', '。', '、'],
    
    // 最小处理延迟（毫秒）
    min_processing_delay: 100,
    
    // 是否跳过命令消息
    skip_command_messages: true
  }
};