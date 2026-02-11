import { OpenMemory } from "openmemory-js";
import _ from "lodash";
import path from "path";
import fs from "fs";
import { Cfg } from "#liulian";

/**
 * 记忆管理器 - 支持本地和云端双模式
 * 默认使用本地SQLite存储，云端模式需订阅
 */
class MemoryManager {
  constructor(userId) {
    this.userId = userId;
    this.memory = null;
    this.mode = "local"; // 默认本地模式
    this.config = {
      local: {
        mode: "local",
        path: path.join(process.cwd(), "data", "memory", `user_${userId}.db`),
        embeddings: {
          provider: "ollama",
          model: "nomic-embed-text"
        }
      },
      cloud: {
        mode: "server",
        url: process.env.MEMORY_CLOUD_URL || "http://localhost:8081",
        apiKey: userId, // 使用userId作为API密钥
        embeddings: {
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY
        }
      }
    };
  }

  /**
   * 初始化记忆系统
   * 从配置读取云端记忆开关，自动选择模式
   */
  async init() {
    // 从配置读取云端记忆开关
    const cloudEnabled = Cfg.get('liulian.memory.cloud', false);
    this.mode = cloudEnabled ? "cloud" : "local";
    
    // 确保记忆数据目录存在
    const memoryDir = path.join(process.cwd(), "data", "memory");
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    try {
      const config = this.config[this.mode];
      
      if (this.mode === "local") {
        // 本地模式：使用SQLite + Ollama embedding
        this.memory = new OpenMemory({
          mode: config.mode,
          path: config.path,
          embeddings: config.embeddings
        });
        logger.mark(`[记忆系统] 用户 ${this.userId} 使用本地记忆模式`);
      } else {
        // 云端模式：连接到OpenMemory服务
        this.memory = new OpenMemory({
          mode: config.mode,
          url: config.url,
          apiKey: config.apiKey,
          embeddings: config.embeddings
        });
        logger.mark(`[记忆系统] 用户 ${this.userId} 使用云端记忆模式`);
      }
    } catch (error) {
      logger.error(`[记忆系统] 初始化失败: ${error.message}`);
      // 降级到本地模式
      this.mode = "local";
      this.memory = new OpenMemory({
        mode: "local",
        path: path.join(process.cwd(), "data", "memory", `user_${userId}.db`),
        embeddings: { provider: "ollama", model: "nomic-embed-text" }
      });
    }
  }

  /**
   * 保存用户交互记忆
   * @param {string} groupId - 群号
   * @param {string} userMessage - 用户消息
   * @param {string} botReply - 机器人回复
   * @param {boolean} isPrivate - 是否私聊
   */
  async saveInteraction(groupId, userMessage, botReply, isPrivate = false) {
    if (!this.memory) {
      logger.warn(`[记忆系统] 记忆未初始化，跳过保存`);
      return;
    }

    try {
      const chatType = isPrivate ? "私聊" : "群聊";
      const content = `[${chatType}] 群${groupId}\n用户: ${userMessage}\n榴莲: ${botReply}`;
      
      await this.memory.add(content, {
        userId: this.userId,
        groupId,
        chatType: isPrivate ? "private" : "group",
        timestamp: new Date().toISOString()
      });
      
      logger.debug(`[记忆系统] 已保存用户 ${this.userId} 的交互记忆`);
    } catch (error) {
      logger.error(`[记忆系统] 保存记忆失败: ${error.message}`);
    }
  }

  /**
   * 获取上下文记忆
   * @param {string} groupId - 群号
   * @param {string} query - 查询关键词
   * @param {number} limit - 返回数量
   * @returns {string} 格式化的记忆文本
   */
  async getContext(groupId, query = "", limit = 5) {
    if (!this.memory) {
      logger.warn(`[记忆系统] 记忆未初始化，返回空上下文`);
      return "";
    }

    try {
      let results = [];
      
      if (query) {
        // 使用语义检索
        results = await this.memory.query(query, {
          filters: {
            user_id: this.userId,
            group_id: groupId
          },
          limit
        });
      } else {
        // 获取最近的记忆
        results = await this.memory.query("", {
          filters: {
            user_id: this.userId,
            group_id: groupId
          },
          limit,
          sortBy: "timestamp",
          sortOrder: "desc"
        });
      }

      // 格式化结果
      const memories = results.map((item, index) => {
        return `${index + 1}. ${item.content}`;
      });

      return memories.length > 0 ? memories.join("\n") : "暂无相关记忆";
    } catch (error) {
      logger.error(`[记忆系统] 获取上下文失败: ${error.message}`);
      return "记忆检索失败";
    }
  }

  /**
   * 保存偏好设置
   * @param {string} key - 偏好键
   * @param {string} value - 偏好值
   */
  async savePreference(key, value) {
    if (!this.memory) return;

    try {
      await this.memory.add(`偏好: ${key} = ${value}`, {
        userId: this.userId,
        type: "preference",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`[记忆系统] 保存偏好失败: ${error.message}`);
    }
  }

  /**
   * 检索偏好设置
   * @param {string} key - 偏好键
   * @returns {string|null} 偏好值
   */
  async getPreference(key) {
    if (!this.memory) return null;

    try {
      const results = await this.memory.query(`偏好: ${key}`, {
        filters: {
          user_id: this.userId,
          type: "preference"
        },
        limit: 1
      });

      if (results.length > 0) {
        const match = results[0].content.match(/偏好: (.+?) = (.+)/);
        return match ? match[2] : null;
      }
      return null;
    } catch (error) {
      logger.error(`[记忆系统] 获取偏好失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 切换记忆模式
   * @param {string} newMode - 新模式: "local" 或 "cloud"
   */
  async switchMode(newMode) {
    if (this.mode === newMode) {
      return { success: false, message: "已经是该模式" };
    }

    try {
      await this.init(newMode);
      return { 
        success: true, 
        message: `已切换到${newMode === "cloud" ? "云端" : "本地"}记忆模式` 
      };
    } catch (error) {
      return { success: false, message: `切换失败: ${error.message}` };
    }
  }

  /**
   * 获取当前记忆模式
   * @returns {string} 当前模式
   */
  getMode() {
    return this.mode;
  }

  /**
   * 清空记忆（危险操作）
   */
  async clearMemory() {
    if (!this.memory) return;

    try {
      await this.memory.delete({
        filters: { user_id: this.userId }
      });
      logger.mark(`[记忆系统] 已清空用户 ${this.userId} 的所有记忆`);
    } catch (error) {
      logger.error(`[记忆系统] 清空记忆失败: ${error.message}`);
    }
  }
}

// 导出单例模式
const memoryInstances = new Map();

export function getMemoryManager(userId) {
  if (!memoryInstances.has(userId)) {
    memoryInstances.set(userId, new MemoryManager(userId));
  }
  return memoryInstances.get(userId);
}

export default MemoryManager;