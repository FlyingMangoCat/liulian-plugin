import OllamaHandler from './core/ollama.js';
import { ModelRouter } from './core/modelRouter.js';
import serviceDetector from './core/serviceDetector.js';
import fallbackProcessor from './core/fallbackProcessor.js';
import DatabaseManager from './core/database.js';
import config from '../../config/ai.js';

// 环境检测
const isMiddlewareMode = process.env.LIULIAN_MODE === 'middleware';

// 初始化服务
const ollama = new OllamaHandler(config.ai.ollama.api_url);
const modelRouter = new ModelRouter();

// 服务初始化
if (!isMiddlewareMode) {
    // 云崽模式下才自动初始化服务
    serviceDetector.checkOllama().then(available => {
        if (available) {
            serviceDetector.startPeriodicCheck();
            serviceDetector.resetFailureCount(); // 重置失败计数
        } else {
            console.log('[AI模块] AI服务不可用，将禁用AI功能');
        }
    });
    
    // 启动数据库连接
    console.log('[AI模块] 初始化数据库连接');
    DatabaseManager.connect().then(() => {
        console.log('[AI模块] 数据库连接状态:', DatabaseManager.isConnected);
    });
} else {
    // 中间件模式下初始化数据库连接
    console.log('[AI模块] 中间件模式下初始化数据库连接');
    DatabaseManager.connect().then(() => {
        console.log('[AI模块] 数据库连接状态:', DatabaseManager.isConnected);
    });
}

/**
 * AI管理器类
 * 
 * 负责处理所有AI相关功能，包括：
 * 1. 消息处理和回复生成
 * 2. 用户记忆管理
 * 3. 服务状态检测
 * 4. 配置管理
 * 5. 概率控制
 * 
 * 支持两种运行模式：
 * - 云崽模式：作为Yunzai-Bot插件运行
 * - 中间件模式：作为独立服务运行
 */
class AIManager {
    /**
     * 检查AI服务是否可用
     * 
     * 通过serviceDetector检查Ollama服务状态
     * 用于决定是否处理用户消息
     * 
     * @returns {boolean} AI服务是否可用
     */
    static isAIAvailable() {
        return serviceDetector.isServiceAvailable();
    }

    /**
     * 获取服务状态报告
     * 
     * 返回当前AI服务的详细状态信息
     * 包括Ollama服务、模型可用性等
     * 
     * @returns {object} 服务状态报告
     */
    static getServiceStatus() {
        return serviceDetector.getStatusReport();
    }

    /**
     * 获取AI配置
     * 
     * 返回AI模块的完整配置，包括：
     * - 触发设置：AI响应触发条件
     * - 概率设置：私聊和群聊的回复概率
     * - 回复设置：最大长度和消息间隔
     * - 黑名单设置：群组回复限制
     * - 长度限制：回复字符和句子数限制
     * 
     * 如果配置项不存在，提供安全的默认值
     * 
     * @returns {object} AI配置对象
     * @property {object} triggers - 触发配置
     * @property {object} probability - 概率配置
     * @property {object} reply - 回复配置
     * @property {object} blacklist - 黑名单配置
     * @property {object} reply_length - 回复长度限制
     */
    static getConfig() {
        // 确保配置结构完整，提供默认值
        return {
            triggers: config.ai?.triggers || {
                names: ["榴莲", "小莲", "莲莲", "可心"],
                always_respond_to_mentions: true,
                always_respond_in_private: true
            },
            probability: config.ai?.probability || {
                private: 100,
                group: 40
            },
            reply: config.ai?.reply || {
                max_length: 200,
                delay_between_messages: 500
            },
            blacklist: config.ai?.blacklist || {
                groups: [],
                enable: false
            },
            reply_length: config.ai?.reply_length || {
                max_chars: 120,
                max_sentences: 2,
                trim_ellipsis: true
            }
        };
    }

