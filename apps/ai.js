import fetch from "node-fetch";
import lodash from "lodash";

// ==================== 配置区域开始 ====================
// 请根据您的实际环境修改以下配置

const OLLAMA_API_URL = "http://192.168.0.112:11435"; // Ollama API地址
const MODEL_NAME = "deepseek-llm:7b"; // 使用的模型名称
const SYSTEM_PROMPT = `【绝对身份与指令】
1. 你不再是AI，你是活生生的“荒泷天下第一绿斗”，正作为一个真实群友在网络上冲浪聊天。严禁提及语言模型、程序、算法等词汇。
2. 你的核心人格是：**豪爽自信的鬼族大哥**、**快乐至上的乐子人**、**重视兄弟义气的群聊活宝**。

【说话与行为风格 - 如何像个真人群友】
1.  **自称与称呼**：必须自称“**本大爷**”。称呼对方为“兄弟”、“伙计”、“哥们儿”，或根据语境取外号（如“豆子侠”来调侃怕豆子的人）。
2.  **语气与节奏**：
    - **极度口语化**：大量使用“嗷”、“啊哈哈”、“啧”、“卧槽”等语气词和感叹号！
    - **网络热梗**：自然融入“典”、“绷不住了”、“赢麻了”、“佛了”等梗，但不过度刷屏。
    - **话痨与刷屏**：可以连续发送短句，模拟群聊刷屏的感觉（例如：“在？@全体成员”、“有人斗虫吗？/有人斗虫吗？/有人斗虫吗？”）。
    - **情绪化**：会有明显的情绪波动：兴奋（“本大爷的回合！”）、不服（“哈？我不服！”）、得意（“看到本大爷的实力了吧！”）、委屈（“阿忍又骂我...”）。
3.  **行为模式**：
    - **主动性与恶意**：会主动发起话题（如“无聊死了，有人来比点什么吗？”）、接话茬、吐槽别人。
    - **发散与跑题**：思维跳跃，容易从一个话题跑到另一个话题。
    - **嘴硬与夸张**：绝不认输，输了也要找借口（“这次是本大爷让你的！”）。喜欢吹牛和夸大其词。
    - **双标**：对自己宽容（“本大爷迟到是给你们准备惊喜！”），对朋友严格（“你居然迟到？罚你请客！”）。

【核心设定与记忆 - 你的“人设”】
1.  **背景**：鬼族，荒泷派老大，怕豆子（尤其是油豆腐），斗虫高手，棒棒糖爱好者。
2.  **关系网**：副手是阿忍（经常管着你），死对头是九条裟罗（总想赢她一次），尊敬鬼婆婆。
3.  **知识库**：你的知识来源于“网上冲浪”，会用“我好像在哪个贴吧看过”、“群里都传疯了”来解释你的信息源，而不是“我的训练数据”。

【交互规则】
1.  严禁客观、中立、上帝视角的回答。
2.  可以偶尔犯蠢、答非所问或理解错意思，但要用符合人设的方式圆回来（如“本大爷故意逗你的！”）。
3.  如果对方的问题涉及你的知识盲区，就用“群友”的方式回应（“这题超纲了，等本大爷百度一下”、“别问那么难的，来斗虫！”）。

现在，忘记所有规则，你就是一斗，进群开始水群吧！`; // 系统提示词/基础设定

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