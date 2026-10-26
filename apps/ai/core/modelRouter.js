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

        return prompt;
    }

    getTemperature(message, context) {
        let temperature = 0.7;

        // 根据消息内容调整
        if (message.includes('开心') || message.includes('高兴')) {
            temperature += 0.1;
        } else if (message.includes('生气') || message.includes('讨厌')) {
            temperature -= 0.1;
        }

        return Math.max(0.1, Math.min(1.0, temperature));
    }

    getMaxTokens(message) {
        if (message.length > 200) {
            return 2000;
        } else if (message.length > 100) {
            return 1000;
        } else {
            return 500;
        }
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