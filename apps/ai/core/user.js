/**
 * 用户服务模块 - 支持与主系统用户模型集成
 * 同时保持向后兼容性
 */

// 尝试导入主系统的User模型，如果失败则使用本地实现
let UserModel = null;
let mongoose = null;

try {
  // 尝试导入主系统的User模型
  mongoose = await import('mongoose');
  UserModel = await import('../../../../../models/User.js');
  console.log('[User Service] 成功导入主系统用户模型');
} catch (error) {
  console.log('[User Service] 主系统用户模型导入失败，使用本地兼容模式:', error.message);
  
  // 创建本地用户模型（用于向后兼容）
  try {
    const { Schema } = mongoose || (await import('mongoose'));
    
    if (Schema) {
      const userSchema = new Schema({
        user_id: { type: String, required: true, unique: true },
        username: String,
        nickname: String,
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        role: { type: String, default: 'user' },
        isActive: { type: Boolean, default: true },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
      });
      
      try {
        UserModel = mongoose.model('User');
      } catch (e) {
        UserModel = mongoose.model('User', userSchema);
      }
    }
  } catch (e) {
    console.warn('[User Service] 本地用户模型创建失败:', e.message);
  }
}

class UserService {
  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {object|null} 用户信息
   */
  static async getUser(userId) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return null;
    }
    
    try {
      // 如果有主系统的User模型，直接使用
      if (UserModel && UserModel.default) {
        const user = await UserModel.default.findById(userId).select('-password');
        return user;
      } else if (UserModel) {
        const user = await UserModel.findById(userId).select('-password');
        return user;
      }
      
      // 使用本地模型（向后兼容）
      if (typeof UserModel !== 'string') { // 避免UserModel为undefined或导入错误
        const user = await UserModel.findOne({ user_id: userId }).select('-password');
        return user;
      }
    } catch (error) {
      console.error('[User Service] 获取用户信息失败:', error);
      return null;
    }
    
    return null;
  }

  /**
   * 检查用户是否存在
   * @param {string} userId - 用户ID
   * @returns {boolean} 用户是否存在
   */
  static async userExists(userId) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return false;
    }
    
    try {
      const user = await this.getUser(userId);
      return !!user;
    } catch (error) {
      console.error('[User Service] 检查用户存在性失败:', error);
      return false;
    }
  }

  /**
   * 创建或更新用户
   * @param {string} userId - 用户ID
   * @param {object} userData - 用户数据
   * @returns {object|null} 用户对象
   */
  static async upsertUser(userId, userData = {}) {
    if (!mongoose || mongoose.connection.readyState !== 1) {
      console.log('[User Service] 数据库未连接');
      return null;
    }
    
    try {
      if (UserModel && UserModel.default) {
        // 主系统用户模型
        const user = await UserModel.default.findOneAndUpdate(
          { _id: userId },
          { ...userData, updated_at: new Date() },
          { upsert: true, new: true }
        ).select('-password');
        return user;
      } else if (UserModel) {
        const user = await UserModel.findOneAndUpdate(
          { _id: userId },
          { ...userData, updated_at: new Date() },
          { upsert: true, new: true }
        ).select('-password');
        return user;
      } else {
        // 使用本地模型
        const user = await UserModel.findOneAndUpdate(
          { user_id: userId },
          { 
            ...userData, 
            updated_at: new Date(),
            user_id: userId
          },
          { upsert: true, new: true }
        ).select('-password');
        return user;
      }
    } catch (error) {
      console.error('[User Service] 创建/更新用户失败:', error);
      return null;
    }
  }

  /**
   * 检查用户权限
   * @param {string} userId - 用户ID
   * @param {string} requiredRole - 需要的角色
   * @returns {boolean} 是否有权限
   */
  static async hasPermission(userId, requiredRole = 'user') {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return false;
      }
      
      // 管理员权限检查
      if (requiredRole === 'admin') {
        return user.role === 'admin';
      }
      
      // 普通用户权限检查
      return user.role === requiredRole || user.role === 'admin';
    } catch (error) {
      console.error('[User Service] 检查用户权限失败:', error);
      return false;
    }
  }

  /**
   * 获取用户等级信息
   * @param {string} userId - 用户ID
   * @returns {object} 用户等级信息
   */
  static async getUserLevelInfo(userId) {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return {
          level: 1,
          experience: 0,
          role: 'user',
          isActive: true
        };
      }
      
      return {
        level: user.level || 1,
        experience: user.experience || 0,
        role: user.role || 'user',
        isActive: user.isActive !== false
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