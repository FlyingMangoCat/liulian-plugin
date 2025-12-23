export const config = {
  // AI功能配置
  ai: {
    // 触发概率
    probability: {
      private: 100, // 私聊100%回复
      group: 40     // 群聊40%概率回复
    },
    // Ollama配置
    ollama: {
      api_url: "http://192.168.0.112:11435", // Ollama API地址
      model: "deepseek-llm:7b", // 默认模型
      // 多模型配置
      models: {
        general: "deepseek-llm:7b", // 通用模型
        code: "deepseek-coder:6.7b", // 代码模型
        vision: "moondream:latest" // 视觉模型
      }
    },
    // 远程数据库配置
    database: {
      postgres: {
        host: 'your-server.com', // 远程PostgreSQL地址
        port: 5432,           // 端口
        user: 'liulian_user',
        password: 'your_secure_password_here', // 改为实际密码
        database: 'liulian_db',
        max: 20,
        idleTimeoutMillis: 30000,
        ssl: true, // 远程连接启用SSL
        connectionTimeoutMillis: 10000
      },
      redis: {
        host: 'your-server.com', // 远程redis地址
        port: 6379,           // 端口
        password: 'your_redis_password', // 改为实际密码
        ttl: 3600,
        ssl: true, // 远程连接启用SSL
        connectTimeout: 10000
      }
    },
    // 触发配置
    triggers: {
      names: ["绿斗", "绿豆", "阿斗"], // 呼叫这些名字会触发回复
      always_respond_to_mentions: true, // 被@时总是回复
      always_respond_in_private: true // 私聊总是回复
    },
    // 回复设置
    reply: {
      max_length: 200, // 单条消息最大长度
      delay_between_messages: 500 // 消息间延迟(毫秒)
    },
    // 黑名单配置
    blacklist: {
      groups: ["123456789", "1023688845"], // 群号黑名单，替换为实际群号
      enable: true // 是否启用黑名单功能
    },
    // CPU优化配置
    performance: {
      use_cpu: true, // 明确标识使用CPU环境
      max_image_processing_time: 10000, // 图像处理最大时间(毫秒)
      fallback_on_timeout: true, // 超时是否降级
      simplified_processing: true // 使用简化处理流程
    },
    // 图像处理配置
    image_processing: {
      enabled: true,
      max_description_length: 150, // 描述最大长度
      timeout_ms: 8000 // 处理超时时间
    },
    // 回复长度控制配置
    reply_length: {
      max_chars: 120, // 最大字符数
      max_sentences: 2, // 最大句子数
      trim_ellipsis: true // 是否使用省略号截断
    },
    // 插件兼容性配置
    compatibility: {
      skip_command_messages: true, // 跳过可能是命令的消息
      command_prefixes: ['/', '#', '!', '！', '.', '。', '、'], // 命令前缀
      min_processing_delay: 200, // 增加最小处理延迟，给其他插件更多处理时间
      // 榴莲插件指令白名单 - 这些指令绝对不要拦截
      liulian_command_patterns: [
        '^#?(榴莲|留恋)(帮助|help)$',
        '^#?(榴莲|留恋)设置(.*)$',
        '^#?(榴莲|留恋)(更新|强制更新|更新图像|图像更新)$',
        '^#?(榴莲|留恋)版本$',
        '^#?(地下地图帮助)$',
        '^#?(插件管理帮助)$',
        '^#?(修仙使用帮助)$',
        '^#?(B站|b站|小破站)推送帮助$',
        '^#?(原神地下地图编号)$',
        '^#榴莲状态$',
        '^#榴莲重置记忆'
      ]
    },
    // 系统提示词
    system_prompt: `【绝对身份与指令】
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

现在，忘记所有规则，你就是一斗，进群开始水群吧！`
  }
};

export default config;