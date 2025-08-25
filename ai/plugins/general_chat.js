import fetch from 'node-fetch';
import config from '../../../config.js';

/**
 * 通用聊天插件
 * @priority 100 - 优先级较高，但低于未来可能存在的命令插件
 */
export class GeneralChatPlugin {
  // 插件元信息，用于主程序识别和管理
  static info = {
    name: 'general_chat',
    description: '处理通用文本聊天',
    priority: 100, // 优先级数字越小，越先被尝试（如果一个插件处理不了，可以返回false，交给下一个优先级更低的插件）
    match: (e) => true, // 默认匹配所有消息，未来可以在这里做更精确的意图判断
  };

  async execute(e) {
    // 构建带有系统提示词和上下文的完整Prompt
    // 注意：为了后续微调，我们依然保留系统提示词，但这是最后一步了。
    const fullPrompt = `${config.system_prompt}\n\n用户说: ${e.msg}`;

    const requestData = {
      model: config.ollama.models.main,
      prompt: fullPrompt,
      stream: false,
    };

    try {
      const response = await fetch(config.ollama.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Ollama API 错误: ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.response?.trim();

      // 确保有有效回复再返回
      if (botReply) {
        return botReply;
      } else {
        console.error('[GeneralChatPlugin] 模型返回空回复');
        return false; // 返回false表示本插件未能成功处理，可交由后续插件处理
      }
    } catch (error) {
      console.error('[GeneralChatPlugin] 请求失败:', error.message);
      // 可以选择返回一个友好的降级回复，或者直接抛出错误由主程序统一处理
      // return '本大爷现在有点头晕，待会再战！';
      return false; // 处理失败，交给下一个插件
    }
  }
}

// 导出一个实例，方便主程序直接调用
export default new GeneralChatPlugin();