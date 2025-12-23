-- 榴莲AI数据库初始化脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    platform VARCHAR(50) DEFAULT 'yunzai',
    api_key VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 好感度表
CREATE TABLE IF NOT EXISTS user_resonance (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    value INTEGER DEFAULT 0 CHECK (value >= -100 AND value <= 100),
    trauma INTEGER DEFAULT 0 CHECK (trauma >= 0 AND trauma <= 100),
    level VARCHAR(20) DEFAULT 'NEUTRAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 记忆表
CREATE TABLE IF NOT EXISTS user_memories (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
    memory_type VARCHAR(50) DEFAULT 'interaction',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色成长表
CREATE TABLE IF NOT EXISTS character_states (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    version VARCHAR(20) DEFAULT 'v1.0',
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    traits JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 身份表
CREATE TABLE IF NOT EXISTS user_identities (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    identity_id VARCHAR(100) UNIQUE NOT NULL,
    secret_code VARCHAR(20) UNIQUE,
    linked_accounts JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- 插入默认系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('blacklist_groups', '[]', '黑名单群组列表'),
('global_settings', '{"enable_ai": true, "max_response_length": 200}', '全局设置'),
('admin_users', '[]', '管理员用户ID列表')
ON CONFLICT (config_key) DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_resonance_user_id ON user_resonance(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_character_user_id ON character_states(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_user_id ON user_identities(user_id);