import { AIManager } from './ai/index.js';

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
    
    // 这里可以注册其他模块的状态检查
    this.registerModule('database', () => this.checkDatabase());
    this.registerModule('memory', () => this.checkMemory());
    
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
          details: { error: 'AI管理器未正确初始化' },
          message: 'AI功能未就绪'
        };
      }
      
      const status = AIManager.getServiceStatus();
      const isAvailable = AIManager.isAIAvailable();
      
      return {
        available: isAvailable,
        details: {
          ollama: status.ollama ? '✅' : '❌',
          general_model: status.models.general ? '✅' : '❌',
          code_model: status.models.code ? '✅' : '❌',
          vision_model: status.models.vision ? '✅' : '❌',
          last_check: new Date(status.timestamp).toLocaleString()
        },
        message: isAvailable ? 'AI服务正常运行中' : 'AI服务不可用'
      };
    } catch (error) {
      return {
        available: false,
        details: { error: error.message },
        message: 'AI服务检查失败'
      };
    }
  }

  // 检查数据库状态（预留接口）
  async checkDatabase() {
    // 这里可以添加数据库状态检查逻辑
    return {
      available: false,
      details: { info: '数据库功能尚未实现' },
      message: '数据库功能待开发'
    };
  }

  // 检查记忆系统状态（预留接口）
  async checkMemory() {
    // 这里可以添加记忆系统状态检查逻辑
    return {
      available: false,
      details: { info: '记忆系统功能尚未实现' },
      message: '记忆系统功能待开发'
    };
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
          details: { error: error.message },
          message: `检查${name}模块状态时出错`
        };
      }
    }
    
    return results;
  }

  // 生成状态报告
  async generateStatusReport() {
    const status = await this.getAllStatus();
    let message = "🥭榴莲插件状态报告:\n\n";
    
    for (const [moduleName, moduleStatus] of Object.entries(status)) {
      const emoji = moduleStatus.available ? "✅" : "❌";
      message += `${emoji} ${moduleName.toUpperCase()}模块: ${moduleStatus.message}\n`;
      
      // 添加详细信息
      for (const [key, value] of Object.entries(moduleStatus.details)) {
        message += `   • ${key}: ${value}\n`;
      }
      
      message += "\n";
    }
    
    // 添加使用提示
    message += "💡 使用提示:\n";
    message += "• 确保Ollama服务运行: `ollama serve`\n";
    message += "• 下载所需模型: `ollama pull <模型名>`\n";
    message += "• 检查服务连接: `#榴莲状态`\n";
    
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

console.log('[状态模块] 规则定义完成');

// 状态检查处理函数
export async function liulian_status(e) {
  console.log('[状态模块] 收到状态检查请求');
  
  try {
    // 发送"正在检查"提示
    await e.reply("正在检查榴莲插件状态，请稍候...", true);
    
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