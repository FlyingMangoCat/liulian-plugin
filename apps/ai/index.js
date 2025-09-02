import { OllamaHandler } from './ollama.js';
import { ModelRouter } from './core/modelRouter.js';
import serviceDetector from './core/serviceDetector.js';
import fallbackProcessor from './core/fallbackProcessor.js';
import DatabaseManager from './core/database.js'; // 新增导入
import config from '../../config/ai.js';

// 初始化Ollama处理器 - 使用配置中的URL
const ollama = new OllamaHandler(config.ai.ollama.api_url);
const modelRouter = new ModelRouter();

// 启动服务检测
serviceDetector.checkOllama().then(available => {
    if (available) {
        serviceDetector.startPeriodicCheck();
    } else {
        console.log('[AI模块] AI服务不可用，将禁用AI功能');
    }
});

// 启动数据库连接
console.log('[AI模块] 初始化数据库连接');
DatabaseManager.connect().then(() => {
    console.log('[AI模块] 数据库连接状态:', DatabaseManager.isConnected);
});

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

    // 修改通用聊天方法，添加服务可用性检查和降级处理
    static async generalChat(message, messageType = 'text', userId = null) {
        // 检查服务可用性
        if (!this.isAIAvailable()) {
            console.log('[AI模块] AI服务不可用，使用降级处理');
            return fallbackProcessor.process(message);
        }
        
        try {
            // 获取用户记忆
            let memoryContext = '';
            if (userId && DatabaseManager.isConnected) {
                const memories = await DatabaseManager.getMemories(userId);
                if (memories.length > 0) {
                    memoryContext = `【过往记忆】\n${memories.join('\n')}\n\n`;
                }
            }

            // 特殊处理图片消息
            let imageAnalysis = '';
            if (messageType === 'image') {
                // 调用图像处理器获取分析结果
                imageAnalysis = await this.processImageMessage(message);
                // 将分析结果加入提示词
                message = `图片内容: ${imageAnalysis}\n用户附加说明: ${message}`;
            }

            // 构建完整提示词
            const fullPrompt = `${config.ai.system_prompt}

${memoryContext}

用户消息: ${message}`;

            console.log('[AI模块] 带记忆上下文的提示词构建完成');
            
            // 调用模型生成回复
            const reply = await ollama.generate(
                config.ai.ollama.model, 
                fullPrompt
            );

            // 保存有价值的交互到记忆
            if (userId && DatabaseManager.isConnected) {
                if (this.isWorthRemembering(message, reply)) {
                    await DatabaseManager.saveMemory(
                        userId, 
                        `用户说:「${message}」, 我回复:「${reply}」`
                    );
                }
            }

            // 如果是图片消息，在回复前添加分析结果
            let finalReply = reply?.trim();
            if (messageType === 'image' && imageAnalysis) {
                finalReply = `(${imageAnalysis}) ${finalReply}`;
            }

            return finalReply;
        } catch (error) {
            console.error('[AI处理错误]', error.message);
            return fallbackProcessor.process(message);
        }
    }

    // 处理图片消息
    static async processImageMessage(imageDescription) {
        try {
            // 使用专用处理器分析图片
            const analysis = await modelRouter.processImage(imageDescription);
            return analysis;
        } catch (error) {
            console.error('[AI模块] 图片处理失败:', error);
            return "图片分析失败";
        }
    }

    // 判断是否值得记忆
    static isWorthRemembering(userMessage, botReply) {
        // 简单策略：记住涉及偏好、重要事实或情感强烈的交流
        const keywords = ['喜欢', '讨厌', '爱', '恨', '想要', '梦想', '害怕', '生日', '记得'];
        return keywords.some(keyword => userMessage.includes(keyword)) || botReply.length > 50;
    }

    // 修改主处理函数调用
    static async handleMessage(e, messageContent, messageType) {
        // 原有的概率检查、黑名单检查等逻辑完全不变

        // 在准备回复时，调用增强的generalChat，传入用户ID
        const reply = await this.generalChat(
            messageContent, 
            messageType, 
            e.user_id?.toString()
        );

        // 后续的分段回复逻辑保持不变
        return reply;
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