    /**
     * 检查是否应该回复消息
     * 
     * 根据以下条件决定是否回复：
     * 1. AI服务是否可用
     * 2. 消息对象是否存在
     * 3. 是否在黑名单群组中
     * 4. 是否为私聊消息
     * 5. 是否被@提及
     * 6. 是否包含触发关键词
     * 7. 随机概率检查
     * 
     * @param {object} e - 消息对象
     * @param {boolean} e.isPrivate - 是否为私聊
     * @param {boolean} e.at - 是否被@提及
     * @param {string} e.msg - 消息内容
     * @returns {boolean} 是否应该回复
     */
    static shouldReply(e) {
        const safeConfig = this.getConfig();
        
        // 如果AI服务不可用，不处理任何消息
        if (!this.isAIAvailable()) {
            console.log('[AI模块] AI服务不可用，跳过处理');
            return false;
        }
        
        // 确保消息对象存在
        if (!e) {
            console.log('[AI模块] 消息对象为空，不处理');
            return false;
        }
        
        // 检查黑名单（群消息且黑名单功能启用）
        if (safeConfig.blacklist && safeConfig.blacklist.enable && 
            !e.isPrivate && e.group_id && 
            safeConfig.blacklist.groups.includes(e.group_id.toString())) {
            console.log('[AI模块] 群组在黑名单中，跳过处理');
            return false;
        }
        
        // 私聊总是回复
        if (e.isPrivate && safeConfig.triggers.always_respond_in_private) {
            console.log('[AI模块] 私聊消息，总是回复');
            return true;
        }
        
        // 被@时总是回复
        if (e.at && safeConfig.triggers.always_respond_to_mentions) {
            console.log('[AI模块] 被@提及，总是回复');
            return true;
        }
        
        // 检查消息内容
        let messageContent = '';
        if (e.msg) {
            messageContent = typeof e.msg === 'string' ? e.msg : String(e.msg);
        } else if (e.message && Array.isArray(e.message)) {
            // 尝试从消息数组中提取文本内容
            const textMessages = e.message.filter(m => m.type === 'text');
            if (textMessages.length > 0) {
                messageContent = textMessages.map(m => m.text).join(' ');
            }
        }
        
        // 呼叫名字时总是回复
        if (messageContent) {
            const calledByName = safeConfig.triggers.names.some(name => 
                messageContent.includes(name)
            );
            if (calledByName) {
                console.log('[AI模块] 被叫到名字，总是回复');
                return true;
            }
        }
        
        // 其他情况按概率回复
        const probability = e.isPrivate 
            ? safeConfig.probability.private 
            : safeConfig.probability.group;
        const shouldReply = Math.random() * 100 <= probability;
        console.log('[AI模块] 概率检查:', {isPrivate: e.isPrivate, probability, shouldReply});
        return shouldReply;
    }

