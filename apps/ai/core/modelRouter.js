import provider from '#liulian.provider';
import config from '#liulian.config';

export class ModelRouter {
    // 模型表每次现读（配置即改即生效，不再有导入时快照）
    get models() {
        return this.getModels();
    }

    // 获取当前生效的模型配置（通用接口优先；api 模式下缺失项用 api.model 主字段兜底，
    // 绝不回退到 ollama 的模型名 —— 之前会静默拼出 deepseek-llm:7b 之类不存在的模型）
    getModels() {
        const apiCfg = config.ai?.api || {};
        const apiModels = apiCfg.models || {};
        const localModels = config.ai?.local?.models || {
            general: 'deepseek-llm:7b',
            code: 'deepseek-coder:6.7b',
            vision: 'moondream:latest'
        };

        if (apiCfg.base_url && apiCfg.api_key) {
            const fallback = apiCfg.model || '';
            return {
                general: apiModels.general || fallback,
                code: apiModels.code || fallback,
                vision: apiModels.vision || fallback
            };
        }
        return localModels;
    }

    async processMessage(message, messageType = 'text', context = {}) {
        try {
            // 选择合适的模型
            const model = this.selectModel(message, messageType, context);

            // 构建系统提示词（用户消息单独走 user 角色）
            const system = this.buildPrompt(message, context);

            // 走对话端点（/api/chat 会套模型的对话模板）。不能用 raw /api/generate：
            // 纯文本补全会把注入的聊天目录当正文续写，之前"回复=聊天目录"就是它干的
            const response = await provider.chat(model, [
                { role: 'system', content: system },
                { role: 'user', content: message }
            ], {
                temperature: this.getTemperature(message, context),
                num_predict: this.getMaxTokens(message)
            });

            return {
                success: true,
                response: response,
                model: model,
                metadata: {
                    messageType,
                    responseLength: String(response || '').length
                }
            };
            
        } catch (error) {
            console.error('[ModelRouter] 处理消息失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async processImage(imageDescription, image) {
        try {
            const model = this.models.vision;
            
            const prompt = `请描述这张图片的内容。${imageDescription ? '用户说明：' + imageDescription : ''}`;
            
            const response = await provider.generateWithImage(model, prompt, image);
            
            return {
                success: true,
                response: response,
                model: model
            };
            
        } catch (error) {
            console.error('[ModelRouter] 处理图片失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    selectModel(message, messageType, context) {
        // 图像消息使用视觉模型
        if (messageType === 'image') {
            return this.models.vision;
        }

        // 代码相关使用代码模型
        const codeKeywords = ['代码', '编程', '函数', '算法', 'bug', '```', 'javascript', 'python', 'java'];
        const hasCodeKeywords = codeKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );

        if (hasCodeKeywords && this.models.code) {
            return this.models.code;
        }

        // 默认使用通用模型
        return this.models.general;
    }

    buildPrompt(message, context) {
        let prompt = config.ai?.system_prompt || '你是榴莲，一个活泼开朗的AI助手。';

        // 添加用户上下文
        if (context.memories && context.memories.length > 0) {
            prompt += '\n\n【最近记忆】';
            context.memories.slice(0, 3).forEach((memory, index) => {
                prompt += `\n${index + 1}. ${memory}`;
            });
        }

        if (context.resonanceLevel && context.resonanceLevel !== 'NEUTRAL') {
            prompt += `\n\n【关系状态】用户与你的好感度等级：${context.resonanceLevel}`;
        }

        // 近期记录放 system 背景区：user 消息保持纯净，模型最后一眼是那句话本身
        if (context.contextBlock) {
            prompt += `\n\n【近期群聊记录（仅供了解话题背景）】\n${context.contextBlock}`;
        }

        prompt += `\n\n【回复要求】简短口语化，一两句话以内，别长篇大论，别铺垫。`;
        prompt += `\n【说话风格】像真人打字：基本不用句号，标点随意（可以整句不带标点），长短句交错，偶尔用语气词收尾，别每条都结构完整。`;
        // 近期记录/取阅/沉默相关规则只在真的注入了记录时才给——指向不存在内容的规则是纯噪音
        if (context.contextBlock) {
            prompt += `\n【对话规则】上面的近期记录仅供了解话题背景，禁止复述或续写其中的文字；需要某条完整原文时可以只回复 [查看 #编号]（仅限一次）；判断此刻不该接话就回复 [沉默]；其余情况直接用你自己的话回复。`;
        }
        // 翻旧账要有旧事可翻（记忆/记录注入）才有意义
        if (context.contextBlock || (context.memories && context.memories.length > 0)) {
            prompt += `\n【翻旧账】确实记得对方或群友之前说过的事、梗、恩怨时，可以自然顺嘴提一句（一条回复最多提一件）；不确定是否发生过的旧事绝不要编造。`;
        }
        prompt += `\n【输出格式】只输出回复正文本身：禁止【回复】、[回复] 之类任何前缀标记，禁止用引号把整条回复包起来，禁止任何说明性文字。`;

        return prompt;
    }

    getTemperature(message, context) {
        // 温度抖动：每条消息随机取值，回复间松紧自然波动
        let t = 0.55 + Math.random() * 0.25;
        // 情绪导向：消息带明显情绪词时定向偏移（开心上浮更放飞，生气下沉更收敛），夹在安全区间
        if (message.includes('开心') || message.includes('高兴')) t += 0.08;
        else if (message.includes('生气') || message.includes('讨厌')) t -= 0.08;
        return +Math.max(0.45, Math.min(0.8, t)).toFixed(2);
    }

    getMaxTokens(message) {
        // 生成上限只做兜底（1000 token 约 600 字），不再按消息长度算——
        // 长回复由 splitReply 按句分条发送，绝不会写到一半被掐断
        return 1000;
    }

    async getAvailableModels() {
        try {
            const models = await provider.listModels();
            return models.map(m => m.name);
        } catch (error) {
            console.error('[ModelRouter] 获取可用模型失败:', error);
            return Object.values(this.models);
        }
    }
}

export default new ModelRouter();