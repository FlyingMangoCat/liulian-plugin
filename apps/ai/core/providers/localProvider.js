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
            // 思考型模型（qwen3 等）默认先输出思考段，200 token 全烧在推理里正文为空；
            // 显式关思考直接出正文（注：换非思考模型时此行可删，ollama 对不支持的模型会 400）
            think: false,
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
        // 思考型模型（qwen3 等）：推理过程在 message.thinking 单独字段，content 只有正文；
        // content 为空说明生成额度全烧在思考里，一行没写正文
        if (d.message?.thinking && !d.message?.content) {
            console.log('[榴莲AI] 输出全是思考过程无正文（思考头30字）:', String(d.message.thinking).substring(0, 30));
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
