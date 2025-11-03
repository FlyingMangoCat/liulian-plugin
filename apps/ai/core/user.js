/**
 * 通用用户服务模块 - 支持跨平台用户系统集成
 * 实现用户基础信息通用化，应用特定数据独立存储
 * 
 * 该模块提供以下功能：
 * 1. 通用用户信息管理（跨平台同步）
 * 2. AI应用特定数据独立存储
 * 3. 用户等级和权限管理
 * 4. 好感度系统
 */

import mongoose from 'mongoose';
import { commonUserSchema, aiUserSchema } from './models.js';

class UserService {
  /**
   * 获取MongoDB模型
   * 
   * 从缓存中获取或创建MongoDB模型
   * 避免重复创建模型
   * 
   * @param {string} modelName - 模型名称
   * @param {object} schema - 模型Schema
   * @returns {object} Mongoose模型
   */
  static getMongoModel(modelName, schema) {
    try {
      return mongoose.model(modelName);
    } catch (error) {
      return mongoose.model(modelName, schema);
    }
  }

  /**
   * 获取通用用户信息（跨平台同步的基础信息）
   * 
   * 通用用户信息包括：用户ID、用户名、昵称、头像、注册时间、最后登录时间等
   * 这些信息在不同平台间同步，确保用户在各平台有一致的身份识别
   * 
   * @param {string} userId - 用户唯一标识符
   * @returns {object|null} 用户基础信息对象，如果用户不存在则返回null
   * @example
   * const userInfo = await UserService.getCommonUserInfo('123456');
   * console.log(userInfo); // { user_id: '123456', username: 'testuser', ... }
   */
  static async getCommonUserInfo(userId) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return null;
    }
    
    try {
      const CommonUserModel = this.getMongoModel('common_users', commonUserSchema);
      const user = await CommonUserModel.findOne({ user_id: userId });
      return user;
    } catch (error) {
      console.error('[User Service] 获取通用用户信息失败:', error);
      return null;
    }
  }

  /**
   * 创建或更新通用用户信息
   * 
   * 当用户首次使用AI功能时创建通用用户记录
   * 后续交互时更新最后登录时间等信息
   * 
   * @param {string} userId - 用户唯一标识符
   * @param {object} userData - 用户基础数据
   * @param {string} [userData.username] - 用户名
   * @param {string} [userData.nickname] - 昵称
   * @param {string} [userData.avatar] - 头像URL
   * @param {Date} [userData.register_date] - 注册时间
   * @returns {object|null} 更新后的用户对象，失败时返回null
   */
  static async upsertCommonUser(userId, userData = {}) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return null;
    }
    
    try {
      const CommonUserModel = this.getMongoModel('common_users', commonUserSchema);
      
      // 更新最后登录时间
      const updateData = {
        ...userData,
        last_login: new Date(),
        updated_at: new Date()
      };
      
      // 如果是新用户，设置注册时间
      if (!userData.register_date) {
        updateData.register_date = new Date();
      }
      
      const user = await CommonUserModel.findOneAndUpdate(
        { user_id: userId },
        updateData,
        { upsert: true, new: true }
      );
      
      return user;
    } catch (error) {
      console.error('[User Service] 创建/更新通用用户失败:', error);
      return null;
    }
  }

  /**
   * 检查用户是否存在（通用用户系统中）
   * 
   * 用于验证用户是否已在通用用户系统中注册
   * 避免重复创建用户记录
   * 
   * @param {string} userId - 用户唯一标识符
   * @returns {boolean} 用户是否存在
   */
  static async userExists(userId) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return false;
    }
    
    try {
      const user = await this.getCommonUserInfo(userId);
      return !!user;
    } catch (error) {
      console.error('[User Service] 检查用户存在性失败:', error);
      return false;
    }
  }

  /**
   * 获取AI应用特定的用户数据（独立存储）
   * 
   * AI应用特定数据包括：
   * - 好感度（affinity）：用户与AI的亲密度
   * - 交互次数（interaction_count）：用户与AI的交互总次数
   * - 总字数（total_words）：用户与AI交互的总字数
   * - 最后交互时间（last_interaction）
   * - 用户偏好设置（preferences）
   * 
   * 这些数据独立存储，不会影响其他应用
   * 
   * @param {string} userId - 用户唯一标识符
   * @returns {object} AI应用特定数据对象
   * @property {number} affinity - 用户好感度
   * @property {number} interaction_count - 交互次数
   * @property {number} total_words - 总字数
   * @property {Date|null} last_interaction - 最后交互时间
   * @property {object} preferences - 用户偏好设置
   */
  static async getAIUserData(userId) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return {
        affinity: 0, // 好感度
        interaction_count: 0, // 交互次数
        total_words: 0, // 总字数
        last_interaction: null // 最后交互时间
      };
    }
    
    try {
      const AIUserModel = this.getMongoModel('ai_users', aiUserSchema);
      
      let user = await AIUserModel.findOne({ user_id: userId });
      if (!user) {
        // 如果用户不存在，创建新记录
        user = new AIUserModel({ user_id: userId });
        await user.save();
      }
      
      return {
        affinity: user.affinity || 0,
        interaction_count: user.interaction_count || 0,
        total_words: user.total_words || 0,
        last_interaction: user.last_interaction,
        preferences: user.preferences || {}
      };
    } catch (error) {
      console.error('[User Service] 获取AI用户数据失败:', error);
      return {
        affinity: 0,
        interaction_count: 0,
        total_words: 0,
        last_interaction: null,
        preferences: {}
      };
    }
  }

  /**
   * 更新AI应用特定的用户数据
   * 
   * 用于更新用户的AI交互数据，如增加交互次数、更新偏好设置等
   * 使用$set操作符确保只更新指定字段，不影响其他字段
   * 
   * @param {string} userId - 用户唯一标识符
   * @param {object} updateData - 要更新的数据对象
   * @param {number} [updateData.affinity] - 好感度
   * @param {number} [updateData.interaction_count] - 交互次数
   * @param {number} [updateData.total_words] - 总字数
   * @param {Date} [updateData.last_interaction] - 最后交互时间
   * @param {object} [updateData.preferences] - 用户偏好设置
   * @returns {boolean} 是否更新成功
   */
  static async updateAIUserData(userId, updateData = {}) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return false;
    }
    
    try {
      const AIUserModel = this.getMongoModel('ai_users', aiUserSchema);
      
      // 更新数据
      const update = {
        ...updateData,
        updated_at: new Date()
      };
      
      await AIUserModel.findOneAndUpdate(
        { user_id: userId },
        { $set: update },
        { upsert: true, new: true }
      );
      
      return true;
    } catch (error) {
      console.error('[User Service] 更新AI用户数据失败:', error);
      return false;
    }
  }

  /**
   * 增加用户好感度
   * 
   * 根据用户与AI的交互情况动态调整好感度
   * 好感度用于影响AI回复的语气和内容个性化程度
   * 好感度有下限（0），无上限
   * 
   * @param {string} userId - 用户唯一标识符
   * @param {number} amount - 增加的好感度值，默认为1
   * @returns {number} 更新后的好感度值
   */
  static async increaseAffinity(userId, amount = 1) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return 0;
    }
    
    try {
      // 获取当前好感度
      const userData = await this.getAIUserData(userId);
      const newAffinity = Math.max(0, userData.affinity + amount); // 确保不为负数
      
      // 更新好感度
      await this.updateAIUserData(userId, { affinity: newAffinity });
      
      return newAffinity;
    } catch (error) {
      console.error('[User Service] 增加好感度失败:', error);
      return 0;
    }
  }

  /**
   * 获取用户等级信息（基于通用用户系统）
   * 
   * 根据用户的注册时间和活跃度计算用户等级
   * 等级用于权限控制和个性化服务
   * 等级计算规则：每注册7天增加1级，最低1级
   * 
   * @param {string} userId - 用户唯一标识符
   * @returns {object} 用户等级信息对象
   * @property {number} level - 用户等级
   * @property {number} experience - 用户经验值（注册天数）
   * @property {string} role - 用户角色（user/admin/banned）
   * @property {boolean} isActive - 用户是否活跃
   */
  static async getUserLevelInfo(userId) {
    try {
      // 获取通用用户信息
      const commonUser = await this.getCommonUserInfo(userId);
      
      if (!commonUser) {
        // 如果通用用户不存在，返回默认信息
        return {
          level: 1,
          experience: 0,
          role: 'user',
          isActive: true
        };
      }
      
      // 这里可以根据注册时间或其他通用标准计算等级
      const registerDate = new Date(commonUser.register_date);
      const now = new Date();
      const daysSinceRegister = Math.floor((now - registerDate) / (1000 * 60 * 60 * 24));
      
      // 简单的等级计算（可以根据需要调整）
      const level = Math.max(1, Math.floor(daysSinceRegister / 7) + 1);
      
      return {
        level: level,
        experience: daysSinceRegister,
        role: commonUser.status === 'banned' ? 'banned' : 'user',
        isActive: commonUser.status === 'active'
      };
    } catch (error) {
      console.error('[User Service] 获取用户等级信息失败:', error);
      return {
        level: 1,
        experience: 0,
        role: 'user',
        isActive: true
      };
    }
  }
}

export default UserService;