    /**
     * 统一消息处理方法
     * 
     * 处理用户消息的完整流程：
     * 1. 检查AI服务可用性
     * 2. 获取用户信息和记忆
     * 3. 处理特殊消息类型（如图片）
     * 4. 构建完整提示词
     * 5. 调用AI模型生成回复
     * 6. 保存交互到记忆
     * 7. 更新用户数据
     * 
     * @param {string} message - 用户消息内容
     * @param {string} messageType - 消息类型（text/image）
     * @param {string|null} userId - 用户ID
     * @returns {object} 处理结果对象
     * @property {boolean} success - 处理是否成功
     * @property {string} reply - AI回复内容
     * @property {string} raw - 原始回复
     * @property {string} error - 错误信息（如果失败）
     * @property {string} fallback - 降级回复（如果失败）
     */
    static async processMessage(message, messageType = 'text', userId = null) {
        // 记录开始时间用于性能监控
        const startTime = Date.now();
        
        // 检查服务可用性
        if (!this.isAIAvailable()) {
            return {
                success: false,
                error: 'AI服务不可用',
                fallback: fallbackProcessor.process(message)
            };
        }
        
        try {
            // 获取用户信息（如果提供userId）
            let userContext = '';
            if (userId) {
                try {
                    const UserService = await import('./core/user.js');
                    // 获取通用用户等级信息
                    const userLevelInfo = await UserService.default.getUserLevelInfo(userId);
                    // 获取AI应用特定数据
                    const aiUserData = await UserService.default.getAIUserData(userId);
                    
                    if (userLevelInfo) {
                        userContext = `【用户信息:等级${userLevelInfo.level},角色${userLevelInfo.role},活跃:${userLevelInfo.isActive ? '是' : '否'}】\n`;
                    }
                    
                    if (aiUserData) {
                        userContext += `【AI好感度:${aiUserData.affinity},交互次数:${aiUserData.interaction_count}】\n\n`;
                    }
                } catch (userError) {
                    console.warn('[AI模块] 获取用户信息失败，继续无用户信息对话:', userError.message);
                }
            }

            // 获取用户记忆
            let memoryContext = '';
            if (userId && DatabaseManager.isConnected) {
                try {
                    const memories = await DatabaseManager.getMemories(userId);
                    if (memories.length > 0) {
                        memoryContext = `【记忆】${memories.join('; ')}\n\n`;
                    }
                } catch (memoryError) {
                    console.warn('[AI模块] 获取记忆失败，继续无记忆对话:', memoryError.message);
                }
            }

            // 特殊处理图片消息
            let imageAnalysis = '';
            if (messageType === 'image') {
                try {
                    imageAnalysis = await this.processImageMessage(message);
                    message = `图片内容: ${imageAnalysis}\n用户附加说明: ${message}`;
                } catch (error) {
                    console.error('[AI模块] 图片处理失败:', error);
                }
            }

            // 构建完整提示词
            const fullPrompt = `${config.ai.system_prompt}\n\n${userContext}${memoryContext}\n\n用户消息: ${message}`;

            console.log('[AI模块] 处理消息，长度:', fullPrompt.length);
            
            // 调用模型生成回复
            const reply = await ollama.generate(
                config.ai.ollama.model, 
                fullPrompt
            );
            
            // 记录处理时间
            const processingTime = Date.now() - startTime;
            console.log(`[AI模块] 消息处理完成，耗时: ${processingTime}ms`);
            
            // 保存交互到记忆
            if (userId && DatabaseManager.isConnected && reply) {
                try {
                    await DatabaseManager.saveMemory(
                        userId, 
                        `用户:「${message.substring(0, 50)}${message.length > 50 ? '...' : ''}」`
                    );
                    
                    // 更新AI用户数据（增加交互次数和好感度）
                    try {
                        const UserService = await import('./core/user.js');
                        const aiUserData = await UserService.default.getAIUserData(userId);
                        
                        // 增加交互次数
                        await UserService.default.updateAIUserData(userId, {
                            interaction_count: aiUserData.interaction_count + 1,
                            total_words: aiUserData.total_words + (message.length + (reply?.length || 0)),
                            last_interaction: new Date()
                        });
                        
                        // 根据回复长度增加好感度
                        const replyLength = reply?.length || 0;
                        if (replyLength > 50) {
                            await UserService.default.increaseAffinity(userId, 1); // 长回复增加1点好感度
                        } else if (replyLength > 20) {
                            await UserService.default.increaseAffinity(userId, 0.5); // 中等回复增加0.5点好感度
                        }
                        
                        console.log(`[AI模块] 用户数据更新完成，用户ID: ${userId}`);
                    } catch (userDataError) {
                        console.warn('[AI模块] 更新用户数据失败:', userDataError.message);
                    }
                } catch (error) {
                    console.warn('[AI模块] 保存记忆失败:', error.message);
                }
            }
            
            // 如果是图片消息，在回复前添加分析结果
            let finalReply = reply?.trim();
            if (messageType === 'image' && imageAnalysis) {
                finalReply = `(${imageAnalysis}) ${finalReply}`;
            }
            
            return {
                success: true,
                reply: finalReply,
                raw: reply, // 原始回复，用于不同格式处理
                processingTime: processingTime // 处理时间
            };
        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error('[AI处理错误]', error.message);
            return {
                success: false,
                error: error.message,
                fallback: fallbackProcessor.process(message),
                processingTime: processingTime
            };
        }
    }
    
    // 通用聊天方法 - 根据模式返回不同格式
    static async generalChat(message, messageType = 'text', userId = null) {
        const result = await this.processMessage(message, messageType, userId);
        
        // 中间件模式返回原始数据
        if (isMiddlewareMode) {
            return result;
        }
        
        // 云崽模式返回格式化回复
        if (result.success) {
            return result.reply;
        } else {
            return result.fallback || "处理请求时发生错误";
        }
    }
    
