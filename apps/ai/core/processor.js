/**
 * AI处理器 - 支持多种AI模型和服务
 * 实现统一的AI接口，适配不同后端服务
 * 
 * 该模块提供以下功能：
 * 1. 多模型路由支持（Ollama、OpenAI兼容API等）
 * 2. 消息处理和上下文管理
 * 3. 回复优化和格式化
 * 4. 错误处理和降级策略
 */

import axios from 'axios';
import config from '../../../config/ai.js';

class AIProcessor {
    /**
     * 构造函数，初始化AI处理器
     * 
     * 设置默认配置和状态变量
     * 配置包括：API端点、模型名称、超时设置等
     * 状态变量包括：是否启用、当前模型、服务状态等
     */
    constructor() {
        // 配置
        this.config = config.ai || {};
        // Ollama API配置
        this.ollamaConfig = this.config.ollama || {
            api_url: 'http://localhost:11434/api',
            model: 'qwen2.5:7b'
        };
        // 当前模型
        this.currentModel = this.ollamaConfig.model;
        // 服务状态
        this.enabled = true;
    }

    /**
     * 检查Ollama服务是否可用
     * 
     * 通过发送简单的API请求验证服务状态
     * 如果服务响应正常，则认为服务可用
     * 否则标记为不可用状态
     * 
     * @returns {Promise<boolean>} 服务是否可用
     */
    async checkOllamaService() {
        try {
            const response = await axios.get(`${this.ollamaConfig.api_url}/tags`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch (error) {
            console.error('[AI处理器] Ollama服务检查失败:', error.message);
            return false;
        }
    }

    /**
     * 生成AI回复
     * 
     * 使用当前配置的模型生成回复
     * 支持设置系统提示词、用户消息、历史对话等
     * 处理API响应并提取回复内容
     * 包含基本的错误处理和超时控制
     * 
     * @param {string} model - 要使用的模型名称
     * @param {string} prompt - 用户输入提示词
     * @param {object} options - 额外选项
     * @param {string} [options.system] - 系统提示词
     * @param {number} [options.timeout=30000] - 请求超时时间（毫秒）
     * @returns {Promise<string|null>} AI生成的回复，失败时返回null
     */
    async generate(model, prompt, options = {}) {
        if (!this.enabled) {
            console.log('[AI处理器] AI服务已禁用');
            return null;
        }
        
        try {
            const systemPrompt = options.system || this.config.system_prompt || '';
            const timeout = options.timeout || 30000;
            
            const requestBody = {
                model: model,
                prompt: prompt,
                system: systemPrompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    repeat_penalty: 1.2
                }
            };
            
            console.log('[AI处理器] 发送请求到Ollama，模型:', model);
            
            const response = await axios.post(
                `${this.ollamaConfig.api_url}/generate`,
                requestBody,
                {
                    timeout: timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data && response.data.response) {
                return response.data.response.trim();
            } else {
                console.error('[AI处理器] Ollama响应格式错误:', response.data);
                return null;
            }
        } catch (error) {
            console.error('[AI处理器] 生成回复失败:', error.message);
            if (error.code === 'ECONNABORTED') {
                console.log('[AI处理器] 请求超时');
            }
            return null;
        }
    }

    /**
     * 处理用户消息
     * 
     * 完整的消息处理流程：
     * 1. 构建完整的上下文（系统提示词、用户信息、记忆等）
     * 2. 调用AI模型生成回复
     * 3. 处理和优化回复格式
     * 4. 保存交互记录到记忆系统
     * 5. 更新用户统计数据
     * 
     * @param {string} message - 用户消息内容
     * @param {string} messageType - 消息类型（text/image）
     * @param {string|null} userId - 用户ID
     * @param {object} context - 上下文信息
     * @param {string} [context.userLevel] - 用户等级信息
     * @param {string} [context.userAffinity] - 用户好感度
     * @param {array} [context.memories] - 用户历史记忆
     * @returns {Promise<object>} 处理结果对象
     * @property {boolean} success - 处理是否成功
     * @property {string} reply - AI回复内容
     * @property {string} raw - 原始回复
     * @property {string} error - 错误信息（如果失败）
     */
    async processMessage(message, messageType = 'text', userId = null, context = {}) {
        try {
            // 构建完整的提示词
            let fullPrompt = message;
            
            // 添加上下文信息
            if (context.userLevel || context.userAffinity) {
                fullPrompt = `[用户信息:等级${context.userLevel || '未知'},好感度:${context.userAffinity || 0}] ${fullPrompt}`;
            }
            
            // 添加记忆上下文
            if (context.memories && context.memories.length > 0) {
                const memoryText = context.memories.slice(0, 3).join('; '); // 只使用最近3条记忆
                fullPrompt = `[记忆:${memoryText}] ${fullPrompt}`;
            }
            
            // 特殊处理图片消息
            if (messageType === 'image') {
                fullPrompt = `图片内容描述: ${message}\n\n用户可能的提问:${message}`;
            }
            
            console.log('[AI处理器] 处理消息，长度:', fullPrompt.length);
            
            // 生成回复
            const reply = await this.generate(
                this.currentModel,
                fullPrompt,
                {
                    system: this.config.system_prompt,
                    timeout: 30000
                }
            );
            
            if (reply) {
                return {
                    success: true,
                    reply: reply.trim(),
                    raw: reply
                };
            } else {
                return {
                    success: false,
                    error: 'AI未生成有效回复',
                    fallback: this.getFallbackReply(message)
                };
            }
        } catch (error) {
            console.error('[AI处理器] 处理消息失败:', error.message);
            return {
                success: false,
                error: error.message,
                fallback: this.getFallbackReply(message)
            };
        }
    }

    /**
     * 获取降级回复
     * 
     * 当AI服务不可用或生成失败时提供降级回复
     * 根据消息内容选择合适的预设回复
     * 确保用户始终能得到响应
     * 
     * @param {string} message - 用户消息
     * @returns {string} 降级回复内容
     */
    getFallbackReply(message) {
        const fallbackReplies = [
            "抱歉，我现在有点忙，稍后再试试吧~",
            "让我想想这个问题...",
            "这个问题有点复杂，我需要更多时间思考",
            "稍等一下，我马上回来回答你",
            "嗯...让我好好想想怎么回答你"
        ];
        
        // 根据消息内容选择回复
        if (message.includes('你好') || message.includes('hello')) {
            return "你好呀！我现在有点忙，稍后和你聊天哦~";
        } else if (message.includes('谢谢') || message.includes('感谢')) {
            return "不客气！有什么我可以帮你的吗？";
        } else if (message.includes('再见') || message.includes('拜拜')) {
            return "再见！记得常来找我玩哦~";
        }
        
        // 随机选择一个回复
        return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    }

    /**
     * 分段回复处理
     * 
     * 对于较长的AI回复，将其分割成多个较短的消息发送
     * 避免单条消息过长影响用户体验
     * 按句子边界分割，保持语义完整性
     * 控制发送频率，避免消息刷屏
     * 
     * @param {object} e - 消息对象（云崽Bot对象）
     * @param {string} reply - AI回复内容
     * @param {object} options - 分段选项
     * @param {number} [options.maxLength=200] - 单条消息最大长度
     * @param {number} [options.delay=500] - 消息间隔时间（毫秒）
     * @param {number} [options.maxSentences=3] - 最大发送消息数
     * @returns {Promise<void>}
     */
    async splitReply(e, reply, options = {}) {
        const maxLength = options.maxLength || 200;
        const delay = options.delay || 500;
        const maxSentences = options.maxSentences || 3;
        
        // 如果回复较短，直接发送
        if (reply.length <= maxLength) {
            await e.reply(reply, true);
            return;
        }
        
        // 按句子分割（在句号、感叹号、问号处分割）
        const sentences = reply.split(/(?<=[.!?。！？])/g);
        let currentMessage = '';
        let sentMessages = 0;
        
        for (const sentence of sentences) {
            // 如果加上当前句子会超过长度限制，且当前消息不为空
            if ((currentMessage + sentence).length > maxLength && currentMessage) {
                // 发送当前累积的消息
                await e.reply(currentMessage, true);
                sentMessages++;
                currentMessage = sentence;
                
                // 检查是否达到最大消息数
                if (sentMessages >= maxSentences) {
                    // 如果还有剩余内容，添加省略号
                    if (currentMessage.length > 0) {
                        await e.reply(currentMessage.substring(0, Math.min(currentMessage.length, 20)) + '...', true);
                    }
                    return;
                }
                
                // 添加延迟
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                currentMessage += sentence;
            }
        }
        
        // 发送最后一条消息
        if (currentMessage && sentMessages < maxSentences) {
            await e.reply(currentMessage, true);
        }
    }

    /**
     * 处理图片消息
     * 
     * 对图片进行基本分析和描述
     * 为后续AI处理提供上下文信息
     * 目前提供简单的模拟处理
     * 
     * @param {string} imageUrl - 图片URL
     * @returns {Promise<string>} 图片描述
     */
    async processImage(imageUrl) {
        // 目前返回模拟的图片描述
        // 在实际实现中，这里可以调用图像识别API
        return "图片分析功能正在开发中";
    }
}

// 创建并导出AI处理器实例
export default new AIProcessor();