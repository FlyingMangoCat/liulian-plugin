import axios from 'axios';

// 通用接口接入
export default class ApiProvider {
    constructor(config = {}) {
        this.baseUrl = config.base_url || '';
        this.apiKey = config.api_key || '';
        this.timeout = config.timeout || 30000;
    }

    async chat(model, messages, options = {}) {
        const response = await axios.post(`${this.baseUrl}/chat/completions`, {
            model: model,
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.num_predict || 1000,
            top_p: options.top_p || 0.9,
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: options.timeout || this.timeout
        });

        return response.data?.choices?.[0]?.message?.content;
    }

    async generate(model, prompt, options = {}) {
        return this.chat(model, [{ role: 'user', content: prompt }], options);
    }

    async generateWithImage(model, prompt, image, options = {}) {
        const content = [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${image}` } }
        ];
        return this.chat(model, [{ role: 'user', content }], options);
    }

    async listModels() {
        const response = await axios.get(`${this.baseUrl}/models`, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
            timeout: this.timeout
        });
        return (response.data?.data || []).map(m => ({ name: m.id }));
    }

    async pullModel() {
        return { done: true };
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
