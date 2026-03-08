// @liulian-middleware
// 状态模块 - 支持中间件模式

import { AIManager } from './ai/index.js';
import DatabaseManager from './ai/core/database.js';
import { Cfg } from '#liulian';
import axios from 'axios';

// 外部API列表
const externalAPIs = {
    bilibili: {
        name: 'B站API',
        urls: [
            'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space',
            'https://api.bilibili.com/x/space/acc/info'
        ]
    },
    alapi: {
        name: 'ALAPI(天气/早报)',
        urls: [
            'https://v3.alapi.cn/api/tianqi',
            'https://v3.alapi.cn/api/zaobao'
        ]
    },
    tianapi: {
        name: '天行数据(娱乐)',
        urls: [
            'http://api.tianapi.com/caihongpi/index',
            'http://api.tianapi.com/saylove/index',
            'http://api.tianapi.com/joke/index',
            'http://api.tianapi.com/everyday/index'
        ]
    },
    oick: {
        name: 'OICK API',
        urls: [
            'https://api.oick.cn/dutang/api.php',
            'https://api.oick.cn/dog/api.php'
        ]
    },
    xiaoapi: {
        name: '小API(星座)',
        urls: [
            'http://xiaoapi.cn/API/xzys_pic.php'
        ]
    },
    iw233: {
        name: 'IW233(随机图)',
        urls: [
            'https://iw233.cn/api.php'
        ]
    },
    ovooa: {
        name: 'OVOOA(娱乐)',
        urls: [
            'http://ovooa.com/API/Ser/api',
            'http://ovooa.com/API/name/api.php',
            'http://ovooa.com/API/daan/api',
            'http://ovooa.com/API/chouq/api.php'
        ]
    },
    vvhan: {
        name: 'VVHAN(翻译)',
        urls: [
            'https://api.vvhan.com/api/fy'
        ]
    },
    wordnik: {
        name: 'Wordnik(英语)',
        urls: [
            'http://api.wordnik.com:80/v4/words.json/randomWords'
        ]
    },
    yxyos: {
        name: 'YXYOS(经典语录)',
        urls: [
            'https://api.yxyos.com/liulian/classic'
        ]
    }
};

// 检查单个API的状态
async function checkAPIStatus(url, method = 'GET') {
    try {
        const startTime = Date.now();
        const response = await axios({
            method: method,
            url: url,
            timeout: 5000,
            validateStatus: () => true
        });
        const duration = Date.now() - startTime;
        
        return {
            available: response.status >= 200 && response.status < 500,
            status: response.status,
            duration: duration
        };
    } catch (error) {
        return {
            available: false,
            status: 'TIMEOUT',
            duration: 0,
            error: error.message
        };
    }
}

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
        return {
            mode: 'middleware',
            status: 'error',
            error: error.message
        };
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

        // 检查AI功能是否开启
        const isAIEnabled = Cfg.get('liulian.ai.enabled', false);

        // 生成状态报告
        let message = "🥭 榴莲插件状态\n\n";

        // AI服务状态
        if (isAIEnabled) {
            const aiStatus = AIManager.getServiceStatus();
            message += `AI服务: ${AIManager.isAIAvailable() ? '✅' : '❌'}\n`;
            message += `Ollama: ${(aiStatus && aiStatus.ollama && aiStatus.ollama.available) ? '✅' : '❌'}\n`;
            message += `通用模型: ${(aiStatus && aiStatus.models && aiStatus.models.general && aiStatus.models.general.available) ? '✅' : '❌'}\n`;
            message += `代码模型: ${(aiStatus && aiStatus.models && aiStatus.models.code && aiStatus.models.code.available) ? '✅' : '❌'}\n`;
            message += `视觉模型: ${(aiStatus && aiStatus.models && aiStatus.models.vision && aiStatus.models.vision.available) ? '✅' : '❌'}\n\n`;
        } else {
            message += `AI服务: ❌ (已关闭)\n\n`;
        }

        // 数据库状态
        const dbStatus = await DatabaseManager.healthCheck();
        message += `PostgreSQL: ${(dbStatus && dbStatus.postgres && dbStatus.postgres.available) ? '✅' : '❌'}\n`;
        message += `Redis缓存: ${(dbStatus && dbStatus.redis && dbStatus.redis.available) ? '✅' : '❌'}\n\n`;

        // 外部API状态检查
        message += `📡 外部API状态\n`;
        message += `━━━━━━━━━━━━━━━━\n`;
        
        // 只检查几个关键的API，避免超时
        const keyAPIs = ['bilibili', 'alapi', 'tianapi', 'iw233'];
        let apiCheckCount = 0;
        let apiSuccessCount = 0;
        
        // 并行检查，加快速度
        const apiChecks = keyAPIs.map(async (key) => {
            const api = externalAPIs[key];
            const status = await checkAPIStatus(api.urls[0]);
            return { key, api, status };
        });
        
        const results = await Promise.all(apiChecks);
        
        for (const { api, status } of results) {
            apiCheckCount++;
            if (status.available) apiSuccessCount++;
            
            const statusIcon = status.available ? '✅' : '❌';
            const duration = status.duration > 0 ? `(${status.duration}ms)` : '';
            message += `${statusIcon} ${api.name}: ${status.status} ${duration}\n`;
        }
        
        message += `━━━━━━━━━━━━━━━━\n`;
        message += `可用率: ${apiSuccessCount}/${apiCheckCount}\n\n`;

        // 运行模式
        message += `运行模式: ${process.env.LIULIAN_MODE === 'middleware' ? '中间件' : '插件'}\n`;

        // 发送状态报告
        await e.reply(message, true);
    } catch (error) {
        console.error('[状态模块] 生成报告失败:', error);
        await e.reply("生成状态报告时出错，请查看日志获取详细信息。", true);
    }
}