import { AIManager } from './ai/index.js';
import DatabaseManager from './ai/core/database.js';

console.log('[状态模块] 开始加载');

// 状态检查处理器
class StatusManager {
    constructor() {
        this.modules = new Map();
        this.init();
    }

    // 初始化模块状态检查
    init() {
        // 注册AI模块状态检查
        this.registerModule('ai', () => this.checkAIModule());
        
        // 注册数据库状态检查
        this.registerModule('database', () => this.checkDatabase());
        
        console.log('[状态模块] 状态管理器初始化完成');
    }

    // 注册模块状态检查函数
    registerModule(name, checkFunction) {
        this.modules.set(name, checkFunction);
        console.log(`[状态模块] 注册模块状态检查: ${name}`);
    }

    // 检查AI模块状态
    async checkAIModule() {
        try {
            // 检查AIManager是否已初始化
            if (typeof AIManager.getServiceStatus !== 'function') {
                return {
                    available: false,
                    message: 'AI管理器未正确初始化'
                };
            }
            
            const status = AIManager.getServiceStatus();
            const isAvailable = AIManager.isAIAvailable();
            
            return {
                available: isAvailable,
                message: isAvailable ? 'AI服务正常运行' : 'AI服务不可用',
                details: {
                    ollama: status.ollama ? '✅' : '❌',
                    general_model: status.models.general ? '✅' : '❌',
                    code_model: status.models.code ? '✅' : '❌',
                    vision_model: status.models.vision ? '✅' : '❌'
                }
            };
        } catch (error) {
            return {
                available: false,
                message: 'AI服务检查失败'
            };
        }
    }

    // 检查数据库状态
    async checkDatabase() {
        try {
            const status = await DatabaseManager.healthCheck();
            return {
                available: status.postgres.available,
                message: status.postgres.available ? '数据库连接正常' : '数据库连接异常',
                details: {
                    postgres: status.postgres.available ? '✅ PostgreSQL正常' : `❌ PostgreSQL异常: ${status.postgres.message}`,
                    redis: status.redis.available ? '✅ Redis缓存正常' : `⚠️ Redis缓存异常: ${status.redis.message}`
                }
            };
        } catch (error) {
            return {
                available: false,
                message: '数据库检查失败'
            };
        }
    }

    // 获取所有模块状态
    async getAllStatus() {
        const results = {};
        
        for (const [name, checkFunction] of this.modules) {
            try {
                results[name] = await checkFunction();
            } catch (error) {
                results[name] = {
                    available: false,
                    message: `检查${name}模块状态时出错`
                };
            }
        }
        
        return results;
    }

    // 生成状态报告
    async generateStatusReport() {
        const status = await this.getAllStatus();
        let message = "🥭 榴莲插件状态报告\n\n";
        
        for (const [moduleName, moduleStatus] of Object.entries(status)) {
            const emoji = moduleStatus.available ? "✅" : "❌";
            message += `${emoji} ${moduleName}: ${moduleStatus.message}\n`;
        }
        
        return message;
    }
}

// 创建单例实例
const statusManager = new StatusManager();

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
        // 生成状态报告
        const statusReport = await statusManager.generateStatusReport();
        console.log('[状态模块] 生成状态报告成功');
        
        // 发送状态报告
        await e.reply(statusReport, true);
    } catch (error) {
        console.error('[状态模块] 生成报告失败:', error);
        await e.reply("生成状态报告时出错，请查看日志获取详细信息。", true);
    }
}

console.log('[状态模块] 加载完成');