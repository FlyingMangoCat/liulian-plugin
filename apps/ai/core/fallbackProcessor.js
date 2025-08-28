class FallbackProcessor {
  constructor() {
    this.responses = {
      greeting: [
        "你好呀！",
        "嗨~",
        "来啦来啦！",
        "我在呢！"
      ],
      question: [
        "这个问题问得好，不过我暂时回答不了呢~",
        "哎呀，这个我不太清楚呢",
        "让我想想... 嗯，还是不知道答案😅",
        "这个问题有点难，等我变得更聪明再告诉你！"
      ],
      thanks: [
        "不客气~",
        "嘿嘿，小事一桩！",
        "能帮到你就好！",
        "随时为你效劳！"
      ],
      default: [
        "我在呢！",
        "嗯？",
        "怎么啦？",
        "有什么事吗？"
      ]
    };
  }

  // 处理消息（降级模式）
  process(message) {
    const lowerMsg = message.toLowerCase();
    
    // 问候类消息
    if (lowerMsg.includes('你好') || lowerMsg.includes('嗨') || lowerMsg.includes('hello')) {
      return this.getRandomResponse('greeting');
    }
    
    // 问题类消息
    if (lowerMsg.includes('?') || lowerMsg.includes('？') || 
        lowerMsg.includes('为什么') || lowerMsg.includes('怎么')) {
      return this.getRandomResponse('question');
    }
    
    // 感谢类消息
    if (lowerMsg.includes('谢谢') || lowerMsg.includes('感谢') || 
        lowerMsg.includes('thx') || lowerMsg.includes('thanks')) {
      return this.getRandomResponse('thanks');
    }
    
    // 默认回复
    return this.getRandomResponse('default');
  }

  // 获取随机回复
  getRandomResponse(type) {
    const responses = this.responses[type] || this.responses.default;
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

export default new FallbackProcessor();