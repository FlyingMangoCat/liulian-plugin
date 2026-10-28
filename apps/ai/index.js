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
// 开关判定每次现读（切换无需重启）；componentsLoaded 只防组件重复注入
// （checkService 是网络探测、startPeriodicCheck 是定时器，跑一次+周期刷新即可）
let componentsLoaded = false;

async function initializeServices() {
  if (componentsLoaded) return;
  // 未开启：直接返回且不标记 —— 开关注入后下一条消息自然进入加载
  if (Cfg.get('sys.aiEnabled', false) !== true) return;
  componentsLoaded = true;

  try {
    console.log('[AI模块] AI功能已开启，初始化相关组件');

    // 云崽模式下才自动初始化服务
    serviceDetector.checkService().then(available => {
      if (available) {
        serviceDetector.startPeriodicCheck();
      } else {
        console.log('[AI模块] AI服务探测未通过（有接口配置时实际请求仍会兜底）');
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
  } catch (error) {
    console.error('[AI模块] 初始化失败:', error);
    componentsLoaded = false; // 失败允许下次重试
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
    // 云大脑模式例外：可用性由后端负责，本地服务探测不挡路（失败本来就是静默语义）
    if ((config.ai?.brain?.mode || 'local') !== 'cloud' && !this.isAIAvailable()) {
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
            
            // 注入双层上下文（远期摘要 + 近期目录）：作为 contextBlock 交由 buildPrompt
            // 拼进 system 背景区，user 消息保持纯净——目录混在 user 消息里会被模型当正文复述
            const userMessage = message;

            // 调用模型路由器
            const result = await modelRouter.processMessage(message, messageType, {
                memories: memoryContext ? memories : [],
                contextBlock: contextText || ''
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
        
        // 云崽模式返回格式化回复；失败返回 null（上层按静默放行处理，绝不把错误文本发到群里）
        if (result.success) {
            return result.reply;
        } else {
            console.error('[AI模块] 对话失败(静默):', result.error || '模型处理失败');
            return null;
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

    // 分段回复方法：句号只当切分点不当内容（人类打字很少用句号，切完删掉），
    // 长回复按句切分分条发送，绝不整体截断
    static async splitReply(e, reply) {
        const safeConfig = this.getConfig();
        const maxLength = safeConfig.reply.max_length;
        const delay = safeConfig.reply.delay_between_messages;

        // 换行 = 模型想连发几条的表达方式：先按换行拆成独立 burst，
        // 每条 burst 内部再按句号切成句（删句号）分批发；超长单句按字数硬切兜底
        const bursts = String(reply).split(/\n+/).map(s => s.trim()).filter(Boolean);
        for (const burst of bursts) {
            const sentences = burst.split(/(?<=[。])/)
                .map(s => s.replace(/。/g, ''))
                .flatMap(s => s.length > maxLength ? s.match(new RegExp(`.{1,${maxLength}}`, 'g')) : [s])
                .filter(s => s && s.trim());

            let currentMessage = '';
            for (const sentence of sentences) {
                if ((currentMessage + sentence).length > maxLength && currentMessage) {
                    await e.reply(currentMessage, true);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    currentMessage = '';
                }
                currentMessage += sentence;
            }

            if (currentMessage.trim()) {
                await e.reply(currentMessage, true);
            }
        }
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