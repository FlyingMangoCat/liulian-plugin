import axios from 'axios';

// 本地接入
export default class LocalProvider {
    constructor(config = {}) {
        this.apiUrl = config.api_url || 'http://localhost:11434';
        this.timeout = config.timeout || 30000;
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
                repeat_penalty: options.repeat_penalty || 1.1,
                ...options
            }
        }, {
            timeout: options.timeout || this.timeout
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
                num_predict: options.num_predict || 1000,
                top_p: options.top_p || 0.9,
                repeat_penalty: options.repeat_penalty || 1.1,
                ...options
            }
        }, {
            timeout: options.timeout || this.timeout
        });

        return response.data.message.content;
    }

    async generateWithImage(model, prompt, image, options = {}) {
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
