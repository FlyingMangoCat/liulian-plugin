import fetch from "node-fetch";
import lodash from "lodash";

// ==================== 配置区域开始 ====================
// 请根据您的实际环境修改以下配置

const OLLAMA_API_URL = "http://192.168.0.112:11434"; // Ollama API地址
const MODEL_NAME = "deepseek-llm:7b"; // 使用的模型名称
const SYSTEM_PROMPT = "你是一个名叫绿豆的群友，回答要简洁友好"; // 系统提示词/基础设定

// 概率设置 (40% ≈ 5句话回2句, 50% ≈ 5句话回2.5句, 60% ≈ 5句话回3句)
const DEFAULT_PROBABILITY = 40; // 默认触发概率

// ==================== 配置区域结束 ====================

export const rule = {
  ai: {
    reg: "(.*)", // 匹配所有消息
    priority: 1000, // 优先级
    describe: "AI自动回复", // 功能说明
  },
};

export async function ai(e) {
  // 排除自己发的消息和命令消息
  if (e.user_id === e.self_id || e.message[0]?.type === 'at') {
    return;
  }
  
  // 获取配置
  const aiProbability = DEFAULT_PROBABILITY
  
  // 概率触发检查
  let random_ = lodash.random(1, 100);
  if (random_ > aiProbability) {
    return; // 概率未命中，不处理
  }
  
  // 调用Ollama API
  try {
    // 构建带有系统提示词的消息
    const fullPrompt = `${SYSTEM_PROMPT}\n\n用户说: ${e.msg}`;
    
    const requestData = {
      model: MODEL_NAME,
      prompt: fullPrompt,
      stream: false
    };

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    const botReply = responseData.response?.trim();

    if (botReply) {
      await e.reply(botReply, true);
    }
  } catch (error) {
    // 只打印错误日志，不回复用户
    console.error(`[榴莲AI错误] ${new Date().toLocaleString()}:`, error.message);
  }
}