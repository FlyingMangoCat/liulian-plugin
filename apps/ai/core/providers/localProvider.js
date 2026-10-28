import axios from 'axios';

// 本地接入
// 注意：推理请求不带超时 —— 本机 ollama 冷启动/CPU 生成耗时不定，
// 和最初版一致无限等待，绝不在半路掐断（掐断的表现就是"压根没反应"）
export default class LocalProvider {
    constructor(config = {}) {
        this.apiUrl = config.api_url || 'http://localhost:11434';
    }

    async generate(model, prompt, options = {}) {
        const response = await axios.post(`${this.apiUrl}/api/generate`, {
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: options.temperature || 0.7,
                num_predict: options.num_predict || 1000,
                top_p: options.top_p || 0.9,
                repeat_penalty: 1.1
            }
        });

        return response.data.response;
    }

    async chat(model, messages, options = {}) {
        const response = await axios.post(`${this.apiUrl}/api/chat`, {
            model: model,
            messages: messages,
            stream: false,
            options: {
                temperature: options.temperature || 0.7,
                // 输出上限：格式要求两句话以内，1000 只会让不出结束符的基座模型呓语 5 分钟
                num_predict: options.num_predict || 200,
                // 上下文窗口：ollama 默认只有 2048，人设+目录一超就从开头截断，
                // 模型拿到残缺提示词输出崩坏（此前"一开上下文就没反应"的根因）
                num_ctx: Number(options.num_ctx) || 8192,
                top_p: options.top_p || 0.9,
                repeat_penalty: 1.1
            }
        });

        // ollama 响应自带 token 统计：prompt_eval_count=读题消耗，eval_count=生成消耗
        const d = response.data || {};
        if (d.eval_count || d.prompt_eval_count) {
            console.log(`[榴莲AI] token: 读题 ${d.prompt_eval_count || 0} + 生成 ${d.eval_count || 0}`);
        }
        return d.message.content;
    }

    async generateWithImage(model, prompt, image, options = {}) {
        const response = await axios.post(`${this.apiUrl}/api/generate`, {
            model: model,
            prompt: prompt,
            images: [image],
            stream: false,
            options: {
                temperature: options.temperature || 0.7,
                num_predict: options.num_predict || 1000
            }
        });

        return response.data.response;
    }

    async listModels() {
        const response = await axios.get(`${this.apiUrl}/api/tags`);
        return response.data.models;
    }

    async pullModel(model) {
        const response = await axios.post(`${this.apiUrl}/api/pull`, {
            model: model
        }, {
            timeout: 300000
        });

        return response.data;
    }

    async isModelAvailable(model) {
        try {
            const models = await this.listModels();
            return models.some(m => m.name === model);
        } catch (error) {
            return false;
        }
    }
}
