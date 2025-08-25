// ==================== 全局配置 ====================
export const aiconfig = {
  ollama: {
    api_url: "http://192.168.0.112:11435/api/generate", // 直接使用完整API地址
    models: {
      main: "deepseek-llm:7b", // 主模型
      // vision: "llava:latest", // 未来视觉模型
      // coder: "deepseek-coder:latest", // 未来代码模型
    },
  },
  system_prompt: `【绝对身份与指令】...`, // 您原有的完整SYSTEM_PROMPT
  probability: {
    private: 100, // 私聊触发概率
    group: 40,    // 群聊触发概率
  },
};

// 导出一个默认配置方便使用
export default aiconfig;