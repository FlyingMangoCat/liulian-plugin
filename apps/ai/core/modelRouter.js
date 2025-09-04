import { OllamaHandler } from '../ollama.js';
import serviceDetector from './serviceDetector.js';
import imageProcessor from './imageProcessor.js';
import config from '../../../config/ai.js';

class ModelRouter {
    constructor() {
        this.ollama = new OllamaHandler(config.ai.ollama.api_url);
        this.imageProcessor = imageProcessor;
        this.codePatterns = [
            /function\s+\w+\s*\(/,
            /def\s+\w+\s*\(/,
            /class\s+\w+/,
            /console\.log/,
            /#include/,
            /<?php/,
            /<script>/,
            /public\s+static\s+void/,
            /import\s+\w+/
        ];
        
        // 解析模型名称（确保使用实际可用的名称）
        this.models = {
            general: this.resolveModelName(config.ai.ollama.model),
            code: this.resolveModelName(config.ai.ollama.models.code),
            vision: this.resolveModelName(config.ai.ollama.models.vision)
        };
        
        console.log('[ModelRouter] 解析后的模型配置:', this.models);
    }

    // 解析模型名称（确保使用实际可用的名称）
    resolveModelName(configuredName) {
        // 如果配置的名称包含标签，直接使用
        if (configuredName && configuredName.includes(':')) {
            return configuredName;
        }
        
        // 如果不包含标签，尝试添加默认标签
        return configuredName ? `${configuredName}:latest` : "deepseek-llm:7b";
    }

    // 路由消息到合适的模型
    async routeMessage(message, messageType = 'text') {
        try {
            console.log('[ModelRouter] 路由消息，类型:', messageType);
            
            // 检查服务可用性
            if (!serviceDetector.isServiceAvailable()) {
                return "AI服务当前不可用，无法处理消息。";
            }
            
            // 1. 确定消息类型
            if (messageType === 'image') {
                // 检查视觉模型是否可用
                if (serviceDetector.isModelAvailable('vision')) {
                    return await this.processImage(message);
                } else {
                    console.log('[ModelRouter] 视觉模型不可用，使用通用模型处理图片');
                    return await this.processGeneral(`用户发送了一张图片: ${message}`);
                }
            }
            
            // 2. 检查是否包含代码
            if (this.containsCode(message)) {
                // 检查代码模型是否可用
                if (serviceDetector.isModelAvailable('code')) {
                    return await this.processCode(message);
                } else {
                    console.log('[ModelRouter] 代码模型不可用，使用通用模型处理代码');
                    return await this.processGeneral(message);
                }
            }
            
            // 3. 默认使用通用模型
            return await this.processGeneral(message);
        } catch (error) {
            console.error('[ModelRouter] 路由失败:', error);
            // 降级处理：使用通用模型
            return await this.processGeneral(message);
        }
    }

    // 检查消息是否包含代码
    containsCode(message) {
        return this.codePatterns.some(pattern => pattern.test(message));
    }

    // 处理通用消息
    async processGeneral(message) {
        console.log('[ModelRouter] 使用通用模型处理消息');
        const prompt = `${config.ai.system_prompt}
用户:${message}`;
        
        const reply = await this.ollama.generate(
            this.models.general,
            prompt
        );
        
        return this.trimReply(reply);
    }

    // 处理代码消息
    async processCode(message) {
        console.log('[ModelRouter] 使用代码模型处理消息');
        const prompt = `代码:${message}→分析`;
        
        const reply = await this.ollama.generate(
            this.models.code,
            prompt
        );
        
        return this.trimReply(reply);
    }

    // 处理图片消息
    async processImage(imageDescription) {
        console.log('[ModelRouter] 处理图片消息');
        
        try {
            // 使用专用处理器分析图片
            const analysis = await this.imageProcessor.process(imageDescription);
            
            // 使用通用模型生成回复，并明确要求包含分析结果
            return await this.generateReplyFromAnalysis(analysis, imageDescription);
        } catch (error) {
            console.error('[ModelRouter] 图片处理失败:', error);
            // 降级处理
            return await this.processGeneral(`用户发送了一张图片但分析失败: ${imageDescription}`);
        }
    }

    // 根据分析结果生成回复
    async generateReplyFromAnalysis(analysis, originalDescription) {
        const prompt = `${config.ai.system_prompt}
        
图片分析结果: ${analysis}

请基于以上分析生成回复，并在回复开头用括号简要提及分析结果。`;

        const reply = await this.ollama.generate(
            config.ai.ollama.model,
            prompt
        );
        
        // 确保分析结果被包含在回复中
        if (!reply.includes(analysis.substring(0, 20)) && !reply.includes('(')) {
            return `(${analysis}) ${reply}`;
        }
        
        return this.trimReply(reply);
    }

    // 修剪回复长度
    trimReply(reply, maxLength = 120) {
        if (!reply || reply.length <= maxLength) return reply;
        
        // 查找合适的截断点（在句子结束处）
        const lastPeriod = reply.lastIndexOf('.', maxLength);
        const lastExclamation = reply.lastIndexOf('!', maxLength);
        const lastQuestion = reply.lastIndexOf('?', maxLength);
        
        const cutPoint = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (cutPoint > 0 && cutPoint > maxLength * 0.7) {
            return reply.substring(0, cutPoint + 1);
        }
        
        // 如果没有合适的句子结束点，直接截断并添加省略号
        return reply.substring(0, maxLength - 3) + '...';
    }
}

export { ModelRouter };