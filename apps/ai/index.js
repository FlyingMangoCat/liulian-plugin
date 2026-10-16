import { ModelRouter } from './core/modelRouter.js';
import serviceDetector from './core/serviceDetector.js';
import memoryService from './core/memoryService.js';
import config from '#liulian.config';
import { Cfg } from '#liulian';
import * as chatState from '#liulian.chatState';

// 环境检测
const isMiddlewareMode = process.env.LIULIAN_MODE === 'middleware';

// 初始化服务
const modelRouter = new ModelRouter();

// 服务初始化 - 延迟到第一次使用时再执行，避免导入时阻塞
let initialized = false;
let initializing = false;

async function initializeServices() {
  if (initialized || initializing) return;
  initializing = true;

  try {
    // 检查AI功能是否开启
    const isAIEnabled = Cfg.get('liulian.ai.enabled', false);
    
    if (isAIEnabled) {
      console.log('[AI模块] AI功能已开启，开始初始化相关组件');
      
      // 云崽模式下才自动初始化服务
      serviceDetector.checkService().then(available => {
        if (available) {
          serviceDetector.startPeriodicCheck();
        } else {
          console.log('[AI模块] AI服务不可用，将禁用AI功能');
        }
      }).catch(error => {
        console.error('[AI模块] AI服务检测失败:', error);
      });
      
      // 记忆服务无需本地连接，按 config.ai.memory 配置决定是否启用
      const memStatus = memoryService.getStatus();
      console.log(`[AI模块] 记忆服务模式: ${memStatus.mode}${memStatus.available ? '（可用）' : '（未启用）'}`);

      // 注入决策模块的处理器：远期摘要走通用模型，图片/表情包描述走视觉模型前置
      chatState.setProcessors({
        summarize: async (text) => {
          try {
            const r = await modelRouter.processMessage(
              `请把以下群聊记录压缩成150字以内的摘要，保留话题、人物关系和未决问题，去掉寒暄，只输出摘要本身：\n${text}`,
              'text', null
            );
            return r.success ? r.response : '';
          } catch { return ''; }
        },
        describeImage: async (url, hint) => {
          try {
            const r = await modelRouter.processImage(hint || '', url);
            return r.success ? r.response : '';
          } catch { return ''; }
        }
      });
    } else {
      console.log('[AI模块] AI功能已关闭，跳过相关组件加载');
    }
    
    initialized = true;
  } catch (error) {
    console.error('[AI模块] 初始化失败:', error);
  } finally {
    initializing = false;
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
        
        // 检查黑名单群组（config/ai.js 唯一真源：ai.blacklist.groups + enable 开关）
        const blacklistCfg = config.ai?.blacklist || { groups: [], enable: false };
        const blacklistGroups = blacklistCfg.enable ? (blacklistCfg.groups || []) : [];
        if (!e.isPrivate && e.group_id && 
            blacklistGroups.map(String).includes(e.group_id.toString())) {
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
        
        // 呼叫名字时总是回复（计入额度，防刷屏）
        if (messageContent) {
            const calledByName = safeConfig.triggers.names.some(name => 
                messageContent.includes(name)
            );
            if (calledByName) {
                console.log('[AI模块] 被叫到名字，总是回复');
                try { chatState.markForced(e); } catch {}
                return true;
            }
        }
        
        // 其他情况：评分 + 额度门控 + 空闲退避（chatState，零 token 本地决策）
        const decision = chatState.shouldAutoReply(e);
        console.log('[AI模块] 决策结果:', JSON.stringify(decision));
        return !!decision.ok;
    }

// 统一消息处理方法
    static async processMessage(message, messageType = 'text', userId = null, imageUrl = null, contextText = null) {
        // 检查服务可用性
        if (!this.isAIAvailable()) {
            return {
                success: false,
                error: 'AI服务不可用'
            };
        }
        
        try {
            // 获取用户记忆（memories 声明提到 try 外，避免下方引用时跨作用域报错）
            let memoryContext = '';
            let memories = [];
            if (userId && memoryService.isEnabled()) {
                try {
                    memories = await memoryService.getMemories(userId);
                    if (memories.length > 0) {
                        memoryContext = `【记忆】${memories.join('; ')}\n\n`;
                    }
                } catch (memoryError) {
                    console.log('[AI模块] 获取记忆失败，继续无记忆对话');
                }
            }

            // 获取用户好感度
            let resonanceContext = '';
            if (userId && memoryService.isEnabled()) {
                try {
                    const userResonance = await memoryService.getUserResonance(userId);
                    if (userResonance && userResonance.level !== 'NEUTRAL') {
                        resonanceContext = `【关系状态】好感度等级：${userResonance.level}\n`;
                    }
                } catch (error) {
                    console.log('[AI模块] 获取用户状态失败，继续无状态对话');
                }
            }

            // 特殊处理图片消息（imageUrl 为图片地址，message 为用户文字说明）
            let imageAnalysis = '';
            if (messageType === 'image') {
                try {
                    imageAnalysis = await this.processImageMessage(imageUrl, message);
                    message = `${imageAnalysis ? `图片内容: ${imageAnalysis}\n` : ''}用户附加说明: ${message || '（无文字）'}`;
                } catch (error) {
                    console.error('[AI模块] 图片处理失败:', error);
                }
            }

            // 构建完整提示词
            const fullPrompt = `${config.ai.system_prompt}

${resonanceContext}
${memoryContext}

用户消息: ${message}`;

            console.log('[AI模块] 处理消息，长度:', fullPrompt.length);
            
            // 注入双层上下文（远期摘要 + 近期目录 + 沉默/取阅规则），让核心模型看到会话脉络
            // 注意：保留原始用户消息，记忆保存要用它而不是注入后的长文本
            const userMessage = message;
            if (contextText) {
                message = `${contextText}\n\n=========\n用户消息: ${message}`;
            }

            // 调用模型路由器
            const result = await modelRouter.processMessage(message, messageType, {
                memories: memoryContext ? memories : []
            });
            
            if (result.success) {
                // 保存交互到记忆
                if (userId && memoryService.isEnabled() && result.response) {
                    try {
                        await memoryService.saveMemory(
                            userId,
                            `用户:「${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}」`
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
    static async generalChat(message, messageType = 'text', userId = null, imageUrl = null, contextText = null) {
        const result = await this.processMessage(message, messageType, userId, imageUrl, contextText);
        
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
    
    // 处理图片消息（image 为图片 URL 或 base64，description 为用户文字说明）
    static async processImageMessage(image, description = '') {
        try {
            if (!image) {
                return "";
            }
            const analysis = await modelRouter.processImage(description, image);
            return analysis.response || "图片分析完成";
        } catch (error) {
            console.error('[AI模块] 图片处理失败:', error);
            return "图片分析失败";
        }
    }
    
    // 初始化服务（用于中间件模式）
    static async initializeServices() {
        console.log('[AI模块] 初始化服务...');
        
        // 记忆服务无需本地连接，按 config.ai.memory 配置决定是否启用
        const memStatus = memoryService.getStatus();
        console.log(`[AI模块] 记忆服务模式: ${memStatus.mode}${memStatus.available ? '（可用）' : '（未启用）'}`);
        
        // 初始化AI服务检测
        const available = await serviceDetector.checkService();
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
        if (!memoryService.isEnabled()) {
            return "记忆服务未启用，无法重置记忆";
        }
        
        try {
            const success = await memoryService.resetUserMemories(userId);
            return success ? 
                `✅ 已重置用户 ${userId} 的记忆` : 
                `❌ 重置用户 ${userId} 的记忆失败`;
        } catch (error) {
            console.error('[AI模块] 重置记忆失败:', error);
            return `❌ 重置记忆时发生错误: ${error.message}`;
        }
    }
}

export { AIManager, initializeServices };