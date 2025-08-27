class MemoryManager {
  async getContext(userId, groupId) {
    // 使用云崽的Redis或数据库接口
    const key = `memory:${groupId}:${userId}`;
    const history = await redis.lrange(key, 0, 4); // 获取最近5条记录
    return history.reverse().join('\n');
  }

  async saveInteraction(userId, groupId, userMessage, botReply) {
    const key = `memory:${groupId}:${userId}`;
    const record = `用户: ${userMessage}\n榴莲: ${botReply}`;
    await redis.lpush(key, record);
    await redis.ltrim(key, 0, 19); // 只保留最近20条
  }
}