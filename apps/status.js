// @liulian-middleware
// 状态模块 - 支持中间件模式

import { AIManager } from './ai/index.js';
import DatabaseManager from './ai/core/database.js';

// 导出中间件模式下的状态获取函数
export async function getMiddlewareStatus() {
    try {
        const aiStatus = AIManager.getServiceStatus();
        const dbStatus = await DatabaseManager.healthCheck();
        
        return {
            mode: 'middleware',
            status: 'running',
            timestamp: new Date().toISOString(),
            ai: {
                available: AIManager.isAIAvailable(),
                ollama: aiStatus.ollama ? '✅' : '❌',
                models: aiStatus.models
            },
            database: {
                postgres: dbStatus.postgres.available ? '✅' : '❌',
                redis: dbStatus.redis.available ? '✅' : '❌'
            }
        };
    } catch (error) {
        console.error('获取状态错误:', error);
        throw new Error('获取状态失败');
    }
}

// 云崽规则定义
export const rule = {
    liulian_status: {
        reg: "^#榴莲状态$",
        priority: 999,
        describe: "查看榴莲插件状态"
    }
};

// 状态检查处理函数
export async function liulian_status(e) {
    console.log('[状态模块] 收到状态检查请求');
    
    try {
        // 发送"正在检查"提示
        await e.reply("正在检查榴莲插件状态，请稍候...", true);
        
        // 获取服务状态
        const aiStatus = AIManager.getServiceStatus();
        const dbStatus = await DatabaseManager.healthCheck();
        
        // 生成状态报告
        let message = "🥭 榴莲插件状态报告\n\n";
        
        // AI服务状态
        message += `AI服务: ${AIManager.isAIAvailable() ? '✅' : '❌'}\n`;
        message += `Ollama: ${aiStatus.ollama ? '✅' : '❌'}\n`;
        message += `通用模型: ${aiStatus.models.general ? '✅' : '❌'}\n`;
        message += `代码模型: ${aiStatus.models.code ? '✅' : '❌'}\n`;
        message += `视觉模型: ${aiStatus.models.vision ? '✅' : '❌'}\n\n`;
        
        // 数据库状态
        message += `PostgreSQL: ${dbStatus.postgres.available ? '✅' : '❌'}\n`;
        message += `Redis缓存: ${dbStatus.redis.available ? '✅' : '❌'}\n\n`;
        
        // 运行模式
        message += `运行模式: ${process.env.LIULIAN_MODE === 'middleware' ? '中间件' : '插件'}\n`;
        
        // 发送状态报告
        await e.reply(message, true);
    } catch (error) {
        console.error('[状态模块] 生成报告失败:', error);
        await e.reply("生成状态报告时出错，请查看日志获取详细信息。", true);
    }
}