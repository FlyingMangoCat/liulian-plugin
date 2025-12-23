import axios from 'axios';
import config from '../../config/ai.js';

export class OllamaHandler {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.timeout = config.ai?.performance?.max_image_processing_time || 10000;
    }

    async generate(model, prompt, options = {}) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.7,
                    num_predict: options.num_predict || 1000,
                    top_p: options.top_p || 0.9,
                    repeat_penalty: options.repeat_penalty || 1.1,
                    ...options
                }
            }, {
                timeout: options.timeout || this.timeout
            });

            return response.data.response;
        } catch (error) {
            console.error('[Ollama] 生成失败:', error.message);
            throw new Error(`Ollama调用失败: ${error.message}`);
        }
    }

    async chat(model, messages, options = {}) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/chat`, {
                model: model,
                messages: messages,
                stream: false,
                options: {
                    temperature: options.temperature || 0.7,
                    num_predict: options.num_predict || 1000,
                    top_p: options.top_p || 0.9,
                    repeat_penalty: options.repeat_penalty || 1.1,
                    ...options
                }
            }, {
                timeout: options.timeout || this.timeout
            });

            return response.data.message.content;
        } catch (error) {
            console.error('[Ollama] 聊天失败:', error.message);
            throw new Error(`Ollama聊天失败: ${error.message}`);
        }
    }

    async generateWithImage(model, prompt, image, options = {}) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/generate`, {
                model: model,
                prompt: prompt,
                images: [image],
                stream: false,
                options: {
                    temperature: options.temperature || 0.7,
                    num_predict: options.num_predict || 1000,
                    ...options
                }
            }, {
                timeout: options.timeout || this.timeout
            });

            return response.data.response;
        } catch (error) {
            console.error('[Ollama] 图像生成失败:', error.message);
            throw new Error(`Ollama图像生成失败: ${error.message}`);
        }
    }

    async listModels() {
        try {
            const response = await axios.get(`${this.apiUrl}/api/tags`);
            return response.data.models;
        } catch (error) {
            console.error('[Ollama] 获取模型列表失败:', error.message);
            throw new Error(`获取模型列表失败: ${error.message}`);
        }
    }

    async pullModel(model) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/pull`, {
                model: model
            }, {
                timeout: 300000 // 5分钟超时
            });

            return response.data;
        } catch (error) {
            console.error('[Ollama] 拉取模型失败:', error.message);
            throw new Error(`拉取模型失败: ${error.message}`);
        }
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

export default new OllamaHandler(config.ai?.ollama?.api_url || 'http://localhost:11434');