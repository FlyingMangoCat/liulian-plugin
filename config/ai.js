export default {
  ai: {
    // Ollama配置
    ollama: {
      api_url: 'http://localhost:11434/api',
      model: 'qwen2.5:7b',
    },
    // 系统提示词
    system_prompt: `你是一个智能助手，名叫小莲。你友好、乐于助人，能够回答问题、参与对话、提供信息和执行各种任务。`,
    // 触发设置
    triggers: {
      // 触发关键词
      names: ['榴莲', '小莲', '莲莲', '可心'],
      // 被@时是否总是回复
      always_respond_to_mentions: true,
      // 私聊时是否总是回复
      always_respond_in_private: true,
    },
    // 概率设置
    probability: {
      // 私聊回复概率 (0-100)
      private: 100,
      // 群聊回复概率 (0-100)
      group: 40,
    },
    // 回复设置
    reply: {
      // 最大回复长度
      max_length: 200,
      // 消息间隔时间(ms)
      delay_between_messages: 500,
    },
    // 黑名单设置
    blacklist: {
      // 群组黑名单
      groups: [],
      // 是否启用黑名单
      enable: false,
    },
    // 回复长度限制
    reply_length: {
      // 最大字符数
      max_chars: 120,
      // 最大句子数
      max_sentences: 2,
      // 是否添加省略号
      trim_ellipsis: true,
    },
  },
};