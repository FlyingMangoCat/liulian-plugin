/**
 * Ollama处理器 - 处理与Ollama服务的通信
 * 
 * 该模块负责：
 * 1. 与Ollama API的通信
 * 2. 消息格式化和预处理
 * 3. 错误处理和重试机制
 * 4. 请求限流控制
 */

import fetch from 'node-fetch';

class OllamaHandler {
    /**
     * 构造函数
     * @param {string} apiUrl - Ollama API的URL
     */
    constructor(apiUrl = 'http://localhost:11434/api') {
        this.apiUrl = apiUrl;
        this.requestQueue = [];
        this.isProcessing = false;
        // 请求间隔限制（毫秒）
        this.requestDelay = 1000;
    }

    /**
     * 生成AI回复
     * 
     * 向Ollama服务发送请求并获取AI生成的回复
     * 实现请求队列和限流控制，避免请求过于频繁
     * 
     * @param {string} model - 使用的模型名称
     * @param {string} prompt - 输入提示词
     * @param {object} options - 生成选项（可选）
     * @returns {Promise<string>} AI生成的回复
     */
    async generate(model, prompt, options = {}) {
        const request = {
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: options.temperature || 0.7,
                top_p: options.top_p || 0.9,
                max_tokens: options.max_tokens || 500,
                ...options
            }
        };

        return new Promise((resolve, reject) => {
            this.requestQueue.push({ request, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * 处理请求队列
     * 
     * 实现请求的顺序处理和限流控制
     * 防止同时发送过多请求导致服务过载
     */
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        while (this.requestQueue.length > 0) {
            const { request, resolve, reject } = this.requestQueue.shift();
            
            try {
                const response = await fetch(`${this.apiUrl}/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                resolve(data.response);
            } catch (error) {
                console.error('[Ollama] 请求失败:', error.message);
                reject(error);
            }

            // 请求间隔，避免过于频繁
            await this.delay(this.requestDelay);
        }

        this.isProcessing = false;
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} 延迟Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 检查模型是否存在
     * 
     * 查询Ollama服务以确认指定模型是否可用
     * 用于在生成回复前验证模型状态
     * 
     * @param {string} model - 模型名称
     * @returns {Promise<boolean>} 模型是否存在
     */
    async checkModel(model) {
        try {
            const response = await fetch(`${this.apiUrl}/tags`);
            const data = await response.json();
            
            if (data.models) {
                return data.models.some(m => m.name.includes(model));
            }
            return false;
        } catch (error) {
            console.error('[Ollama] 检查模型失败:', error.message);
            return false;
        }
    }

    /**
     * 获取模型列表
     * 
     * 从Ollama服务获取所有可用的模型列表
     * 用于模型选择和状态监控
     * 
     * @returns {Promise<array>} 模型列表
     */
    async getModels() {
        try {
            const response = await fetch(`${this.apiUrl}/tags`);
            const data = await response.json();
            
            if (data.models) {
                return data.models.map(m => ({
                    name: m.name,
                    size: m.size,
                    modified_at: m.modified_at
                }));
            }
            return [];
        } catch (error) {
            console.error('[Ollama] 获取模型列表失败:', error.message);
            return [];
        }
    }
}

export default OllamaHandler;