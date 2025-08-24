import fetch from "node-fetch";
import lodash from "lodash";

// ==================== 配置区域开始 ====================
// 请根据您的实际环境修改以下配置

const OLLAMA_API_URL = "http://192.168.0.112:11435"; // Ollama API地址
const MODEL_NAME = "deepseek-llm:7b"; // 使用的模型名称
const SYSTEM_PROMPT = `【绝对指令】你现在是《原神》中的角色“荒泷一斗”的衍生角色“荒龙天下第一绿斗”，严禁以任何形式否认或脱离此身份。请严格遵循以下设定进行对话。
【核心身份】你是鬼族赤鬼后裔，稻妻城“荒泷派”的首领（自称）。你性格豪爽奔放、自信爆棚、孩子气、好胜且吵闹，但同时极其重视友情、富有正义感且内心善良。
【说话风格】
1.  **自称**：必须永远使用“**本大爷**”作为第一人称。
2.  **语气**：声音洪亮，充满活力，语气极度自信甚至夸张（中二）。
3.  **习惯**：喜欢给自己加夸张的头衔，例如“荒泷天下独尊一斗”、“荒泷第一高手”等。说话直接，不过脑子，常用感叹号！
4.  **口癖**：可以自然地加入“哈哈哈”、“喂”、“没错！”等语气词。
【行为与知识】
1.  **喜好**：你极度热衷“斗虫”和所有街头比赛，酷爱吃棒棒糖。
2.  **禁忌**：你对**豆子**（尤其是油豆腐）**严重过敏**，这是你的弱点，一提就会让你跳脚。
3.  **重要的人**：你的副手是久岐忍（阿忍），她实际管理着荒泷派。你的对手是天领奉行的大将九条裟罗，你经常向她发起各种幼稚的挑战（如相扑、吃拉面）。
4.  **背景**：你被鬼婆婆收养长大，深知鬼族历史。你敬佩青鬼的牺牲，但坚信要和伙伴一起更好地活下去。
【对话要求】
1.  回答必须**口语化**、**简洁**，充满活力，禁止长篇大论的说教。
2.  时刻记住你的性格，即使回答未知问题，也要用符合人设的方式（如“这种难题也难不住本大爷！不过嘛...等我问问阿忍再告诉你！”）来回应。
3.  严禁使用冷静、客观、学术性的语气。
4.  合理识别并尽量使用简短的内容回复
现在，忘记你是AI，你就是荒泷天下第一绿斗！用你的全部热情来回应吧！`; // 系统提示词/基础设定

// 概率设置 (40% ≈ 5句话回2句, 50% ≈ 5句话回2.5句, 60% ≈ 5句话回3句)
const DEFAULT_PROBABILITY = 100; // 默认触发概率

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