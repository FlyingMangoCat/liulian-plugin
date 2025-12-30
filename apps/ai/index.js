import { OllamaHandler } from './ollama.js';
import { ModelRouter } from './core/modelRouter.js';
import serviceDetector from './core/serviceDetector.js';
import DatabaseManager from './core/database.js';
import moodSystem from './core/moodSystem.js';
import config from '../../config/ai.js';
import Cfg from '#liulian';

// 环境检测
const isMiddlewareMode = process.env.LIULIAN_MODE === 'middleware';

// 初始化服务
const ollama = new OllamaHandler(config.ai.ollama.api_url);
const modelRouter = new ModelRouter();

// 服务初始化 - 只有AI功能开启时才加载相关组件
if (!isMiddlewareMode) {
    // 检查AI功能是否开启 - liulian.ai.enabled是AI服务总开关，不是购买提示(sys.aits)
    const isAIEnabled = Cfg.get('liulian.ai.enabled', false);
    
    if (isAIEnabled) {
        console.log('[AI模块] AI功能已开启，开始初始化相关组件');
        
        // 云崽模式下才自动初始化服务
        serviceDetector.checkOllama().then(available => {
            if (available) {
                serviceDetector.startPeriodicCheck();
            } else {
                console.log('[AI模块] AI服务不可用，将禁用AI功能');
            }
        }).catch(error => {
            console.error('[AI模块] AI服务检测失败:', error);
        });
        
        // 启动数据库连接（添加错误处理）
        console.log('[AI模块] 初始化数据库连接');
        DatabaseManager.connect().then(() => {
            console.log('[AI模块] 数据库连接状态:', DatabaseManager.isConnected);
            
            // 初始化情绪系统
            try {
                moodSystem.initialize();
            } catch (error) {
                console.error('[AI模块] 情绪系统初始化失败:', error);
            }
        }).catch(error => {
            console.error('[AI模块] 数据库连接失败:', error);
            console.log('[AI模块] AI功能将在没有数据库的情况下运行');
        });
        
        // 启动情绪处理定时任务（每分钟检查一次，添加错误处理）
        setInterval(() => {
            try {
                moodSystem.processMoodEffects();
            } catch (error) {
                console.error('[AI模块] 情绪处理失败:', error);
            }
        }, 60000);
    } else {
        console.log('[AI模块] AI功能已关闭，跳过相关组件加载');
    }
}

class AIManager {
    // 添加服务状态检查
    static isAIAvailable() {
        return serviceDetector.isServiceAvailable();
    }

    // 获取服务状态报告
    static getServiceStatus() {
        return serviceDetector.getStatusReport();
    }

    // 添加配置安全检查方法
    static getConfig() {
        // 确保配置结构完整，提供默认值
        return {
            triggers: config.ai?.triggers || {
                names: ["榴莲", "小莲", "莲莲"],
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

    // 修改概率检查方法，添加黑名单检查
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
        
        // 检查黑名单群组（从Cfg系统读取）
        const blacklistGroups = Cfg.get('liulian.blacklist.groups', []);
        if (!e.isPrivate && e.group_id && 
            blacklistGroups.includes(e.group_id.toString())) {
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

// 统一消息处理方法
    static async processMessage(message, messageType = 'text', userId = null) {
        // 检查服务可用性
        if (!this.isAIAvailable()) {
            return {
                success: false,
                error: 'AI服务不可用'
            };
        }
        
        try {
            // 更新用户情绪
            if (userId) {
                await moodSystem.updateUserMood(userId, message);
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
                    console.log('[AI模块] 获取记忆失败，继续无记忆对话');
                }
            }

            // 获取用户情绪和好感度
            let moodContext = '';
            let resonanceContext = '';
            if (userId && DatabaseManager.isConnected) {
                try {
                    const userMood = await moodSystem.getUserMood(userId);
                    const userResonance = await DatabaseManager.getUserResonance(userId);
                    
                    if (userMood && userMood.mood !== 'neutral') {
                        moodContext = `【情绪状态】当前情绪：${userMood.mood}，强度：${userMood.intensity}\n`;
                    }
                    
                    if (userResonance && userResonance.level !== 'NEUTRAL') {
                        resonanceContext = `【关系状态】好感度等级：${userResonance.level}\n`;
                    }
                } catch (error) {
                    console.log('[AI模块] 获取用户状态失败，继续无状态对话');
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
            const fullPrompt = `${config.ai.system_prompt}

${moodContext}
${resonanceContext}
${memoryContext}

用户消息: ${message}`;

            console.log('[AI模块] 处理消息，长度:', fullPrompt.length);
            
            // 调用模型路由器
            const result = await modelRouter.processMessage(message, messageType, {
                memories: memoryContext ? memories : []
            });
            
            if (result.success) {
                // 保存交互到记忆
                if (userId && DatabaseManager.isConnected && result.response) {
                    try {
                        await DatabaseManager.saveMemory(
                            userId, 
                            `用户:「${message.substring(0, 50)}${message.length > 50 ? '...' : ''}」`
                        );
                    } catch (error) {
                        console.log('[AI模块] 保存记忆失败');
                    }
                }
                
                return {
                    success: true,
                    reply: result.response,
                    raw: result
                };
            } else {
                throw new Error(result.error || '模型处理失败');
            }
            
        } catch (error) {
            console.error('[AI处理错误]', error.message);
            return {
                success: false,
                error: error.message
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
            return analysis.response || "图片分析完成";
        } catch (error) {
            console.error('[AI模块] 图片处理失败:', error);
            return "图片分析失败";
        }
    }
    
    // 初始化服务（用于中间件模式）
    static async initializeServices() {
        console.log('[AI模块] 初始化服务...');
        
        // 启动数据库连接
        console.log('[AI模块] 初始化数据库连接');
        DatabaseManager.connect().then(() => {
            console.log('[AI模块] 数据库连接状态:', DatabaseManager.isConnected);
        });
        
        // 初始化AI服务检测
        const available = await serviceDetector.checkOllama();
        if (available) {
            serviceDetector.startPeriodicCheck();
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
        
        const cutPoint = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (cutPoint > 0 && cutPoint > maxLength * 0.7) {
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