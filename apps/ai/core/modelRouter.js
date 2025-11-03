/**
 * 模型路由器 - 管理多种AI模型的服务路由
 * 
 * 该模块负责：
 * 1. 根据输入类型选择合适的AI模型
 * 2. 图像处理模型路由
 * 3. 文本处理模型路由
 * 4. 模型负载均衡和故障转移
 */

import OllamaHandler from './ollama.js';
import config from '../../../config/ai.js';
import fetch from 'node-fetch';

class ModelRouter {
    constructor() {
        // Ollama处理器实例
        this.ollama = new OllamaHandler(config.ai.ollama.api_url);
        // 模型配置
        this.modelConfig = {
            text: config.ai.ollama.model || 'qwen2.5:7b',  // 文本处理模型
            vision: config.ai.ollama.vision_model || 'llava:7b',  // 视觉模型
        };
        // 模型健康状态
        this.modelHealth = new Map();
        // 支持的视觉模型列表
        this.visionModels = ['llava', 'bakllava', 'moondream', 'llava-phi3'];
    }

    /**
     * 处理文本消息
     * 
     * 根据文本内容和上下文选择最优模型处理
     * 支持多种文本处理场景：问答、对话、摘要等
     * 
     * @param {string} text - 输入文本
     * @param {object} options - 处理选项
     * @returns {Promise<string>} 处理结果
     */
    async processText(text, options = {}) {
        try {
            // 确定使用的模型
            const model = options.model || this.modelConfig.text;
            
            // 构建提示词
            const prompt = this.buildTextPrompt(text, options);
            
            // 调用Ollama生成回复
            const response = await this.ollama.generate(
                model,
                prompt,
                options
            );
            
            // 更新模型健康状态
            this.modelHealth.set(model, true);
            
            return response;
        } catch (error) {
            console.error('[模型路由器] 文本处理失败:', error.message);
            // 更新模型健康状态
            this.modelHealth.set(options.model || this.modelConfig.text, false);
            throw error;
        }
    }

    /**
     * 处理图像消息
     * 
     * 识别图像内容并生成描述
     * 支持多种图像格式和场景识别
     * 
     * @param {string} imageUrl - 图像URL或base64数据
     * @param {object} options - 处理选项
     * @returns {Promise<string>} 图像描述
     */
    async processImage(imageUrl, options = {}) {
        try {
            // 检查是否支持视觉模型
            const visionModel = this.modelConfig.vision;
            const isVisionModel = this.visionModels.some(model => 
                visionModel.toLowerCase().includes(model.toLowerCase())
            );
            
            if (!isVisionModel) {
                console.warn('[模型路由器] 当前配置的模型不支持图像处理，使用文本模型返回通用描述');
                return "这是一张图像，但当前配置不支持图像分析功能";
            }
            
            // 下载图像数据
            let imageData;
            if (imageUrl.startsWith('http')) {
                // 从URL下载图像
                const response = await fetch(imageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; ImageProcessor/1.0)'
                    }
                });
                if (!response.ok) {
                    throw new Error(`下载图像失败: ${response.statusText}`);
                }
                // 检查响应类型是否为图像
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.startsWith('image/')) {
                    throw new Error(`URL不指向有效的图像文件: ${contentType}`);
                }
                const buffer = await response.buffer();
                imageData = buffer.toString('base64');
            } else if (imageUrl.startsWith('base64:')) {
                // 从base64数据获取图像
                const base64Data = imageUrl.substring(7); // 移除 "base64:" 前缀
                imageData = base64Data;
            } else {
                // 对于文本描述，返回处理结果
                return `图像描述: ${imageUrl}`;
            }
            
            // 构建视觉模型提示
            const prompt = options.prompt || "请详细描述这张图片的内容，包括场景、人物、物体、颜色和任何文字信息";
            
            // 调用视觉模型处理图像
            const response = await this.ollama.generate(
                visionModel,
                prompt,
                {
                    ...options,
                    images: [imageData]
                }
            );
            
            // 更新模型健康状态
            this.modelHealth.set(visionModel, true);
            
            return response;
        } catch (error) {
            console.error('[模型路由器] 图像处理失败:', error.message);
            // 更新模型健康状态
            this.modelHealth.set(this.modelConfig.vision, false);
            return "图像分析功能暂不可用或图像格式不支持";
        }
    }

    /**
     * 构建文本处理提示词
     * 
     * 根据不同的处理需求和上下文构建优化的提示词
     * 提高AI回复的准确性和相关性
     * 
     * @param {string} text - 原始文本
     * @param {object} options - 处理选项
     * @returns {string} 构建的提示词
     */
    buildTextPrompt(text, options = {}) {
        let prompt = text;
        
        // 根据选项添加上下文
        if (options.context) {
            prompt = `${options.context}\n\n用户问题: ${text}`;
        }
        
        // 根据任务类型调整提示词
        if (options.taskType === 'question') {
            prompt = `请回答以下问题: ${prompt}`;
        } else if (options.taskType === 'summarize') {
            prompt = `请总结以下内容: ${prompt}`;
        } else if (options.taskType === 'translate') {
            prompt = `请将以下内容翻译成中文: ${prompt}`;
        }
        
        return prompt;
    }

    /**
     * 检查模型可用性
     * 
     * 验证指定模型是否可以正常服务
     * 用于故障转移和负载均衡
     * 
     * @param {string} model - 模型名称
     * @returns {Promise<boolean>} 模型是否可用
     */
    async checkModel(model) {
        try {
            const available = await this.ollama.checkModel(model);
            this.modelHealth.set(model, available);
            return available;
        } catch (error) {
            this.modelHealth.set(model, false);
            return false;
        }
    }

    /**
     * 获取可用模型列表
     * 
     * 从Ollama服务获取当前可用的模型
     * 用于动态路由和模型选择
     * 
     * @returns {Promise<Array>} 可用模型列表
     */
    async getAvailableModels() {
        try {
            const models = await this.ollama.getModels();
            return models.map(m => m.name);
        } catch (error) {
            console.error('[模型路由器] 获取模型列表失败:', error);
            return [];
        }
    }

    /**
     * 路由处理请求
     * 
     * 根据输入类型和内容自动选择最适合的模型
     * 支持文本、图像和其他媒体类型
     * 
     * @param {string} input - 输入内容
     * @param {string} inputType - 输入类型 (text/image)
     * @param {object} options - 处理选项
     * @returns {Promise<string>} 处理结果
     */
    async route(input, inputType = 'text', options = {}) {
        try {
            switch (inputType) {
                case 'image':
                    return await this.processImage(input, options);
                case 'text':
                default:
                    return await this.processText(input, options);
            }
        } catch (error) {
            console.error('[模型路由器] 路由失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前模型状态
     * 
     * 返回模型健康状况和性能指标
     * 用于监控和诊断
     * 
     * @returns {object} 模型状态报告
     */
    getStatus() {
        return {
            models: {
                text: this.modelConfig.text,
                vision: this.modelConfig.vision,
            },
            health: Object.fromEntries(this.modelHealth),
            lastUpdate: new Date().toISOString()
        };
    }
    
    /**
     * 设置模型配置
     * 
     * 动态更新模型配置
     * 
     * @param {object} config - 新的模型配置
     */
    setModelConfig(config) {
        this.modelConfig = {
            ...this.modelConfig,
            ...config
        };
        console.log('[模型路由器] 更新模型配置:', this.modelConfig);
    }
}

// 创建并导出模型路由器实例
export { ModelRouter };