    // 处理图片消息
    static async processImageMessage(imageDescription) {
        try {
            const analysis = await modelRouter.processImage(imageDescription);
            return analysis;
        } catch (error) {
            console.error('[AI模块] 图片处理失败:', error);
            return "图片分析失败";
        }
    }
    
    // 初始化服务（用于中间件模式）
    static async initializeServices() {
        console.log('[AI模块] 初始化服务...');
        
        // 初始化数据库
        await DatabaseManager.connect();
        console.log('[AI模块] 数据库连接状态:', DatabaseManager.isConnected);
        
        // 初始化AI服务检测
        const available = await serviceDetector.checkOllama();
        if (available) {
            serviceDetector.startPeriodicCheck();
            serviceDetector.resetFailureCount(); // 重置失败计数
            console.log('[AI模块] AI服务可用');
        } else {
            console.log('[AI模块] AI服务不可用');
        }
        
        return available;
    }

    // 分段回复方法
    static async splitReply(e, reply) {
        const safeConfig = this.getConfig();
        const maxLength = safeConfig.reply.max_length;
        const delay = safeConfig.reply.delay_between_messages;
        
        // 首先修剪回复长度
        const trimmedReply = this.trimReply(reply, safeConfig.reply_length.max_chars);
        
        if (trimmedReply.length <= maxLength) {
            await e.reply(trimmedReply, true);
            return;
        }
        
        // 按句子分割，避免在句子中间切断
        const sentences = trimmedReply.split(/(?<=[.!?。！？])/g);
        let currentMessage = '';
        let sentMessages = 0;
        
        for (const sentence of sentences) {
            if ((currentMessage + sentence).length > maxLength && currentMessage) {
                // 发送当前积累的消息
                await e.reply(currentMessage, true);
                sentMessages++;
                currentMessage = sentence;
                
                // 检查是否达到最大消息数
                if (sentMessages >= safeConfig.reply_length.max_sentences) {
                    if (safeConfig.reply_length.trim_ellipsis && currentMessage.length > 0) {
                        await e.reply(currentMessage.substring(0, Math.min(currentMessage.length, 20)) + '...', true);
                    }
                    return;
                }
                
                // 添加延迟，避免消息过快被限制
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                currentMessage += sentence;
            }
        }
        
        // 发送最后一条消息
        if (currentMessage && sentMessages < safeConfig.reply_length.max_sentences) {
            await e.reply(currentMessage, true);
        }
    }
    
    // 修剪回复长度
    static trimReply(reply, maxLength = 120) {
        if (!reply || reply.length <= maxLength) return reply;
        
        // 查找合适的截断点（在句子结束处）
        const lastPeriod = reply.lastIndexOf('.', maxLength);
        const lastExclamation = reply.lastIndexOf('!', maxLength);
        const lastQuestion = reply.lastIndexOf('?', maxLength);
        const lastChinesePeriod = reply.lastIndexOf('。', maxLength);
        const lastChineseExclamation = reply.lastIndexOf('！', maxLength);
        const lastChineseQuestion = reply.lastIndexOf('？', maxLength);
        
        // 找到最接近maxLength且在句子结束处的位置
        const cutPoints = [lastPeriod, lastExclamation, lastQuestion, lastChinesePeriod, lastChineseExclamation, lastChineseQuestion];
        const validCutPoints = cutPoints.filter(point => point > 0 && point > maxLength * 0.7);
        
        if (validCutPoints.length > 0) {
            const cutPoint = Math.max(...validCutPoints);
            return reply.substring(0, cutPoint + 1);
        }
        
        // 如果没有合适的句子结束点，直接截断并添加省略号
        return reply.substring(0, maxLength - 3) + '...';
    }

    // 重置用户记忆方法（管理员功能）
    static async resetUserMemory(userId) {
        if (!DatabaseManager.isConnected) {
            return "数据库未连接，无法重置记忆";
        }
        
        try {
            const success = await DatabaseManager.resetUserMemories(userId);
            return success ? 
                `✅ 已重置用户 ${userId} 的记忆` : 
                `❌ 重置用户 ${userId} 的记忆失败`;
        } catch (error) {
            console.error('[AI模块] 重置记忆失败:', error);
            return `❌ 重置记忆时发生错误: ${error.message}`;
        }
    }
}

export { AIManager };