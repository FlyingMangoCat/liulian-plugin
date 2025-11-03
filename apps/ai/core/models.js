/**
 * 数据库模型定义
 * 统一管理所有数据库模型
 */

import mongoose from 'mongoose';

// 通用用户模型
const commonUserSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  username: String,
  nickname: String,
  avatar: String,
  register_date: { type: Date, default: Date.now },
  last_login: { type: Date, default: Date.now },
  status: { type: String, default: 'active' }, // active, banned, inactive
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// AI用户数据模型
const aiUserSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  affinity: { type: Number, default: 0 }, // 好感度
  interaction_count: { type: Number, default: 0 }, // 交互次数
  total_words: { type: Number, default: 0 }, // 总字数
  last_interaction: { type: Date }, // 最后交互时间
  preferences: { type: Object, default: {} }, // 用户偏好设置
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 记忆模型
const memorySchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  memory: { type: String, required: true },
  category: { type: String, default: 'default' },
  created_at: { type: Date, default: Date.now }
});

export {
  commonUserSchema,
  aiUserSchema,
  memorySchema
};